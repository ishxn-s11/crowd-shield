/**
 * VenueTwin — Interactive 3D Digital Twin of the venue
 * 
 * Renders an isometric top-down view of the venue with:
 * - 3D perspective via canvas transforms
 * - Interactive zone polygons with real-time risk coloring
 * - Animated crowd flow particles
 * - Heatmap overlays based on density
 * - Gate markers with entry/exit indicators
 * - Click-to-inspect zones
 * - Ambient crowd movement animation
 */
import { useEffect, useRef, useCallback, useState } from 'react';

interface ZoneData {
  name: string;
  risk_score: number;
  risk_level: string;
  person_count: number;
  density: number;
  avg_velocity: number;
  flow_conflict: number;
  bottleneck_score: number;
  capacity: number;
}

interface VenueZone {
  id: string;
  name: string;
  // Polygon points in 0-1 space
  points: { x: number; y: number }[];
  gates: { x: number; y: number; label: string }[];
  capacity: number;
  center: { x: number; y: number };
}

const VENUE_ZONES: VenueZone[] = [
  {
    id: 'Z1', name: 'Main Entrance',
    points: [{ x: 0.35, y: 0.05 }, { x: 0.55, y: 0.05 }, { x: 0.58, y: 0.18 }, { x: 0.32, y: 0.18 }],
    gates: [{ x: 0.45, y: 0.03, label: 'G1' }, { x: 0.52, y: 0.03, label: 'G2' }],
    capacity: 500,
    center: { x: 0.45, y: 0.11 },
  },
  {
    id: 'Z2', name: 'North Corridor',
    points: [{ x: 0.25, y: 0.18 }, { x: 0.65, y: 0.18 }, { x: 0.68, y: 0.28 }, { x: 0.22, y: 0.28 }],
    gates: [{ x: 0.45, y: 0.17, label: 'G3' }],
    capacity: 400,
    center: { x: 0.45, y: 0.23 },
  },
  {
    id: 'Z3', name: 'Food Court',
    points: [{ x: 0.05, y: 0.28 }, { x: 0.30, y: 0.28 }, { x: 0.28, y: 0.48 }, { x: 0.05, y: 0.45 }],
    gates: [],
    capacity: 300,
    center: { x: 0.17, y: 0.38 },
  },
  {
    id: 'Z4', name: 'East Wing',
    points: [{ x: 0.60, y: 0.28 }, { x: 0.92, y: 0.28 }, { x: 0.95, y: 0.50 }, { x: 0.62, y: 0.48 }],
    gates: [{ x: 0.94, y: 0.35, label: 'G4' }],
    capacity: 350,
    center: { x: 0.78, y: 0.39 },
  },
  {
    id: 'Z5', name: 'Central Plaza',
    points: [{ x: 0.30, y: 0.40 }, { x: 0.60, y: 0.40 }, { x: 0.62, y: 0.65 }, { x: 0.28, y: 0.65 }],
    gates: [{ x: 0.45, y: 0.66, label: 'G5' }],
    capacity: 600,
    center: { x: 0.45, y: 0.52 },
  },
  {
    id: 'Z6', name: 'Stadium',
    points: [{ x: 0.30, y: 0.68 }, { x: 0.70, y: 0.68 }, { x: 0.72, y: 0.92 }, { x: 0.28, y: 0.92 }],
    gates: [{ x: 0.40, y: 0.93, label: 'G6' }, { x: 0.55, y: 0.93, label: 'G7' }],
    capacity: 1000,
    center: { x: 0.50, y: 0.80 },
  },
  {
    id: 'Z7', name: 'Parking Area',
    points: [{ x: 0.02, y: 0.55 }, { x: 0.25, y: 0.55 }, { x: 0.25, y: 0.92 }, { x: 0.02, y: 0.92 }],
    gates: [{ x: 0.01, y: 0.70, label: 'G8' }],
    capacity: 400,
    center: { x: 0.13, y: 0.74 },
  },
];

const RISK_COLORS: Record<string, string> = {
  LOW: '#5cb85c',
  MODERATE: '#B5AC8A',
  HIGH: '#d4813a',
  CRITICAL: '#C50022',
};

const RISK_GLOW: Record<string, string> = {
  LOW: 'rgba(92, 184, 92, 0.25)',
  MODERATE: 'rgba(181, 172, 138, 0.25)',
  HIGH: 'rgba(212, 129, 58, 0.3)',
  CRITICAL: 'rgba(197, 0, 34, 0.35)',
};

interface VenueTwinProps {
  zones: Record<string, ZoneData>;
  selected: string;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}

export default function VenueTwin({ zones, selected, onSelect, style }: VenueTwinProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; zone: string; life: number; maxLife: number }>>([]);
  const hoverRef = useRef<string>('');
  const [hovered, setHovered] = useState<string>('');

  // Initialize crowd flow particles
  useEffect(() => {
    const particles: typeof particlesRef.current = [];
    VENUE_ZONES.forEach(zone => {
      const count = Math.min(30, Math.max(5, Math.floor(zone.capacity / 50)));
      for (let i = 0; i < count; i++) {
        const cx = zone.center.x + (Math.random() - 0.5) * 0.12;
        const cy = zone.center.y + (Math.random() - 0.5) * 0.12;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.0003 + Math.random() * 0.0005;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          zone: zone.id,
          life: Math.random() * 200,
          maxLife: 150 + Math.random() * 100,
        });
      }
    });
    particlesRef.current = particles;
  }, []);

  // Hit test
  const hitTest = useCallback((mx: number, my: number, w: number, h: number): string => {
    for (const zone of VENUE_ZONES) {
      const { points } = zone;
      // Scale to canvas
      const px = mx / w;
      const py = my / h;
      // Point-in-polygon
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      if (inside) return zone.id;
    }
    return '';
  }, []);

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const hit = hitTest(mx, my, canvas.width, canvas.height);
    hoverRef.current = hit;
    setHovered(hit);
    canvas.style.cursor = hit ? 'pointer' : 'default';
  }, [hitTest]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    const hit = hitTest(mx, my, canvas.width, canvas.height);
    if (hit) onSelect(hit);
  }, [hitTest, onSelect]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = 0;
    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeRef.current += dt;

      // Handle DPR
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rw = rect.width;
      const rh = rect.height;

      // Clear
      ctx.clearRect(0, 0, rw, rh);

      // Background grid
      ctx.strokeStyle = 'rgba(181, 172, 138, 0.06)';
      ctx.lineWidth = 0.5;
      const gridSize = 30;
      for (let x = 0; x < rw; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rh); ctx.stroke();
      }
      for (let y = 0; y < rh; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rw, y); ctx.stroke();
      }

      // Draw venue outline (subtle)
      ctx.strokeStyle = 'rgba(181, 172, 138, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0.02 * rw, 0.03 * rh);
      ctx.lineTo(0.97 * rw, 0.03 * rh);
      ctx.lineTo(0.97 * rw, 0.95 * rh);
      ctx.lineTo(0.02 * rw, 0.95 * rh);
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw zones
      VENUE_ZONES.forEach(zone => {
        const data = zones[zone.id];
        const isSelected = selected === zone.id;
        const isHovered = hoverRef.current === zone.id;
        const risk = data?.risk_level || 'LOW';
        const color = RISK_COLORS[risk];
        const glow = RISK_GLOW[risk];
        const personCount = data?.person_count || 0;
        const density = data?.density || 0;
        const fillAlpha = Math.min(0.4, 0.08 + (data?.risk_score || 0) / 250);

        // Zone polygon
        ctx.beginPath();
        zone.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x * rw, p.y * rh);
          else ctx.lineTo(p.x * rw, p.y * rh);
        });
        ctx.closePath();

        // Fill with risk color
        ctx.fillStyle = color + Math.round(fillAlpha * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Border
        ctx.strokeStyle = isSelected ? color : isHovered ? color + 'aa' : color + '50';
        ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
        ctx.stroke();

        // Glow for selected
        if (isSelected) {
          ctx.shadowColor = glow;
          ctx.shadowBlur = 20;
          ctx.strokeStyle = color + '60';
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Heatmap overlay based on density
        if (density > 0) {
          const intensity = Math.min(1, density / 4);
          const cx = zone.center.x * rw;
          const cy = zone.center.y * rh;
          const radius = Math.min(rw, rh) * 0.15 * intensity;
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, color + Math.round(intensity * 80).toString(16).padStart(2, '0'));
          gradient.addColorStop(1, color + '00');
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Zone label
        const cx = zone.center.x * rw;
        const cy = zone.center.y * rh;
        
        // Zone name
        ctx.fillStyle = '#e8e4dd';
        ctx.font = `bold ${isSelected ? 13 : 11}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.name, cx, cy - 12);

        // Risk score
        ctx.fillStyle = color;
        ctx.font = `800 ${isSelected ? 22 : 16}px 'Syne', sans-serif`;
        ctx.fillText(data ? String(Math.round(data.risk_score)) : '—', cx, cy + 6);

        // Person count
        ctx.fillStyle = '#9a9588';
        ctx.font = `${isSelected ? 11 : 9}px 'Space Grotesk', sans-serif`;
        ctx.fillText(`${personCount} people`, cx, cy + 22);

        // Density bar
        if (data) {
          const barW = 50;
          const barH = 3;
          const barX = cx - barW / 2;
          const barY = cy + 32;
          const fill = Math.min(1, density / 4);
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = color + '80';
          ctx.fillRect(barX, barY, barW * fill, barH);
        }
      });

      // Draw gates
      VENUE_ZONES.forEach(zone => {
        zone.gates.forEach(gate => {
          const gx = gate.x * rw;
          const gy = gate.y * rh;

          // Gate diamond
          ctx.beginPath();
          ctx.moveTo(gx, gy - 6);
          ctx.lineTo(gx + 5, gy);
          ctx.lineTo(gx, gy + 6);
          ctx.lineTo(gx - 5, gy);
          ctx.closePath();
          ctx.fillStyle = '#C5002280';
          ctx.fill();
          ctx.strokeStyle = '#C50022';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Gate label
          ctx.fillStyle = '#C50022';
          ctx.font = "bold 8px 'Space Grotesk', sans-serif";
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(gate.label, gx, gy);
        });
      });

      // Animate crowd particles
      const particles = particlesRef.current;
      particles.forEach(p => {
        p.life += 1;
        if (p.life > p.maxLife) {
          // Respawn within zone
          const zone = VENUE_ZONES.find(z => z.id === p.zone);
          if (zone) {
            p.x = zone.center.x + (Math.random() - 0.5) * 0.12;
            p.y = zone.center.y + (Math.random() - 0.5) * 0.12;
            const angle = Math.random() * Math.PI * 2;
            p.vx = Math.cos(angle) * 0.0003;
            p.vy = Math.sin(angle) * 0.0003;
            p.life = 0;
          }
        }
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off zone bounds
        const zone = VENUE_ZONES.find(z => z.id === p.zone);
        if (zone) {
          const minX = Math.min(...zone.points.map(pt => pt.x));
          const maxX = Math.max(...zone.points.map(pt => pt.x));
          const minY = Math.min(...zone.points.map(pt => pt.y));
          const maxY = Math.max(...zone.points.map(pt => pt.y));
          if (p.x < minX || p.x > maxX) p.vx *= -1;
          if (p.y < minY || p.y > maxY) p.vy *= -1;
          p.x = Math.max(minX, Math.min(maxX, p.x));
          p.y = Math.max(minY, Math.min(maxY, p.y));
        }

        // Draw particle
        const px = p.x * rw;
        const py = p.y * rh;
        const data = zones[p.zone];
        const risk = data?.risk_level || 'LOW';
        const color = RISK_COLORS[risk];
        const alpha = Math.max(0, 1 - p.life / p.maxLife) * 0.6;
        
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      // Draw flow arrows between connected zones
      const connections: [string, string][] = [
        ['Z1', 'Z2'], ['Z2', 'Z3'], ['Z2', 'Z4'], ['Z2', 'Z5'],
        ['Z5', 'Z6'], ['Z3', 'Z7'], ['Z5', 'Z7'],
      ];
      connections.forEach(([fromId, toId]) => {
        const from = VENUE_ZONES.find(z => z.id === fromId);
        const to = VENUE_ZONES.find(z => z.id === toId);
        if (!from || !to) return;
        const fx = from.center.x * rw;
        const fy = from.center.y * rh;
        const tx = to.center.x * rw;
        const ty = to.center.y * rh;
        const mx = (fx + tx) / 2;
        const my = (fy + ty) / 2;

        // Animated dash
        const offset = (timeRef.current * 30) % 12;
        ctx.save();
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -offset;
        ctx.strokeStyle = 'rgba(181, 172, 138, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.restore();

        // Arrow head
        const angle = Math.atan2(ty - fy, tx - fx);
        const arrowSize = 5;
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(angle);
        ctx.fillStyle = 'rgba(181, 172, 138, 0.2)';
        ctx.beginPath();
        ctx.moveTo(arrowSize, 0);
        ctx.lineTo(-arrowSize, -arrowSize * 0.6);
        ctx.lineTo(-arrowSize, arrowSize * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Title
      ctx.fillStyle = '#6b6760';
      ctx.font = "600 10px 'Space Grotesk', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText('VENUE DIGITAL TWIN', 12, 16);
      ctx.fillStyle = '#B5AC8A';
      ctx.fillText('● LIVE', 12, 30);

      // Total count
      const totalPeople = Object.values(zones).reduce((sum, z) => sum + (z.person_count || 0), 0);
      ctx.fillStyle = '#9a9588';
      ctx.textAlign = 'right';
      ctx.font = "600 10px 'Space Grotesk', sans-serif";
      ctx.fillText(`${totalPeople} people across ${VENUE_ZONES.length} zones`, rw - 12, 16);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [zones, selected]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{ width: '100%', height: '100%', display: 'block', borderRadius: 12 }}
      />
      {/* Tooltip */}
      {hovered && zones[hovered] && (
        <div style={{
          position: 'absolute',
          bottom: 12, left: 12,
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(181,172,138,0.2)',
          borderRadius: 10,
          fontSize: 12,
          color: '#e8e4dd',
          pointerEvents: 'none',
          zIndex: 10,
          minWidth: 160,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            {VENUE_ZONES.find(z => z.id === hovered)?.name}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
            <span style={{ color: '#9a9588' }}>People</span>
            <span style={{ fontWeight: 600 }}>{zones[hovered].person_count}</span>
            <span style={{ color: '#9a9588' }}>Density</span>
            <span style={{ fontWeight: 600 }}>{zones[hovered].density} p/m²</span>
            <span style={{ color: '#9a9588' }}>Risk</span>
            <span style={{ color: RISK_COLORS[zones[hovered].risk_level], fontWeight: 700 }}>
              {zones[hovered].risk_level} ({Math.round(zones[hovered].risk_score)})
            </span>
            <span style={{ color: '#9a9588' }}>Velocity</span>
            <span style={{ fontWeight: 600 }}>{zones[hovered].avg_velocity} m/s</span>
          </div>
        </div>
      )}
    </div>
  );
}
