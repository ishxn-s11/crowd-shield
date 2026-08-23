import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from './hooks';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import {
  Shield, AlertTriangle, Users, MapPin, Brain, Clock, Wifi, WifiOff,
  Send, Check, Activity, BarChart3, Target, Bell, Camera, Eye,
  User, LogOut, ChevronRight, Menu, X, Zap, Route as RouteIcon, ShieldAlert,
  Settings, FileText, Search, Plus, Trash2, Edit3, Globe, PhoneCall,
  MessageSquare, Download, ArrowUp, CheckCircle, Info, Megaphone, Smartphone,
  Monitor, Radio, CircleDot, RefreshCw, FileBarChart, TrendingUp
} from 'lucide-react';
import { LanguageSelector } from './i18n';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

import CursorRingField from './CursorRingField';
import PlasmaRing from './PlasmaRing';
import ChromaticWaves from './ChromaticWaves';
import HeroPage from './HeroPage';
import VenueTwin from './VenueTwin';
import EncryptButton from './EncryptButton';
import ErrorBoundary from './ErrorBoundary';

const API = '';

// ─── Auth Context (Clerk-backed) ─────────────────────────────

interface UserState {
  id: string; username: string; email: string; full_name: string; role: string;
}

// Lightweight wrapper around Clerk user metadata for role-based access
const AuthContext = {
  _user: null as UserState | null,
  _token: localStorage.getItem('cs_token') || '',
  getUser(): UserState | null { return this._user; },
  getToken(): string { return this._token; },
  setAuth(user: UserState, token: string) {
    this._user = user; this._token = token;
    localStorage.setItem('cs_token', token);
    localStorage.setItem('cs_user', JSON.stringify(user));
  },
  logout() {
    this._user = null; this._token = '';
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
  },
  loadUser() {
    const u = localStorage.getItem('cs_user');
    if (u) this._user = JSON.parse(u);
  },
  // Sync from Clerk user object
  syncFromClerk(clerkUser: any) {
    const meta = clerkUser?.unsafeMetadata || {};
    const role = (meta.role as string) || 'OPERATOR';
    const u: UserState = {
      id: clerkUser.id,
      username: clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress?.split('@')[0] || '',
      email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
      full_name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || meta.full_name || clerkUser.username || 'User',
      role,
    };
    this._user = u;
    localStorage.setItem('cs_user', JSON.stringify(u));
  },
};
AuthContext.loadUser();

async function apiFetch(path: string, options?: RequestInit) {
  const headers: any = { 'Content-Type': 'application/json', ...options?.headers };
  if (AuthContext.getToken()) headers['Authorization'] = `Bearer ${AuthContext.getToken()}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) { AuthContext.logout(); window.location.href = '/login'; }
  return res;
}

// ─── Layout ───────────────────────────────────────────────────

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = AuthContext.getUser();

  const role = user?.role || 'OPERATOR';
  const isCommander = role === 'ADMIN' || role === 'COMMANDER';

  const navItems = [
    { path: '/', icon: MapPin, label: 'Dashboard', color: 'var(--cs-red)' },
    { path: '/zones', icon: BarChart3, label: 'Zones', color: '#B5AC8A' },
    { path: '/cameras', icon: Camera, label: 'Cameras', color: '#C50022', commanderOnly: true },
    { path: '/live-monitor', icon: Eye, label: 'Live Monitor', color: '#B5AC8A', commanderOnly: true },
    { path: '/device-camera', icon: Eye, label: 'Device Camera', color: '#C50022' },
    { path: '/alerts', icon: Bell, label: 'Alerts', color: '#C50022' },
    { path: '/missing', icon: Search, label: 'Missing Reports', color: '#B5AC8A' },
    { path: '/incidents', icon: ShieldAlert, label: 'Incidents', color: '#C50022', commanderOnly: true },
    { path: '/assistant', icon: Brain, label: 'AI Assistant', color: '#B5AC8A', commanderOnly: true },
    { divider: true, commanderOnly: true },
    { path: '/teams', icon: Users, label: 'Response Teams', color: '#C50022', commanderOnly: true },
    { divider: true },
    { path: '/urgent-contact', icon: PhoneCall, label: 'Urgent Contact', color: '#C50022' },
    { path: '/notifications', icon: Bell, label: 'Notifications', color: '#B5AC8A' },
    { path: '/analysis-reports', icon: FileBarChart, label: 'Analysis Reports', color: '#B5AC8A', commanderOnly: true },
    { path: '/profile', icon: User, label: 'My Profile', color: 'var(--cs-text-muted)' },
  ].filter(item => !item.commanderOnly || isCommander);

  return (
    <div style={{
      width: collapsed ? 60 : 220, background: 'var(--cs-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRight: '1px solid var(--cs-glass-border)', boxShadow: 'var(--cs-neuro-shadow)',
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0, overflow: 'hidden',
    }}>
      <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--cs-glass-border)' }}>
        <Shield size={22} color="var(--cs-red)" />
        {!collapsed && <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--cs-text-bright)', letterSpacing: '0.05em' }}>CROWDSHIELD</span>}
        <button onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--cs-text-muted)', cursor: 'pointer' }}>
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '8px 0', overflow: 'auto' }}>
        {navItems.map((item, i) => {
          if ('divider' in item && item.divider) return <div key={i} style={{ height: 1, background: 'var(--cs-glass-border)', margin: '8px 12px' }} />;
          const active = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px 12px' : '10px 16px',
              color: active ? item.color : 'var(--cs-text-dim)', textDecoration: 'none', fontSize: 13, fontWeight: active ? 600 : 400,
              background: active ? item.color + '10' : 'transparent', borderRight: active ? `3px solid ${item.color}` : '3px solid transparent',
              transition: 'all 0.15s',
            }}>
              <div className="neuro-icon neuro-icon-sm" style={{ background: active ? item.color + '18' : 'transparent', borderColor: active ? item.color + '40' : 'transparent', boxShadow: active ? `0 0 8px ${item.color}20` : 'none' }}>
                <item.icon size={16} color={active ? item.color : 'var(--cs-text-dim)'} />
              </div>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div style={{ padding: 12, borderTop: '1px solid var(--cs-glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Globe size={14} color="var(--cs-beige)" />
            <LanguageSelector compact />
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="neuro-icon neuro-icon-sm" style={{ borderRadius: 16, width: 32, height: 32, background: 'var(--cs-red-glow)', border: '1px solid var(--cs-red-dim)' }}>
                <User size={16} color="var(--cs-red)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cs-text-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || 'User'}</div>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{user.role || 'OPERATOR'}</div>
              </div>
            </div>
          ) : (
            <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--cs-red-dim)', background: 'var(--cs-red-glow)', color: 'var(--cs-red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Sign In
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [state, setState] = useState<any>(null);
  const isMobile = useIsMobile();
  useEffect(() => {
    fetch(`${API}/api/risk/live`).then(r => r.json()).then(setState).catch(() => {});
    const iv = setInterval(() => fetch(`${API}/api/risk/live`).then(r => r.json()).then(setState).catch(() => {}), 3000);
    return () => clearInterval(iv);
  }, []);

  const riskLevel = state?.overall_risk_level || 'LOW';
  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#B5AC8A', CRITICAL: '#C50022' };

  return (
    <header style={{
      height: 48, padding: isMobile ? '0 10px' : '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--cs-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid var(--cs-glass-border)', flexShrink: 0, gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, minWidth: 0 }}>
        {onMenuClick && (
          <button onClick={onMenuClick} style={{ background: 'none', border: 'none', color: 'var(--cs-text-bright)', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
            <Menu size={20} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6,
          background: riskColor[riskLevel] + '20', border: `1px solid ${riskColor[riskLevel]}50`, flexShrink: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: riskColor[riskLevel] }} />
          <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: riskColor[riskLevel] }}>
            {Math.round(state?.overall_risk || 0)} / 100 — {riskLevel}
          </span>
        </div>
        {!isMobile && <span style={{ fontSize: 12, color: 'var(--cs-text-dim)' }}>7 zones monitored</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#5cb85c' }}>● LIVE</span>
      </div>
    </header>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  const loc = useLocation();
  useEffect(() => { setMobileOpen(false); }, [loc.pathname]);

  return (
    <div style={{ position: 'relative', height: '100vh', background: 'var(--cs-bg)', overflow: 'hidden' }}>
      <CursorRingField
        background="#0a0e17"
        colors={["#7189ff", "#3074f9", "#1a1a2e"]}
        density={200}
        dotSize={80}
        speed={4}
        cameraDistance={160}
        ring={{ push: 30, width: 9, radius: 12, turbulence: 80 }}
        style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 0.25 }}
      />
      <div style={{ display: 'flex', height: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Mobile backdrop */}
        {isMobile && mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
        )}
        {/* Sidebar */}
        {isMobile ? (
          <div style={{
            position: 'fixed', left: mobileOpen ? 0 : -240, top: 0, bottom: 0, width: 240,
            zIndex: 100, transition: 'left 0.25s ease', background: 'rgba(0,0,0,0.4)',
            borderRight: '1px solid var(--cs-glass-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <Sidebar collapsed={false} setCollapsed={() => setMobileOpen(false)} />
          </div>
        ) : (
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Header onMenuClick={isMobile ? () => setMobileOpen(!mobileOpen) : undefined} />
          <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 8 : 16 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Login / Register Pages (Clerk) ───────────────────────

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--cs-bg)', position: 'relative', overflow: 'hidden' }}>
      <ChromaticWaves colors={['#1a0005', '#0d0800', '#1a1508']} intensity={0.4} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: 24 }}>
        <div className="neuro-icon neuro-icon-lg" style={{ margin: '0 auto 12px', borderRadius: 20, width: 64, height: 64, background: 'var(--cs-red-glow)', borderColor: 'rgba(197,0,34,0.3)' }}>
          <Shield size={32} color="var(--cs-red)" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--cs-text-bright)' }}>CROWDSHIELD</h1>
        <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginTop: 4 }}>AI-Powered Crowd Safety Platform</p>
      </div>

      {/* Tab switcher */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', marginBottom: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3, border: '1px solid var(--cs-glass-border)' }}>
        {[{ key: false, label: 'Sign In' }, { key: true, label: 'Create Account' }].map(tab => (
          <button key={String(tab.key)} onClick={() => setIsRegister(tab.key)}
            style={{
              flex: 1, padding: '8px 20px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: isRegister === tab.key ? 'var(--cs-red)' : 'transparent',
              color: isRegister === tab.key ? 'white' : 'var(--cs-text-muted)',
            }}>{tab.label}</button>
        ))}
      </div>

      {/* Login / Register Form */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '0 16px' }}>
        <div className="neuro-glass-static" style={{ padding: isMobile ? 20 : 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--cs-text-bright)', textAlign: 'center', marginBottom: 20 }}>
            {isRegister ? 'Create Account' : 'Sign in to CrowdShield'}
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); AuthContext.syncFromClerk({ id: 'dev-user', username: 'commander', emailAddresses: [{ emailAddress: 'dev@crowdshield.io' }], firstName: 'Dev', lastName: 'User', unsafeMetadata: { role: 'COMMANDER' } }); navigate('/app'); }}>
            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={{ fontSize: 11, color: 'var(--cs-text-dim)', display: 'block', marginBottom: 4 }}>First Name</label><input className="neuro-input" placeholder="First name" /></div>
                <div><label style={{ fontSize: 11, color: 'var(--cs-text-dim)', display: 'block', marginBottom: 4 }}>Last Name</label><input className="neuro-input" placeholder="Last name" /></div>
              </div>
            )}
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: 'var(--cs-text-dim)', display: 'block', marginBottom: 4 }}>Email</label><input className="neuro-input" type="email" placeholder="Enter your email" required /></div>
            <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: 'var(--cs-text-dim)', display: 'block', marginBottom: 4 }}>Password</label><input className="neuro-input" type="password" placeholder="Enter password" required /></div>
            <button type="submit" className="neuro-btn neuro-btn-primary" style={{ width: '100%', marginTop: 8, padding: 12 }}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--cs-text-muted)' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'var(--cs-red)', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>

      {/* Back to home */}
      <button onClick={() => navigate('/')} style={{ position: 'relative', zIndex: 1, marginTop: 16, background: 'none', border: 'none', color: 'var(--cs-text-muted)', fontSize: 12, cursor: 'pointer' }}>
        ← Back to Home
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(181,172,138,0.18)',
  background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-bright)', fontSize: 13, marginBottom: 10, outline: 'none',
};

// ─── Timer helpers ──────────────────────────────────────────

function ElapsedTimer({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [createdAt]);
  if (elapsed < 60) return <span>{elapsed}s ago</span>;
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return <span>{m}m {s}s ago</span>;
}

function ElapsedBar({ createdAt, maxSeconds = 300 }: { createdAt: string; maxSeconds?: number }) {
  const [elapsed, setElapsed] = useState(() => Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [createdAt]);
  const pct = Math.min(100, (elapsed / maxSeconds) * 100);
  const color = pct > 80 ? '#C50022' : pct > 50 ? '#B5AC8A' : pct > 25 ? '#B5AC8A' : 'var(--cs-red)';
  return (
    <div style={{ width: '100%', height: 3, background: 'var(--cs-glass-border)', borderRadius: 2, marginTop: 4 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 1s linear' }} />
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────

function DashboardPage() {
  const [state, setState] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const dismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    fetch(`${API}/api/alerts/${alertId}/acknowledge`, { method: 'POST' }).catch(() => {});
  };

  useEffect(() => {
    const load = () => {
      fetch(`${API}/api/risk/live`).then(r => r.json()).then(setState).catch(() => {});
      fetch(`${API}/api/alerts/active`).then(r => r.json()).then(setAlerts).catch(() => {});
    };
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, []);

  const user = AuthContext.getUser();
  const role = user?.role || 'OPERATOR';
  const isCommander = role === 'ADMIN' || role === 'COMMANDER';
  const [simRunning, setSimRunning] = useState<boolean | null>(null);
  const [selected, setSelected] = useState<string>('Z5');

  useEffect(() => {
    fetch(`${API}/api/simulation/state`).then(r => r.json()).then(d => setSimRunning(d.is_running)).catch(() => {});
  }, []);

  const stopSim = async () => {
    await fetch(`${API}/api/simulation/stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    setSimRunning(false);
  };
  const startSim = async (scenario: string) => {
    await fetch(`${API}/api/simulation/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario }) });
    setSimRunning(true);
  };

  const riskLevel = state?.overall_risk_level || 'LOW';
  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#B5AC8A', CRITICAL: '#C50022' };
  const zones = state?.zones || {};
  const score = state?.overall_risk || 0;

  const zoneColors = Object.values(zones).map((z: any) => riskColor[z.risk_level] || 'var(--cs-text-muted)');
  const zoneNames = Object.keys(zones);
  const zoneScores = Object.values(zones).map((z: any) => z.risk_score);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isCommander ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: 16, height: '100%' }}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Risk Gauge */}
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Overall Risk Score</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle cx={60} cy={60} r={50} fill="none" stroke="var(--cs-glass-border)" strokeWidth="8" />
                <circle cx={60} cy={60} r={50} fill="none" stroke={riskColor[riskLevel]} strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50 * (1 - score / 100)}
                  strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: riskColor[riskLevel] }}>{Math.round(score)}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: riskColor[riskLevel] }}>{riskLevel}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--cs-text-dim)', lineHeight: 1.6 }}>
                {riskLevel === 'CRITICAL' ? 'Immediate action required. Multiple zones at dangerous density levels.' :
                 riskLevel === 'HIGH' ? 'Heightened alert. Several zones approaching critical thresholds.' :
                 riskLevel === 'MODERATE' ? 'Monitoring elevated conditions. Some zones above normal.' :
                 'All zones within safe operating parameters.'}
              </p>
            </div>
          </div>
        </div>

        {/* Zone Chart */}
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)', flex: 1 }}>
          <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Zone Risk Levels</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
            {Object.entries(zones).map(([zid, z]: [string, any]) => (
              <div key={zid} style={{ padding: 10, borderRadius: 6, background: 'rgba(0,0,0,0.4)', borderLeft: `2px solid ${riskColor[z.risk_level]}` }}>
                <div style={{ fontSize: 11, color: 'var(--cs-text-dim)' }}>{z.name || zid}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: riskColor[z.risk_level] }}>{Math.round(z.risk_score)}</span>
                  <span style={{ fontSize: 10, color: riskColor[z.risk_level] }}>{z.risk_level}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 2 }}>{z.person_count} people</div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Twin Overview for Commanders */}
        {isCommander && (
        <Link to="/zones" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'var(--cs-glass)', borderRadius: 16, border: '1px solid var(--cs-glass-border)', height: 280, overflow: 'hidden', cursor: 'pointer', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)', transition: 'border-color 0.2s' }}
            onMouseEnter={(e: any) => e.currentTarget.style.borderColor = 'rgba(197,0,34,0.3)'}
            onMouseLeave={(e: any) => e.currentTarget.style.borderColor = 'var(--cs-glass-border)'}>
            <VenueTwin zones={zones} selected={selected || 'Z5'} onSelect={() => {}} style={{ pointerEvents: 'none' }} />
          </div>
        </Link>
        )}
      </div>

      {/* Right Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Alerts */}
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Alerts</h3>
            <Link to="/alerts" style={{ fontSize: 11, color: 'var(--cs-red)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {alerts.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>No active alerts</div>
              <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 4 }}>All zones operating normally</div>
            </div>
          ) : alerts.map((a: any) => (
            <div key={a.id} style={{ padding: '10px 12px', marginBottom: 6, borderRadius: 8, background: 'rgba(0,0,0,0.4)',
              borderLeft: `2px solid ${a.severity === 'CRITICAL' ? '#C50022' : '#B5AC8A'}`, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: a.severity === 'CRITICAL' ? '#C50022' : '#B5AC8A',
                    padding: '1px 6px', borderRadius: 3, background: (a.severity === 'CRITICAL' ? '#C50022' : '#B5AC8A') + '15', flexShrink: 0 }}>
                    {a.severity}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--cs-text)', flex: 1 }}>{a.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: 'var(--cs-text-muted)', fontFamily: 'monospace' }}>
                    <ElapsedTimer createdAt={a.created_at} />
                  </span>
                  <button onClick={() => dismissAlert(a.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--cs-text-muted)', cursor: 'pointer', padding: '2px 4px', fontSize: 14, lineHeight: 1 }}
                    title="Dismiss">
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginTop: 4 }}>{a.zone_id} — {a.message}</div>
              <ElapsedBar createdAt={a.created_at} />
            </div>
          ))}
        </div>

        {/* Commander-only: Simulation Controls */}
        {isCommander && (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={14} color="#f59e0b" />
            <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Simulation Controls</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '6px 10px', borderRadius: 6, background: simRunning ? '#5cb85c15' : 'var(--cs-text-muted)15', border: `1px solid ${simRunning ? '#5cb85c40' : 'rgba(181,172,138,0.18)'}` }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: simRunning ? '#5cb85c' : 'var(--cs-text-muted)', animation: simRunning ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: simRunning ? '#5cb85c' : 'var(--cs-text-muted)' }}>
              {simRunning ? 'Simulation Running' : 'No Active Simulation'}
            </span>
          </div>           <div className="grid-2col" style={{ gap: 6 }}>
            {[{ key: 'normal', label: 'Normal Crowd', color: '#5cb85c' }, { key: 'rising_density', label: 'Rising Density', color: '#B5AC8A' },
              { key: 'crowd_surge', label: 'Crowd Surge', color: '#C50022' }, { key: 'gate_blocked', label: 'Gate Blocked', color: '#B5AC8A' },
              { key: 'reverse_flow', label: 'Reverse Flow', color: '#B5AC8A' }, { key: 'panic_like', label: 'Panic-Like', color: '#dc2626' },
              { key: 'recovery', label: 'Recovery', color: '#5cb85c' },
            ].map(s => (
              <button key={s.key} onClick={() => startSim(s.key)}
                style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${s.color}40`, background: s.color + '10',
                  color: s.color, fontSize: 11, fontWeight: 600, cursor: 'pointer', textAlign: 'left', opacity: simRunning === false ? 1 : 0.6 }}>
                {s.label}
              </button>
            ))}
          </div>
          <EncryptButton
            active={simRunning === true}
            inactiveLabel="START SIMULATION"
            activeLabel="STOP SIMULATION"
            onToggle={() => { if (simRunning) stopSim(); else startSim('normal'); }}
          />
        </div>
        )}

        {/* Operator-only: Quick Status */}
        {!isCommander && (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Status Overview</h3>
          <div className="grid-2col" style={{ gap: 8 }}>
            {[
              { label: 'Zones Monitored', value: Object.keys(zones).length, color: 'var(--cs-red)' },
              { label: 'Active Alerts', value: alerts.length, color: alerts.length > 0 ? '#C50022' : '#5cb85c' },
              { label: 'Total Crowd', value: Object.values(zones).reduce((sum: number, z: any) => sum + (z.person_count || 0), 0), color: '#B5AC8A' },
              { label: 'Risk Level', value: riskLevel, color: riskColor[riskLevel] },
            ].map((item, i) => (
              <div key={i} style={{ padding: 10, borderRadius: 6, background: 'rgba(0,0,0,0.4)', borderLeft: `2px solid ${item.color}` }}>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: item.color, marginTop: 4 }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: 'rgba(0,0,0,0.4)', fontSize: 11, color: 'var(--cs-text-dim)' }}>
            <div style={{ fontWeight: 600, color: 'var(--cs-text)', marginBottom: 4 }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/device-camera" style={{ padding: '4px 10px', borderRadius: 4, background: 'var(--cs-red-glow)', color: 'var(--cs-red)', fontSize: 11, textDecoration: 'none' }}>📹 Camera Feed</Link>
              <Link to="/alerts" style={{ padding: '4px 10px', borderRadius: 4, background: '#C5002215', color: '#C50022', fontSize: 11, textDecoration: 'none' }}>🔔 View Alerts</Link>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Zones Page ───────────────────────────────────────────────

/* ─── Zones with OpenStreetMap ─────────────────────────────────────── */

// Leaflet CSS loaded once
if (!document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

// Venue zones mapped to real-world coordinates near a stadium-like area
const ZONE_COORDS: Record<string, { lat: number; lng: number; name: string; capacity: number; gates: string[] }> = {
  Z1: { lat: 51.5558, lng: -0.2795, name: 'Main Entrance', capacity: 500, gates: ['G1', 'G2'] },
  Z2: { lat: 51.5563, lng: -0.2785, name: 'North Corridor', capacity: 400, gates: ['G3'] },
  Z3: { lat: 51.5560, lng: -0.2800, name: 'Food Court', capacity: 300, gates: [] },
  Z4: { lat: 51.5555, lng: -0.2780, name: 'East Wing', capacity: 350, gates: ['G4'] },
  Z5: { lat: 51.5552, lng: -0.2790, name: 'Central Plaza', capacity: 600, gates: ['G5'] },
  Z6: { lat: 51.5558, lng: -0.2775, name: 'Stadium', capacity: 1000, gates: ['G6', 'G7'] },
  Z7: { lat: 51.5562, lng: -0.2798, name: 'Parking Area', capacity: 400, gates: ['G8'] },
};

function LeafletMap({ zones, selected, onSelect }: { zones: any; selected: string; onSelect: (id: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#B5AC8A', CRITICAL: '#C50022' };

  useEffect(() => {
    let cancelled = false;
    let iv: any;
    const tryInit = () => {
      if (cancelled) return;
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstanceRef.current) {
        if (!L) return; // still loading
      }
      if (cancelled) return;
      if (mapInstanceRef.current) return; // already created
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [51.5558, -0.2790],
        zoom: 17,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ prefix: '© OpenStreetMap' }).addTo(map);

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      mapInstanceRef.current = map;
      if (iv) clearInterval(iv);
    };

    // Try immediately, then poll every 200ms until Leaflet loads
    tryInit();
    if (!mapInstanceRef.current) {
      iv = setInterval(tryInit, 200);
    }

    return () => {
      cancelled = true;
      if (iv) clearInterval(iv);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    const allZones = Object.keys(ZONE_COORDS);
    allZones.forEach(zid => {
      const coords = ZONE_COORDS[zid];
      const z = zones[zid];
      const risk = z?.risk_level || 'LOW';
      const color = riskColor[risk];
      const people = z?.person_count || 0;
      const riskScore = z ? Math.round(z.risk_score) : 0;

      const size = Math.max(20, Math.min(50, 20 + people * 0.05));

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: ${size}px; height: ${size}px;
            border-radius: 50%;
            background: ${color}30;
            border: 2px solid ${color};
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: 700; color: ${color};
            cursor: pointer;
            box-shadow: 0 0 ${selected === zid ? 20 : 8}px ${color}60;
            transition: all 0.3s;
            ${selected === zid ? 'transform: scale(1.3); border-width: 3px;' : ''}
          ">
            ${riskScore}
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon }).addTo(map);
      marker.on('click', () => onSelect(zid));

      marker.bindTooltip(
        `<div style="font-family:system-ui;min-width:140px">
          <div style="font-weight:700;font-size:13px;margin-bottom:4px">${coords.name}</div>
          <div style="font-size:11px;color:#666">${zid} · ${people} people · Risk ${riskScore}</div>
          <div style="font-size:11px;color:${color};font-weight:600;margin-top:2px">${risk}</div>
          ${coords.gates.length > 0 ? `<div style="font-size:10px;color:#999;margin-top:4px">Gates: ${coords.gates.join(', ')}</div>` : ''}
        </div>`,
        { className: 'zone-tooltip', direction: 'top', offset: [0, -size / 2] }
      );

      markersRef.current.push(marker);

      // Draw gate markers
      coords.gates.forEach((gate, gi) => {
        const angle = (gi / Math.max(1, coords.gates.length)) * Math.PI * 2;
        const gLat = coords.lat + Math.cos(angle) * 0.00015;
        const gLng = coords.lng + Math.sin(angle) * 0.00015;
        const gateIcon = L.divIcon({
          className: '',
          html: `<div style="background:var(--cs-red);color:white;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700;white-space:nowrap;border:1px solid var(--cs-red)80">${gate}</div>`,
          iconSize: [40, 16],
          iconAnchor: [20, 8],
        });
        const gateMarker = L.marker([gLat, gLng], { icon: gateIcon }).addTo(map);
        markersRef.current.push(gateMarker);
      });
    });
  }, [zones, selected, onSelect]);

  // Center on selected zone
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !selected || !ZONE_COORDS[selected]) return;
    const c = ZONE_COORDS[selected];
    map.flyTo([c.lat, c.lng], 18, { duration: 0.5 });
  }, [selected]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 8 }} />;
}

function ZonesPage() {
  const [state, setState] = useState<any>(null);
  const [selected, setSelected] = useState<string>('');
  const isMobile = useIsMobile();

  useEffect(() => {
    const load = () => fetch(`${API}/api/risk/live`).then(r => r.json()).then(setState).catch(() => {});
    load(); const iv = setInterval(load, 3000); return () => clearInterval(iv);
  }, []);

  // Load Leaflet JS
  useEffect(() => {
    if ((window as any).L) return;
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {};
    document.head.appendChild(script);
  }, []);

  const zones = state?.zones || {};
  const sel = zones[selected];
  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#B5AC8A', CRITICAL: '#C50022' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, height: isMobile ? 'auto' : '100%' }}>
      {/* Zone List */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 10, overflow: 'auto', border: '1px solid var(--cs-glass-border)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cs-glass-border)', fontSize: 12, fontWeight: 700, color: 'var(--cs-text-dim)', textTransform: 'uppercase' }}>Zones</div>
        {Object.entries(zones).map(([zid, z]: [string, any]) => (
          <div key={zid} onClick={() => setSelected(zid)} style={{
            padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--cs-glass-border)',
            background: selected === zid ? '#1e3a5f' : 'transparent', borderLeft: selected === zid ? `2px solid ${riskColor[z.risk_level]}` : '2px solid transparent',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{z.name || zid}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: riskColor[z.risk_level] }}>{Math.round(z.risk_score)}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 2 }}>{z.person_count} people · {z.density} p/m²</div>
            {ZONE_COORDS[zid] && (
              <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 2 }}>
                📍 {ZONE_COORDS[zid].lat.toFixed(4)}, {ZONE_COORDS[zid].lng.toFixed(4)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Map + Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Digital Twin */}
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, border: '1px solid var(--cs-glass-border)', flex: 1, minHeight: 400, overflow: 'hidden', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <VenueTwin zones={zones} selected={selected} onSelect={setSelected} />
        </div>

        {/* Zone Details */}
        {sel && (
          <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{sel.name || selected}</h2>
              <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 4, background: riskColor[sel.risk_level] + '20', color: riskColor[sel.risk_level], fontWeight: 600 }}>{sel.risk_level}</span>
              {ZONE_COORDS[selected] && (
                <span style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>
                  📍 {ZONE_COORDS[selected].lat.toFixed(4)}, {ZONE_COORDS[selected].lng.toFixed(4)}
                  {ZONE_COORDS[selected].gates.length > 0 && ` · Gates: ${ZONE_COORDS[selected].gates.join(', ')}`}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)', gap: 12 }}>
              {[{ label: 'Risk Score', value: Math.round(sel.risk_score), color: riskColor[sel.risk_level] },
                { label: 'People', value: sel.person_count, color: 'var(--cs-red)' },
                { label: 'Density', value: `${sel.density} p/m²`, color: '#B5AC8A' },
                { label: 'Avg Speed', value: `${sel.avg_velocity} m/s`, color: '#5cb85c' },
                { label: 'Flow Conflict', value: `${Math.round(sel.flow_conflict * 100)}%`, color: '#B5AC8A' },
                { label: 'Bottleneck', value: `${Math.round(sel.bottleneck_score * 100)}%`, color: '#C50022' },
              ].map((m, i) => (
                <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cameras Page ─────────────────────────────────────────────

function CamerasPage() {
  const [state, setState] = useState<any>(null);
  const [selectedCam, setSelectedCam] = useState<string>('CAM-01');
  const [ptzPos, setPtzPos] = useState({ pan: 0, tilt: 0, zoom: 1 });
  const isMobile = useIsMobile();

  useEffect(() => {
    const load = () => fetch(`${API}/api/risk/live`).then(r => r.json()).then(setState).catch(() => {});
    load(); const iv = setInterval(load, 3000); return () => clearInterval(iv);
  }, []);

  const zones = state?.zones || {};
  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#B5AC8A', CRITICAL: '#C50022' };

  const cameras = [
    { id: 'CAM-01', zone: 'Z1', type: 'Fixed Wide-Angle', resolution: '1920x1080', fps: 30, angle: '120°' },
    { id: 'CAM-02', zone: 'Z2', type: 'PTZ Dome', resolution: '1920x1080', fps: 25, angle: '360°' },
    { id: 'CAM-03', zone: 'Z3', type: 'Fixed Bullet', resolution: '1280x720', fps: 30, angle: '90°' },
    { id: 'CAM-04', zone: 'Z5', type: 'PTZ Dome', resolution: '1920x1080', fps: 25, angle: '360°' },
    { id: 'CAM-05', zone: 'Z6', type: 'Fixed Wide-Angle', resolution: '2560x1440', fps: 30, angle: '150°' },
  ];

  const cam = cameras.find(c => c.id === selectedCam) || cameras[0];
  const zone = zones[cam.zone];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 16, height: isMobile ? 'auto' : '100%' }}>
      {/* Main feed + controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Video viewport */}
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)', flex: 1 }}>
          <div style={{ background: '#000', height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Grid overlay */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
              <defs>
                <pattern id="camGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--cs-red)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#camGrid)" />
              {/* Crosshair */}
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="var(--cs-red)" strokeWidth="0.5" opacity="0.3" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--cs-red)" strokeWidth="0.5" opacity="0.3" />
              {/* Center circle */}
              <circle cx="50%" cy="50%" r="40" fill="none" stroke="var(--cs-red)" strokeWidth="0.5" opacity="0.3" />
              <circle cx="50%" cy="50%" r="80" fill="none" stroke="var(--cs-red)" strokeWidth="0.3" opacity="0.2" />
            </svg>

            {/* Camera icon + simulated feed pattern */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a14 70%, #000 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <Camera size={48} color="rgba(181,172,138,0.18)" />
              <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 8 }}>{cam.type}</div>
            </div>

            {/* HUD overlay - top left */}
            <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
              <div style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#C50022', background: '#00000090', animation: 'pulse 2s infinite' }}>● LIVE</div>
              <div style={{ marginTop: 4, padding: '3px 8px', borderRadius: 4, fontSize: 10, color: 'var(--cs-text-bright)', background: '#00000090' }}>{cam.id} · {cam.zone}</div>
            </div>

            {/* HUD overlay - top right */}
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, textAlign: 'right' }}>
              <div style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, color: 'var(--cs-text-dim)', background: '#00000090' }}>{cam.resolution} · {cam.fps}fps</div>
              <div style={{ marginTop: 4, padding: '3px 8px', borderRadius: 4, fontSize: 10, color: 'var(--cs-text-muted)', background: '#00000090' }}>{cam.angle} FOV</div>
            </div>

            {/* HUD overlay - bottom left: zone stats */}
            {zone && (
              <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 2, padding: '6px 10px', borderRadius: 6, background: '#00000090', backdropFilter: 'blur(4px)' }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: 'var(--cs-red)' }}>👥 {zone.person_count}</span>
                  <span style={{ color: riskColor[zone.risk_level] }}>⚠ {Math.round(zone.risk_score)}</span>
                  <span style={{ color: '#B5AC8A' }}>📊 {zone.density} p/m²</span>
                  <span style={{ color: '#5cb85c' }}>🚶 {zone.avg_velocity} m/s</span>
                </div>
              </div>
            )}

            {/* HUD overlay - bottom right: timestamp */}
            <div style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 2 }}>
              <div style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, color: 'var(--cs-text-muted)', background: '#00000090', fontFamily: 'monospace' }}>
                {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Camera controls bar */}
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--cs-glass-border)' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--cs-text-dim)' }}>PTZ Controls</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {['Pan ◀', 'Pan ▶', 'Tilt ▲', 'Tilt ▼', 'Zoom +', 'Zoom −'].map((label, i) => (
                <button key={i} onClick={() => setPtzPos(p => ({
                  ...p,
                  pan: i === 0 ? p.pan - 5 : i === 1 ? p.pan + 5 : p.pan,
                  tilt: i === 2 ? p.tilt - 5 : i === 3 ? p.tilt + 5 : p.tilt,
                  zoom: i === 4 ? Math.min(10, p.zoom + 0.5) : i === 5 ? Math.max(1, p.zoom - 0.5) : p.zoom,
                }))} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(181,172,138,0.18)', background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-dim)', fontSize: 10, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, fontSize: 10, color: 'var(--cs-text-muted)' }}>
              <span>Pan: {ptzPos.pan}°</span>
              <span>Tilt: {ptzPos.tilt}°</span>
              <span>Zoom: {ptzPos.zoom}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Camera list sidebar */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 10, overflow: 'auto', border: '1px solid var(--cs-glass-border)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cs-glass-border)', fontSize: 12, fontWeight: 700, color: 'var(--cs-text-dim)', textTransform: 'uppercase' }}>Cameras ({cameras.length})</div>
        {cameras.map(c => {
          const z = zones[c.zone];
          const isActive = selectedCam === c.id;
          return (
            <div key={c.id} onClick={() => setSelectedCam(c.id)} style={{
              padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--cs-glass-border)',
              background: isActive ? '#1e3a5f' : 'transparent',
              borderLeft: isActive ? '2px solid var(--cs-red)' : '2px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="neuro-icon neuro-icon-sm" style={{ background: isActive ? 'rgba(197,0,34,0.12)' : 'transparent', borderColor: isActive ? 'rgba(197,0,34,0.3)' : 'transparent' }}>
                  <Camera size={14} color={isActive ? 'var(--cs-red)' : 'var(--cs-text-muted)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--cs-text-bright)' : 'var(--cs-text-dim)' }}>{c.id}</div>
                  <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginTop: 2 }}>{c.zone} · {c.type}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#5cb85c' }} />
              </div>
              {z && (
                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10 }}>
                  <span style={{ color: 'var(--cs-red)' }}>👥 {z.person_count}</span>
                  <span style={{ color: riskColor[z.risk_level] }}>Risk {Math.round(z.risk_score)}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* CCTV Guide link */}
        <Link to="/cctv-guide" style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: 8, background: 'var(--cs-red-glow)', border: '1px solid rgba(197,0,34,0.3)', display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'border-color 0.2s' }}>
          <Info size={14} color="var(--cs-red)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cs-red)' }}>CCTV Connection Guide</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--cs-text-muted)' }}>→</span>
        </Link>

        {/* Camera info panel */}
        <div style={{ padding: 16 }}>
          <h4 style={{ fontSize: 11, color: 'var(--cs-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Camera Details</h4>
          {[{ l: 'Type', v: cam.type }, { l: 'Resolution', v: cam.resolution }, { l: 'Frame Rate', v: `${cam.fps} fps` }, { l: 'Field of View', v: cam.angle }, { l: 'Zone', v: `${cam.zone} — ${ZONE_COORDS[cam.zone]?.name || ''}` }, { l: 'Status', v: 'Online', c: '#5cb85c' }].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--cs-glass-border)', fontSize: 11 }}>
              <span style={{ color: 'var(--cs-text-muted)' }}>{item.l}</span>
              <span style={{ color: (item as any).c || 'var(--cs-text-bright)', fontWeight: 500 }}>{item.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Device Camera Page ───────────────────────────────────────

function DeviceCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setStreaming(true); setError(''); }
    } catch { setError('Camera access denied. Please allow camera permissions.'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  };

  const analyzeFrame = async () => {
    if (!videoRef.current) return;
    setAnalyzing(true);
    // Capture frame to canvas
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    // In production, send frame to backend for YOLO inference
    // For now, use simulation data
    try {
      const res = await fetch(`${API}/api/risk/live`);
      const data = await res.json();
      setResult(data);
    } catch {}
    setAnalyzing(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Device Camera</h2>
      <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 16 }}>Use your device camera for crowd monitoring testing. Point at a crowd scene.</p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 16 }}>
        <div style={{ background: 'var(--cs-glass)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--cs-glass-border)' }}>
          <div style={{ background: '#000', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {streaming ? (
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--cs-text-muted)' }}>
                <Camera size={48} color="rgba(181,172,138,0.18)" />
                <p style={{ marginTop: 12 }}>Click "Start Camera" to begin</p>
              </div>
            )}
            {streaming && (
              <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 10px', borderRadius: 6, background: '#C50022', fontSize: 11, fontWeight: 700, color: 'white' }}>
                ● RECORDING
              </div>
            )}
          </div>
          <div style={{ padding: 12, display: 'flex', gap: 8 }}>
            <button onClick={streaming ? stopCamera : startCamera} style={{
              flex: 1, padding: 10, borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: streaming ? '#C50022' : 'var(--cs-red)', color: 'white',
            }}>{streaming ? 'Stop Camera' : 'Start Camera'}</button>
            <button onClick={analyzeFrame} disabled={!streaming || analyzing} style={{
              flex: 1, padding: 10, borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: '#5cb85c', color: 'white', opacity: !streaming || analyzing ? 0.5 : 1,
            }}>{analyzing ? 'Analyzing...' : 'Analyze Frame'}</button>
          </div>
          {error && <div style={{ padding: '8px 12px', margin: '0 12px 12px', background: '#C5002220', color: '#C50022', borderRadius: 6, fontSize: 12 }}>{error}</div>}
        </div>

        <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)' }}>
          <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Analysis Results</h3>
          {result ? (
            <div>
              <div style={{ padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>Overall Risk</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: result.overall_risk >= 75 ? '#C50022' : result.overall_risk >= 50 ? '#B5AC8A' : '#5cb85c' }}>
                  {Math.round(result.overall_risk)}/100
                </div>
              </div>
              {Object.entries(result.zones || {}).slice(0, 3).map(([zid, z]: [string, any]) => (
                <div key={zid} style={{ padding: 6, borderBottom: '1px solid var(--cs-glass-border)', fontSize: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{z.name || zid}</span>
                    <span style={{ color: z.risk_level === 'CRITICAL' ? '#C50022' : '#B5AC8A' }}>{Math.round(z.risk_score)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>Start camera and click "Analyze Frame" to see results.</p>
          )}

          <div style={{ marginTop: 16, padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6, fontSize: 11, color: 'var(--cs-text-muted)' }}>
            <strong style={{ color: 'var(--cs-text-dim)' }}>Note:</strong> This page uses your device's camera. The camera feed stays on your device — no video is uploaded. For production YOLO inference, connect to the vision service.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Missing Reports Page ────────────────────────────────────

function MissingReportsPage() {
  const [tab, setTab] = useState<'persons' | 'items'>('persons');
  const [persons, setPersons] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const isMobileMR = useIsMobile();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('MISSING');

  // Person form
  const [pf, setPf] = useState({ name: '', age: '', gender: '', description: '', last_seen_zone: '', last_seen_time: '', clothing: '', height: '', distinguishing_marks: '', reporter_name: '', reporter_contact: '' });
  // Item form
  const [itf, setItf] = useState({ item_name: '', category: '', description: '', last_seen_zone: '', last_seen_time: '', color: '', brand: '', reporter_name: '', reporter_contact: '' });

  const load = () => {
    fetch(`${API}/api/missing/persons?status=${filter}`).then(r => r.json()).then(setPersons).catch(() => {});
    fetch(`${API}/api/missing/items?status=${filter}`).then(r => r.json()).then(setItems).catch(() => {});
  };
  useEffect(() => { load(); }, [filter]);

  const submitPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API}/api/missing/persons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...pf, age: parseInt(pf.age) || 0 }) });
    setPf({ name: '', age: '', gender: '', description: '', last_seen_zone: '', last_seen_time: '', clothing: '', height: '', distinguishing_marks: '', reporter_name: '', reporter_contact: '' });
    setShowForm(false); load();
  };
  const submitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API}/api/missing/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(itf) });
    setItf({ item_name: '', category: '', description: '', last_seen_zone: '', last_seen_time: '', color: '', brand: '', reporter_name: '', reporter_contact: '' });
    setShowForm(false); load();
  };
  const updateStatus = async (type: string, id: string, status: string) => {
    await fetch(`${API}/api/missing/${type}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  };

  const zones = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7'];
  const inputS: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(181,172,138,0.18)', background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-bright)', fontSize: 12 };
  const labelS: React.CSSProperties = { fontSize: 11, color: 'var(--cs-text-dim)', marginBottom: 4, display: 'block' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Missing Reports</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--cs-red)', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> New Report
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ key: 'persons' as const, label: 'Missing Persons', icon: '👤', count: persons.length },
          { key: 'items' as const, label: 'Missing Items', icon: '📦', count: items.length }].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
            style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${tab === t.key ? 'var(--cs-red)' : 'rgba(181,172,138,0.18)'}`,
              background: tab === t.key ? 'var(--cs-red)20' : '#111827', color: tab === t.key ? 'var(--cs-red)' : 'var(--cs-text-dim)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {t.icon} {t.label} ({t.count})
          </button>
        ))}
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...inputS, width: 'auto', marginLeft: isMobileMR ? 0 : 'auto' }}>
          <option value="MISSING">Missing</option>
          <option value="FOUND">Found</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)', marginBottom: 16 }}>
          {tab === 'persons' ? (
            <form onSubmit={submitPerson}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--cs-text-bright)' }}>👤 Report Missing Person</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={labelS}>Name *</label><input required value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} style={inputS} placeholder="Full name" /></div>
                <div><label style={labelS}>Age</label><input type="number" value={pf.age} onChange={e => setPf({ ...pf, age: e.target.value })} style={inputS} placeholder="Age" /></div>
                <div><label style={labelS}>Gender</label><select value={pf.gender} onChange={e => setPf({ ...pf, gender: e.target.value })} style={inputS}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={labelS}>Height</label><input value={pf.height} onChange={e => setPf({ ...pf, height: e.target.value })} style={inputS} placeholder="e.g. 5'8&quot; / 173cm" /></div>
                <div><label style={labelS}>Clothing</label><input value={pf.clothing} onChange={e => setPf({ ...pf, clothing: e.target.value })} style={inputS} placeholder="e.g. Blue shirt, jeans" /></div>
              </div>
              <div style={{ marginTop: 10 }}><label style={labelS}>Description</label><textarea value={pf.description} onChange={e => setPf({ ...pf, description: e.target.value })} style={{ ...inputS, height: 60, resize: 'vertical' }} placeholder="Physical description, last known activity..." /></div>
              <div style={{ marginTop: 10 }}><label style={labelS}>Distinguishing Marks</label><input value={pf.distinguishing_marks} onChange={e => setPf({ ...pf, distinguishing_marks: e.target.value })} style={inputS} placeholder="Tattoos, scars, glasses, etc." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={labelS}>Last Seen Zone *</label><select required value={pf.last_seen_zone} onChange={e => setPf({ ...pf, last_seen_zone: e.target.value })} style={inputS}><option value="">Select zone</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
                <div><label style={labelS}>Last Seen Time</label><input type="datetime-local" value={pf.last_seen_time} onChange={e => setPf({ ...pf, last_seen_time: e.target.value })} style={inputS} /></div>
              </div>              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={labelS}>Reporter Name</label>
                  <input value={pf.reporter_name} onChange={e => setPf({ ...pf, reporter_name: e.target.value })} style={inputS} placeholder="Your name" /></div>
                <div><label style={labelS}>Contact</label><input value={pf.reporter_contact} onChange={e => setPf({ ...pf, reporter_contact: e.target.value })} style={inputS} placeholder="Phone or email" /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, background: '#C50022', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Submit Report</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', borderRadius: 6, background: 'rgba(181,172,138,0.18)', color: 'var(--cs-text-bright)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <form onSubmit={submitItem}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--cs-text-bright)' }}>📦 Report Missing Item</h3>
              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
                <div><label style={labelS}>Item Name *</label><input required value={itf.item_name} onChange={e => setItf({ ...itf, item_name: e.target.value })} style={inputS} placeholder="e.g. Backpack, Phone" /></div>
                <div><label style={labelS}>Category</label><select value={itf.category} onChange={e => setItf({ ...itf, category: e.target.value })} style={inputS}><option value="">Select</option><option>Electronics</option><option>Bags</option><option>Clothing</option><option>Documents</option><option>Jewelry</option><option>Other</option></select></div>
                <div><label style={labelS}>Color</label><input value={itf.color} onChange={e => setItf({ ...itf, color: e.target.value })} style={inputS} placeholder="e.g. Black" /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={labelS}>Brand / Model</label><input value={itf.brand} onChange={e => setItf({ ...itf, brand: e.target.value })} style={inputS} placeholder="e.g. Samsung, Nike" /></div>
                <div><label style={labelS}>Last Seen Zone *</label><select required value={itf.last_seen_zone} onChange={e => setItf({ ...itf, last_seen_zone: e.target.value })} style={inputS}><option value="">Select zone</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select></div>
              </div>
              <div style={{ marginTop: 10 }}><label style={labelS}>Description</label><textarea value={itf.description} onChange={e => setItf({ ...itf, description: e.target.value })} style={{ ...inputS, height: 60, resize: 'vertical' }} placeholder="Describe the item..." /></div>              <div style={{ display: 'grid', gridTemplateColumns: isMobileMR ? '1fr' : '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
                <div><label style={labelS}>Last Seen Time</label>
                  <input type="datetime-local" value={itf.last_seen_time} onChange={e => setItf({ ...itf, last_seen_time: e.target.value })} style={inputS} /></div>
                <div><label style={labelS}>Reporter Name</label><input value={itf.reporter_name} onChange={e => setItf({ ...itf, reporter_name: e.target.value })} style={inputS} placeholder="Your name" /></div>
                <div><label style={labelS}>Contact</label><input value={itf.reporter_contact} onChange={e => setItf({ ...itf, reporter_contact: e.target.value })} style={inputS} placeholder="Phone or email" /></div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: 6, background: '#B5AC8A', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Submit Report</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', borderRadius: 6, background: 'rgba(181,172,138,0.18)', color: 'var(--cs-text-bright)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tab === 'persons' ? (
          persons.length === 0 ? (
            <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--cs-text-muted)' }}>
              <Search size={40} color="rgba(181,172,138,0.18)" />
              <p style={{ marginTop: 12 }}>No missing person reports</p>
            </div>
          ) : persons.map((p: any) => (
            <div key={p.id} style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)', borderLeft: `4px solid ${p.status === 'MISSING' ? '#C50022' : p.status === 'FOUND' ? '#5cb85c' : 'var(--cs-text-muted)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: '#C5002220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={18} color="#C50022" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cs-text-bright)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>{p.id} · {p.age ? `${p.age} yrs` : ''} {p.gender ? `· ${p.gender}` : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.status === 'MISSING' ? '#C50022' : '#5cb85c', padding: '2px 8px', borderRadius: 4, background: (p.status === 'MISSING' ? '#C50022' : '#5cb85c') + '15' }}>{p.status}</span>
                  {p.status === 'MISSING' && (
                    <button onClick={() => updateStatus('persons', p.id, 'FOUND')} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #5cb85c', background: '#5cb85c15', color: '#5cb85c', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Mark Found</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
                {p.height && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Height:</span> <span style={{ color: 'var(--cs-text)' }}>{p.height}</span></div>}
                {p.clothing && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Clothing:</span> <span style={{ color: 'var(--cs-text)' }}>{p.clothing}</span></div>}
                <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Last Seen:</span> <span style={{ color: 'var(--cs-text)' }}>{p.last_seen_zone} · {p.last_seen_time ? new Date(p.last_seen_time).toLocaleString() : 'Unknown'}</span></div>
                {p.distinguishing_marks && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Marks:</span> <span style={{ color: 'var(--cs-text)' }}>{p.distinguishing_marks}</span></div>}
                {p.description && <div style={{ fontSize: 11, gridColumn: '1 / -1' }}><span style={{ color: 'var(--cs-text-muted)' }}>Notes:</span> <span style={{ color: 'var(--cs-text)' }}>{p.description}</span></div>}
                {p.reporter_name && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Reporter:</span> <span style={{ color: 'var(--cs-text)' }}>{p.reporter_name} · {p.reporter_contact}</span></div>}
              </div>
            </div>
          ))
        ) : (
          items.length === 0 ? (
            <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--cs-text-muted)' }}>
              <Search size={40} color="rgba(181,172,138,0.18)" />
              <p style={{ marginTop: 12 }}>No missing item reports</p>
            </div>
          ) : items.map((it: any) => (
            <div key={it.id} style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)', borderLeft: `4px solid ${it.status === 'MISSING' ? '#B5AC8A' : '#5cb85c'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: '#B5AC8A20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} color="#B5AC8A" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cs-text-bright)' }}>{it.item_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>{it.id} · {it.category || 'Uncategorized'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: it.status === 'MISSING' ? '#B5AC8A' : '#5cb85c', padding: '2px 8px', borderRadius: 4, background: (it.status === 'MISSING' ? '#B5AC8A' : '#5cb85c') + '15' }}>{it.status}</span>
                  {it.status === 'MISSING' && (
                    <button onClick={() => updateStatus('items', it.id, 'FOUND')} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #5cb85c', background: '#5cb85c15', color: '#5cb85c', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Mark Found</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
                {it.color && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Color:</span> <span style={{ color: 'var(--cs-text)' }}>{it.color}</span></div>}
                {it.brand && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Brand:</span> <span style={{ color: 'var(--cs-text)' }}>{it.brand}</span></div>}
                <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Last Seen:</span> <span style={{ color: 'var(--cs-text)' }}>{it.last_seen_zone} · {it.last_seen_time ? new Date(it.last_seen_time).toLocaleString() : 'Unknown'}</span></div>
                {it.description && <div style={{ fontSize: 11, gridColumn: '1 / -1' }}><span style={{ color: 'var(--cs-text-muted)' }}>Description:</span> <span style={{ color: 'var(--cs-text)' }}>{it.description}</span></div>}
                {it.reporter_name && <div style={{ fontSize: 11 }}><span style={{ color: 'var(--cs-text-muted)' }}>Reporter:</span> <span style={{ color: 'var(--cs-text)' }}>{it.reporter_name} · {it.reporter_contact}</span></div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Alerts Page ──────────────────────────────────────────────

function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  useEffect(() => {
    const load = () => fetch(`${API}/api/alerts/active`).then(r => r.json()).then(setAlerts).catch(() => {});
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, []);

  const dismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    fetch(`${API}/api/alerts/${alertId}/acknowledge`, { method: 'POST' }).catch(() => {});
  };

  const critCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warnCount = alerts.filter(a => a.severity === 'WARNING').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Alert Center</h2>
        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
          {critCount > 0 && <span style={{ color: '#C50022', fontWeight: 600 }}>● {critCount} Critical</span>}
          {warnCount > 0 && <span style={{ color: '#B5AC8A', fontWeight: 600 }}>● {warnCount} Warning</span>}
          {alerts.length === 0 && <span style={{ color: '#5cb85c', fontWeight: 600 }}>✓ All Clear</span>}
        </div>
      </div>
      {alerts.length === 0 ? (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--cs-text-muted)' }}>
          <Bell size={40} color="#5cb85c" />
          <p style={{ marginTop: 12, color: '#5cb85c', fontWeight: 600 }}>No active alerts</p>
          <p style={{ marginTop: 4, fontSize: 12 }}>All zones operating within safe parameters</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map((a: any) => (
            <div key={a.id} style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)',
              borderLeft: `4px solid ${a.severity === 'CRITICAL' ? '#C50022' : '#B5AC8A'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: a.severity === 'CRITICAL' ? '#C50022' : '#B5AC8A',
                    padding: '2px 8px', borderRadius: 4, background: (a.severity === 'CRITICAL' ? '#C50022' : '#B5AC8A') + '15' }}>{a.severity}</span>
                  <span style={{ fontSize: 10, color: 'var(--cs-text-dim)' }}>{a.zone_id}</span>
                  <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{a.alert_type}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--cs-text-muted)', fontFamily: 'monospace' }}>
                    <ElapsedTimer createdAt={a.created_at} />
                  </span>
                  <button onClick={() => dismissAlert(a.id)}
                    style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(181,172,138,0.18)', background: 'rgba(0,0,0,0.4)',
                      color: 'var(--cs-text-dim)', fontSize: 11, cursor: 'pointer' }}>
                    Dismiss
                  </button>
                </div>
              </div>
              <h4 style={{ fontSize: 14, marginTop: 8, color: 'var(--cs-text-bright)' }}>{a.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--cs-text-dim)', marginTop: 4 }}>{a.message}</p>
              <ElapsedBar createdAt={a.created_at} maxSeconds={120} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Incidents Page ───────────────────────────────────────────

function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  useEffect(() => { fetch(`${API}/api/incidents`).then(r => r.json()).then(setIncidents).catch(() => {}); }, []);
  const statusColors: Record<string, string> = { DETECTED: '#C50022', ACKNOWLEDGED: '#B5AC8A', RESPONDING: '#B5AC8A', CONTAINED: 'var(--cs-red)', RESOLVED: '#5cb85c' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Incidents</h2>
        <Link to="/incidents/new" style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--cs-red)', color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> New Incident
        </Link>
      </div>
      {incidents.length === 0 ? (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 40, textAlign: 'center', color: 'var(--cs-text-muted)' }}>
          <FileText size={40} color="rgba(181,172,138,0.18)" />
          <p style={{ marginTop: 12 }}>No active incidents</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {incidents.map((inc: any, i: number) => (
            <div key={i} style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColors[inc.status] || 'var(--cs-text-muted)', padding: '2px 8px', borderRadius: 4, background: (statusColors[inc.status] || 'var(--cs-text-muted)') + '15' }}>{inc.status}</span>
                  <span style={{ fontSize: 10, color: 'var(--cs-text-muted)', marginLeft: 8 }}>{inc.type}</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{inc.id}</span>
              </div>
              <h4 style={{ fontSize: 14, marginTop: 8 }}>{inc.title}</h4>
              {inc.description && <p style={{ fontSize: 12, color: 'var(--cs-text-dim)', marginTop: 4 }}>{inc.description}</p>}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--cs-text-muted)' }}>
                <span>Zone: {inc.zone_id}</span>
                <span>Team: {inc.assigned_team || 'Unassigned'}</span>
                <span>Severity: {inc.severity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Monitor Page ────────────────────────────────────────

function LiveMonitorPage() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>('');
  const [detections, setDetections] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [source, setSource] = useState<'cctv' | 'device'>('cctv');
  const [model, setModel] = useState('yolov8n');
  const [threshold, setThreshold] = useState(0.5);
  const [showAddCam, setShowAddCam] = useState(false);
  const [newCam, setNewCam] = useState({ name: '', type: 'RTSP', url: '', zone_id: 'Z1' });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceStreaming, setDeviceStreaming] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const load = () => {
      fetch(`${API}/api/monitor/cameras`).then(r => r.json()).then(setCameras).catch(() => {});
      fetch(`${API}/api/monitor/sessions`).then(r => r.json()).then(setSessions).catch(() => {});
    };
    load(); const iv = setInterval(load, 3000); return () => clearInterval(iv);
  }, []);

  const startDeviceCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setDeviceStreaming(true); }
    } catch { alert('Camera access denied'); }
  };

  const stopDeviceCamera = () => {
    if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); videoRef.current.srcObject = null; }
    setDeviceStreaming(false);
  };

  const runDetection = async (camId: string) => {
    const cam = cameras.find(c => c.id === camId);
    try {
      const res = await fetch(`${API}/api/monitor/detect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ camera_id: camId, zone_id: cam?.zone_id || 'Z1' }) });
      const data = await res.json();
      setDetections(data.detections);
      setStats({ count: data.count, density: data.density, fps: 0, model: data.model, inference_ms: data.inference_ms });
    } catch {}
  };

  const startInference = async (camId: string) => {
    try {
      const res = await fetch(`${API}/api/monitor/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ camera_id: camId, source, model, detection_threshold: threshold }) });
      const data = await res.json();
      setSessions(prev => [...prev, data]);
    } catch {}
  };

  const stopInference = async (sessionId: string) => {
    try {
      await fetch(`${API}/api/monitor/stop`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId }) });
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
    } catch {}
  };

  const addCamera = async () => {
    try {
      await fetch(`${API}/api/monitor/cameras`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCam) });
      setShowAddCam(false); setNewCam({ name: '', type: 'RTSP', url: '', zone_id: 'Z1' });
      fetch(`${API}/api/monitor/cameras`).then(r => r.json()).then(setCameras);
    } catch {}
  };

  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#B5AC8A', CRITICAL: '#C50022' };

  const isMobileLive = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Live Crowd Monitor</h2>
          <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginTop: 2 }}>Real-time CCTV and device camera crowd management with ML inference</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAddCam(true)} style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--cs-red)', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Add Camera
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobileLive ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16, flex: 1, minHeight: 0 }}>
        {/* Left: Camera feeds + detection overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {/* Source selector */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--cs-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Source:</span>
            {[{ key: 'cctv' as const, label: 'CCTV / RTSP' }, { key: 'device' as const, label: 'Device Camera' }].map(s => (
              <button key={s.key} onClick={() => { setSource(s.key); if (s.key === 'device') startDeviceCamera(); else stopDeviceCamera(); }}
                style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${source === s.key ? 'var(--cs-red)' : 'rgba(181,172,138,0.18)'}`, background: source === s.key ? 'var(--cs-red)20' : '#111827', color: source === s.key ? 'var(--cs-red)' : 'var(--cs-text-dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {s.label}
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>Model:</label>
              <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(181,172,138,0.18)', background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-bright)', fontSize: 11 }}>
                <option value="yolov8n">YOLOv8n</option>
                <option value="yolov8s">YOLOv8s</option>
                <option value="yolov8m">YOLOv8m</option>
              </select>
              <label style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>Threshold:</label>
              <input type="range" min="0.1" max="0.95" step="0.05" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} style={{ width: 60 }} />
              <span style={{ fontSize: 10, color: 'var(--cs-text-dim)', fontFamily: 'monospace' }}>{threshold}</span>
            </div>
          </div>

          {/* Device camera feed */}
          {source === 'device' && (
            <div style={{ background: 'var(--cs-glass)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--cs-glass-border)' }}>
              <div style={{ background: '#000', height: 300, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {deviceStreaming ? (
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--cs-text-muted)' }}><Camera size={40} color="rgba(181,172,138,0.18)" /><p style={{ marginTop: 8, fontSize: 12 }}>Click to start device camera</p></div>
                )}
                {deviceStreaming && <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#C50022', background: '#00000090' }}>● LIVE</div>}
                {deviceStreaming && (
                  <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 6 }}>
                    <button onClick={() => runDetection('DEVICE')} style={{ padding: '6px 12px', borderRadius: 4, border: 'none', background: '#5cb85c', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Run Detection</button>
                    <button onClick={stopDeviceCamera} style={{ padding: '6px 12px', borderRadius: 4, border: 'none', background: '#C50022', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Stop</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CCTV cameras grid */}
          {source === 'cctv' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {cameras.map(cam => {
                const activeSession = sessions.find(s => s.camera_id === cam.id && s.status === 'RUNNING');
                return (
                  <div key={cam.id} onClick={() => { setSelectedCam(cam.id); runDetection(cam.id); }} style={{
                    background: 'var(--cs-glass)', borderRadius: 8, overflow: 'hidden', border: `2px solid ${selectedCam === cam.id ? 'var(--cs-red)' : 'var(--cs-glass-border)'}`, cursor: 'pointer', transition: 'border-color 0.2s',
                  }}>
                    <div style={{ background: '#000', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <Camera size={24} color="rgba(181,172,138,0.18)" />
                      <div style={{ position: 'absolute', top: 4, left: 4, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, color: cam.status === 'ONLINE' ? '#5cb85c' : '#C50022', background: '#00000090' }}>
                        {cam.status === 'ONLINE' ? '● LIVE' : '○ OFFLINE'}
                      </div>
                      {activeSession && (
                        <div style={{ position: 'absolute', top: 4, right: 4, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, color: '#B5AC8A', background: '#B5AC8A20', border: '1px solid #B5AC8A40' }}>ML ACTIVE</div>
                      )}
                    </div>
                    <div style={{ padding: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--cs-text-bright)' }}>{cam.id}</div>
                      <div style={{ fontSize: 9, color: 'var(--cs-text-muted)' }}>{cam.zone_id} · {cam.type}</div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {activeSession ? (
                          <button onClick={(e) => { e.stopPropagation(); stopInference(activeSession.session_id); }} style={{ flex: 1, padding: '3px 0', borderRadius: 3, border: '1px solid #C5002260', background: '#C5002215', color: '#C50022', fontSize: 9, cursor: 'pointer' }}>Stop ML</button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); startInference(cam.id); }} style={{ flex: 1, padding: '3px 0', borderRadius: 3, border: '1px solid #5cb85c60', background: '#5cb85c15', color: '#5cb85c', fontSize: 9, cursor: 'pointer' }}>Start ML</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Detection results + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>
          {/* Live stats */}
          {stats && (
            <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)' }}>
              <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Detection Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'Persons', value: stats.count, color: 'var(--cs-red)' },
                  { label: 'Density', value: `${stats.density} p/m²`, color: '#B5AC8A' },
                  { label: 'Model', value: stats.model.toUpperCase(), color: '#B5AC8A' },
                  { label: 'Inference', value: `${stats.inference_ms}ms`, color: '#5cb85c' },
                ].map((m, i) => (
                  <div key={i} style={{ padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detection bounding boxes visualization */}
          <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)', flex: 1, minHeight: 300 }}>
            <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Bounding Boxes ({detections.length})</h3>
            <div style={{ background: '#000', borderRadius: 6, height: 240, position: 'relative', overflow: 'hidden' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
              {detections.length === 0 ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cs-text-muted)', fontSize: 12 }}>Click a camera to run detection</div>
              ) : detections.map((d: any) => (
                <div key={d.id} style={{ position: 'absolute',
                  left: `${(d.bbox.x / 850) * 100}%`, top: `${(d.bbox.y / 600) * 100}%`,
                  width: `${(d.bbox.w / 850) * 100}%`, height: `${(d.bbox.h / 600) * 100}%`,
                  border: `2px solid ${d.confidence > 0.8 ? '#5cb85c' : d.confidence > 0.6 ? '#B5AC8A' : '#C50022'}`,
                  borderRadius: 3 }}>
                  <div style={{ position: 'absolute', top: -14, left: 0, fontSize: 8, padding: '1px 4px', borderRadius: 2,
                    background: d.confidence > 0.8 ? '#5cb85c' : d.confidence > 0.6 ? '#B5AC8A' : '#C50022',
                    color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {d.label} {(d.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active sessions */}
          <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 16, border: '1px solid var(--cs-glass-border)' }}>
            <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Active ML Sessions ({sessions.filter(s => s.status === 'RUNNING').length})</h3>
            {sessions.filter(s => s.status === 'RUNNING').length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--cs-text-muted)', fontSize: 11, padding: 16 }}>No active inference sessions</div>
            ) : sessions.filter(s => s.status === 'RUNNING').map(s => (
              <div key={s.session_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 6, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#5cb85c', animation: 'pulse 2s infinite' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{s.camera_id}</div>
                  <div style={{ fontSize: 9, color: 'var(--cs-text-muted)' }}>{s.model} · {s.source} · threshold {s.detection_threshold}</div>
                </div>
                <span style={{ fontSize: 9, color: 'var(--cs-text-muted)' }}>Started {new Date(s.started_at).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Camera Modal */}
      {showAddCam && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000080', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--cs-glass)', borderRadius: 12, padding: 24, width: 400, border: '1px solid var(--cs-glass-border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add Camera</h3>
            <input placeholder="Camera Name" value={newCam.name} onChange={e => setNewCam({...newCam, name: e.target.value})} style={inputStyle} />
            <div className="grid-2col" style={{ gap: 8 }}>
              <select value={newCam.type} onChange={e => setNewCam({...newCam, type: e.target.value})} style={{ ...inputStyle, appearance: 'auto' }}>
                <option value="RTSP">RTSP (CCTV)</option>
                <option value="USB">USB (Local)</option>
                <option value="HTTP">HTTP Stream</option>
              </select>
              <select value={newCam.zone_id} onChange={e => setNewCam({...newCam, zone_id: e.target.value})} style={{ ...inputStyle, appearance: 'auto' }}>
                {['Z1','Z2','Z3','Z4','Z5','Z6','Z7'].map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <input placeholder="Stream URL (rtsp://... or /dev/video0)" value={newCam.url} onChange={e => setNewCam({...newCam, url: e.target.value})} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={addCamera} disabled={!newCam.name || !newCam.url} style={{ flex: 1, padding: 10, borderRadius: 6, background: 'var(--cs-red)', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: !newCam.name || !newCam.url ? 0.5 : 1 }}>Add Camera</button>
              <button onClick={() => setShowAddCam(false)} style={{ padding: 10, borderRadius: 6, background: 'rgba(181,172,138,0.18)', color: 'var(--cs-text-bright)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant Page ────────────────────────────────────────

function AssistantPage() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: 'assistant', text: 'Hello! I am the CrowdShield AI Assistant. Ask me about risk status, recommendations, evacuation routes, or situation summaries.' },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!query.trim()) return;
    const q = query; setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ai-assistant/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch { setMessages(prev => [...prev, { role: 'assistant', text: 'Error: Could not connect to the assistant.' }]); }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      {/* AI Face — PlasmaRing */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--cs-glass-border)', position: 'relative', minHeight: 280 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <PlasmaRing
            background="#0a0e17"
            colors={['#B5AC8A', 'var(--cs-red)', '#8b55f7', '#C50022', '#f59e0b']}
            density={120}
            speed={100}
            waveHeight={20}
            centerOpacity={100}
            scale={36}
            dragSensitivity={100}
          />
        </div>
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Brain size={48} color="#B5AC8A" style={{ marginBottom: 12 }} />
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--cs-text-bright)', textShadow: '0 0 20px #B5AC8A60' }}>CROWDSHIELD AI</h2>
            <p style={{ fontSize: 13, color: 'var(--cs-text-dim)', marginTop: 8, maxWidth: 320 }}>
              Advanced crowd intelligence engine powered by ensemble ML models. Drag the ring to explore.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              {['XGBoost', 'LSTM', 'Transformer'].map(m => (
                <span key={m} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                  background: '#B5AC8A20', color: '#B5AC8A', border: '1px solid #B5AC8A40' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 10, border: '1px solid var(--cs-glass-border)', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--cs-glass-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color="#B5AC8A" />
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>AI Assistant</h3>
          <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: 4, background: '#5cb85c', animation: 'pulse 2s infinite' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ maxWidth: '90%', padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--cs-red)20' : 'rgba(0,0,0,0.4)', border: `1px solid ${m.role === 'user' ? 'var(--cs-red)40' : 'var(--cs-glass-border)'}` }}>
              {m.role === 'assistant' && <span style={{ color: '#B5AC8A', fontWeight: 700, fontSize: 10, display: 'block', marginBottom: 4 }}>CROWDSHIELD AI</span>}
              {m.text}
            </div>
          ))}
          {loading && <div style={{ color: '#B5AC8A', fontSize: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#B5AC8A', animation: 'pulse 1s infinite' }} />
            Analyzing crowd data...
          </div>}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid var(--cs-glass-border)', display: 'flex', gap: 8 }}>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about risks, routes, incidents..." style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
          <button onClick={send} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#B5AC8A', color: 'white', cursor: 'pointer', fontWeight: 600 }}><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Teams Page ───────────────────────────────────────────────

function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/teams`).then(r => r.json()).then(setTeams).catch(() => {});
    fetch(`${API}/api/users`).then(r => r.json()).then(setUsers).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = { ACTIVE: '#5cb85c', STANDBY: '#B5AC8A', DEPLOYED: '#C50022' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Response Teams</h2>
        <Link to="/teams/new" style={{ padding: '8px 14px', borderRadius: 6, background: 'var(--cs-red)', color: 'white', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> New Team
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
        {teams.map((team: any) => (
          <div key={team.id} style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <Link to={`/teams/${team.id}`} style={{ fontSize: 16, fontWeight: 700, color: 'var(--cs-text-bright)', textDecoration: 'none' }}>{team.name}</Link>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 2 }}>{team.specialty}</div>
              </div>
              <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: (statusColor[team.status] || 'var(--cs-text-muted)') + '20', color: statusColor[team.status] || 'var(--cs-text-muted)' }}>{team.status}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--cs-text-dim)' }}>
              Members: {team.members.length}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {team.members.slice(0, 3).map((m: any) => {
                const user = users.find(u => u.id === m.user_id);
                return (
                  <Link key={m.user_id} to={`/profile/${m.user_id}`} style={{ padding: '4px 8px', borderRadius: 4, background: 'rgba(0,0,0,0.4)', fontSize: 11, color: 'var(--cs-text-bright)', textDecoration: 'none' }}>
                    {user?.full_name || m.user_id}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────

function ProfilePage() {
  const user = AuthContext.getUser();
  const [teams, setTeams] = useState<any[]>([]);
  const isMobileProfile = useIsMobile();
  useEffect(() => {
    fetch(`${API}/api/teams`).then(r => r.json()).then(setTeams).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 600, padding: isMobileProfile ? '0 4px' : 0 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>My Profile</h2>
      <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 24, border: '1px solid var(--cs-glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="neuro-icon neuro-icon-lg" style={{ borderRadius: 32, background: 'var(--cs-red-glow)', width: 64, height: 64 }}>
            <User size={28} color="var(--cs-red)" />
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>{user.full_name}</h3>
            <p style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>@{user.username}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobileProfile ? '1fr' : '1fr 1fr', gap: 12 }}>
          {[{ label: 'Email', value: user.email }, { label: 'Role', value: user.role },
            { label: 'User ID', value: user.id?.slice(0, 8) + '...' }, { label: 'Status', value: 'Active' },
          ].map((f, i) => (
            <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <h4 style={{ fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 8 }}>Team Memberships</h4>
        {teams.filter(t => t.members.some((m: any) => m.user_id === user.id)).length === 0 ? (
          <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>Not assigned to any team yet.</p>
        ) : teams.filter(t => t.members.some((m: any) => m.user_id === user.id)).map(team => (
          <div key={team.id} style={{ padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6, marginBottom: 6 }}>
            <Link to={`/teams/${team.id}`} style={{ color: 'var(--cs-red)', fontWeight: 600, textDecoration: 'none' }}>{team.name}</Link>
            <span style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginLeft: 8 }}>{team.specialty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Urgent Contact Page ────────────────────────────────────

function UrgentContactPage() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'URGENT' | 'CRITICAL' | 'EMERGENCY'>('URGENT');
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const user = AuthContext.getUser();
  const isMobileUC = useIsMobile();

  useEffect(() => {
    fetch(`${API}/api/urgent-contact/history`).then(r => r.json()).then(setHistory).catch(() => {});
  }, []);

  const sendUrgent = async () => {
    if (!message.trim()) return;
    try {
      await fetch(`${API}/api/urgent-contact/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, priority, sender_id: user?.id, sender_name: user?.full_name, sender_role: user?.role }),
      });
      // Also trigger desktop notification via Electron if available
      if (window.crowdshield) {
        window.crowdshield.sendNotification(`🚨 ${priority} Contact`, message);
      }
    } catch {}
    setSent(true);
    setHistory(prev => [{ id: Date.now(), message, priority, sender_name: user?.full_name, sender_role: user?.role, created_at: new Date().toISOString(), acknowledged: false }, ...prev]);
    setTimeout(() => setSent(false), 3000);
    setMessage('');
  };

  const acknowledge = async (id: string) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, acknowledged: true } : h));
    try { await fetch(`${API}/api/urgent-contact/${id}/acknowledge`, { method: 'POST' }); } catch {}
  };

  const priorityColors: Record<string, string> = { URGENT: '#B5AC8A', CRITICAL: '#d4813a', EMERGENCY: '#C50022' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobileUC ? '1fr' : '1fr 1fr', gap: 16, height: isMobileUC ? 'auto' : '100%' }}>
      {/* Send Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <PhoneCall size={18} color="#C50022" />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Urgent Contact — Commander</h2>
          </div>
          <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 16 }}>Send an urgent message directly to the commander in case of stampede, crowd surge, or emergency.</p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {(['URGENT', 'CRITICAL', 'EMERGENCY'] as const).map(p => (
              <button key={p} onClick={() => setPriority(p)} style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, border: `2px solid ${priority === p ? priorityColors[p] : 'rgba(181,172,138,0.18)'}`,
                background: priority === p ? priorityColors[p] + '20' : 'rgba(0,0,0,0.4)',
                color: priorityColors[p], fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center',
              }}>{p}</button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe the urgency..."
            style={{ width: '100%', minHeight: 120, padding: 12, borderRadius: 8, border: `1px solid ${priorityColors[priority]}40`, background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-bright)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
          />

          <button onClick={sendUrgent} disabled={!message.trim()} style={{
            width: '100%', marginTop: 12, padding: 12, borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            background: sent ? '#5cb85c' : priorityColors[priority], color: 'white', opacity: !message.trim() ? 0.5 : 1,
            transition: 'background 0.3s',
          }}>{sent ? '✓ Message Sent!' : `📞 Contact Commander (${priority})`}</button>

          <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.4)', fontSize: 11, color: 'var(--cs-text-muted)' }}>
            <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
            Messages are sent to the commander's dashboard and trigger a push notification. In EMERGENCY mode, all response teams are also notified.
          </div>
        </div>
      </div>

      {/* History Panel */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
        <h3 style={{ fontSize: 12, color: 'var(--cs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Contact History</h3>
        {history.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <PhoneCall size={40} color="rgba(181,172,138,0.18)" />
            <p style={{ marginTop: 12, color: 'var(--cs-text-muted)', fontSize: 12 }}>No urgent contacts yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h: any) => (
              <div key={h.id} style={{ padding: 12, borderRadius: 8, background: 'rgba(0,0,0,0.4)', borderLeft: `3px solid ${priorityColors[h.priority] || '#C50022'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: priorityColors[h.priority], padding: '2px 6px', borderRadius: 3, background: priorityColors[h.priority] + '15' }}>{h.priority}</span>
                    <span style={{ fontSize: 11, color: 'var(--cs-text-dim)' }}>{h.sender_name || 'Unknown'} ({h.sender_role})</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{new Date(h.created_at).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--cs-text)', marginTop: 6 }}>{h.message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  {h.acknowledged ? (
                    <span style={{ fontSize: 10, color: '#5cb85c', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={12} /> Acknowledged</span>
                  ) : (
                    <button onClick={() => acknowledge(h.id)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #5cb85c', background: '#5cb85c15', color: '#5cb85c', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Acknowledge</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications Page ──────────────────────────────────────

function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'OPERATOR' | 'COMMANDER' | 'ACKNOWLEDGEMENT'>('ALL');
  const isMobileN = useIsMobile();
  const user = AuthContext.getUser();

  useEffect(() => {
    const load = () => fetch(`${API}/api/notifications`).then(r => r.json()).then(setNotifications).catch(() => {});
    load(); const iv = setInterval(load, 5000); return () => clearInterval(iv);
  }, []);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await fetch(`${API}/api/notifications/${id}/read`, { method: 'POST' }); } catch {}
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await fetch(`${API}/api/notifications/read-all`, { method: 'POST' }); } catch {}
  };

  const filtered = notifications.filter(n => filter === 'ALL' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const typeColors: Record<string, string> = {
    OPERATOR: '#C50022', COMMANDER: '#B5AC8A', ACKNOWLEDGEMENT: '#5cb85c',
    ALERT: '#d4813a', SYSTEM: '#8a8580',
  };

  const typeIcons: Record<string, string> = { OPERATOR: '📹', COMMANDER: '🎖️', ACKNOWLEDGEMENT: '✅', ALERT: '⚠️', SYSTEM: '⚙️' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Notifications</h2>
          {unreadCount > 0 && <span style={{ padding: '2px 8px', borderRadius: 10, background: 'var(--cs-red)', color: 'white', fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>}
        </div>
        <button onClick={markAllRead} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--cs-glass-border)', background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-dim)', fontSize: 11, cursor: 'pointer' }}>Mark All Read</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['ALL', 'OPERATOR', 'COMMANDER', 'ACKNOWLEDGEMENT'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 6,
            border: `1px solid ${filter === f ? 'var(--cs-red)' : 'rgba(181,172,138,0.18)'}`,
            background: filter === f ? 'var(--cs-red)20' : '#111827',
            color: filter === f ? 'var(--cs-red)' : 'var(--cs-text-dim)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>{f === 'ALL' ? 'All' : f.replace('_', ' ')}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 40, textAlign: 'center' }}>
          <Bell size={40} color="#5cb85c" />
          <p style={{ marginTop: 12, color: '#5cb85c', fontWeight: 600 }}>No notifications</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((n: any) => (
            <div key={n.id} onClick={() => markRead(n.id)} style={{
              padding: '12px 16px', borderRadius: 8, background: n.read ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
              borderLeft: `3px solid ${typeColors[n.type] || '#5a5550'}`, cursor: 'pointer', opacity: n.read ? 0.7 : 1,
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{typeIcons[n.type] || '🔔'}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: typeColors[n.type], padding: '2px 6px', borderRadius: 3, background: typeColors[n.type] + '15' }}>{n.type}</span>
                  {n.from_name && <span style={{ fontSize: 11, color: 'var(--cs-text-dim)' }}>from {n.from_name}</span>}
                </div>
                <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--cs-text)', marginTop: 6, fontWeight: n.read ? 400 : 600 }}>{n.title || n.message}</p>
              {n.body && <p style={{ fontSize: 11, color: 'var(--cs-text-dim)', marginTop: 4 }}>{n.body}</p>}
              {!n.read && <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--cs-red)', position: 'absolute', right: 12, top: 12 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analysis Reports Page ───────────────────────────────────

function AnalysisReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const isMobileAR = useIsMobile();

  useEffect(() => {
    fetch(`${API}/api/analysis/reports`).then(r => r.json()).then(setReports).catch(() => {
      // Fallback demo data
      setReports([
        { id: 'RPT-001', title: 'Zone Z5 — Crowd Surge Analysis', zone: 'Z5', type: 'SURGE', date: new Date().toISOString(), status: 'COMPLETED', peak_density: 2.8, avg_density: 1.6, max_person_count: 680, risk_score: 78, risk_level: 'HIGH', summary: 'Crowd density in Z5 (Central Plaza) spiked to 2.8 p/m² at 14:32, triggering a CRITICAL alert. Surge was attributed to post-event exit through Gate G5. Response team deployed within 3 minutes. Density returned to normal within 12 minutes.', recommendations: ['Add additional exit gate at Z5 SE corner', 'Pre-position crowd marshals before event ends', 'Install directional signage for faster exit flow'] },
        { id: 'RPT-002', title: 'Zones Z1-Z3 — Morning Flow Analysis', zone: 'Z1', type: 'FLOW', date: new Date(Date.now() - 86400000).toISOString(), status: 'COMPLETED', peak_density: 1.2, avg_density: 0.7, max_person_count: 420, risk_score: 25, risk_level: 'LOW', summary: 'Morning entry flow was well-managed across Zones Z1 through Z3. Average throughput at Main Entrance was 45 persons/minute. No bottlenecks detected.', recommendations: ['Continue current entry management protocol', 'Monitor Z1 Gate G2 during peak hours'] },
        { id: 'RPT-003', title: 'Zone Z6 — Stadium Event Analysis', zone: 'Z6', type: 'EVENT', date: new Date(Date.now() - 172800000).toISOString(), status: 'COMPLETED', peak_density: 1.9, avg_density: 1.1, max_person_count: 950, risk_score: 52, risk_level: 'MODERATE', summary: 'Stadium Zone Z6 reached 950 persons at halftime. Density remained within safe limits but approached MODERATE threshold at concession areas.', recommendations: ['Stagger concession break timing', 'Add overflow seating indicator boards'] },
      ]);
    });
  }, []);

  const riskColor: Record<string, string> = { LOW: '#5cb85c', MODERATE: '#B5AC8A', HIGH: '#d4813a', CRITICAL: '#C50022' };

  if (selectedReport) {
    return (
      <div>
        <button onClick={() => setSelectedReport(null)} style={{ marginBottom: 12, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--cs-glass-border)', background: 'rgba(0,0,0,0.4)', color: 'var(--cs-text-dim)', fontSize: 11, cursor: 'pointer' }}>← Back to Reports</button>
        <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 24, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{selectedReport.title}</h2>
              <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginTop: 4 }}>{new Date(selectedReport.date).toLocaleDateString()} · {selectedReport.zone} · {selectedReport.type}</p>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: riskColor[selectedReport.risk_level] + '20', color: riskColor[selectedReport.risk_level] }}>{selectedReport.risk_level} — {selectedReport.risk_score}/100</span>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobileAR ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[{ label: 'Peak Density', value: `${selectedReport.peak_density} p/m²`, color: '#C50022' },
              { label: 'Avg Density', value: `${selectedReport.avg_density} p/m²`, color: '#B5AC8A' },
              { label: 'Max Persons', value: selectedReport.max_person_count, color: '#B5AC8A' },
              { label: 'Risk Score', value: selectedReport.risk_score, color: riskColor[selectedReport.risk_level] },
            ].map((m, i) => (
              <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Summary</h3>
            <p style={{ fontSize: 13, color: 'var(--cs-text)', lineHeight: 1.7 }}>{selectedReport.summary}</p>
          </div>

          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Recommendations</h3>
            {selectedReport.recommendations.map((rec: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--cs-glass-border)' }}>
                <CheckCircle size={14} color="#5cb85c" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--cs-text)' }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Analysis Reports</h2>
      {reports.length === 0 ? (
        <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 40, textAlign: 'center' }}>
          <FileBarChart size={40} color="rgba(181,172,138,0.18)" />
          <p style={{ marginTop: 12, color: 'var(--cs-text-muted)' }}>No analysis reports available</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map((rpt: any) => (
            <div key={rpt.id} onClick={() => setSelectedReport(rpt)} style={{
              padding: 16, borderRadius: 10, background: 'var(--cs-glass)', border: '1px solid var(--cs-glass-border)',
              cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: riskColor[rpt.risk_level] + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} color={riskColor[rpt.risk_level]} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cs-text-bright)' }}>{rpt.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginTop: 2 }}>{rpt.zone} · {rpt.type} · {new Date(rpt.date).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: riskColor[rpt.risk_level] }}>{rpt.risk_score}</div>
                <div style={{ fontSize: 10, color: riskColor[rpt.risk_level] }}>{rpt.risk_level}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CCTV Connection Guide Page ──────────────────────────────

function CCTVGuidePage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const steps = [
    { step: 1, title: 'Ensure CCTV is on the same network', desc: 'Your CCTV camera or DVR/NVR must be connected to the same local network (Wi-Fi or Ethernet) as the machine running CrowdShield. Most IP cameras use RTSP protocol.', icon: '🔌' },
    { step: 2, title: 'Find your CCTV RTSP stream URL', desc: 'Common RTSP URL formats:\n• Hikvision: rtsp://<IP>:554/Streaming/Channels/<ID>\n• Dahua: rtsp://<IP>:554/cam/realmonitor?channel=<N>&subtype=0\n• Generic: rtsp://<user>:<pass>@<IP>:554/<path>\n\nYou can find the exact URL in your camera\'s web interface (usually at http://<IP> or http://<IP>:8080).', icon: '🔗' },
    { step: 3, title: 'Add the camera to CrowdShield', desc: 'Go to Live Monitor → Add Camera → Select RTSP type → Paste the stream URL → Assign to a zone. The camera will appear in the CCTV grid.', icon: '➕' },
    { step: 4, title: 'Start ML inference', desc: 'Click "Start ML" on any online camera to begin real-time crowd detection. The YOLO model will detect and count people, calculate density, and update risk scores.', icon: '🧠' },
    { step: 5, title: 'Test with local camera first', desc: 'Use the Device Camera or Live Monitor device source to test the ML pipeline with your laptop/phone camera before connecting CCTV.', icon: '📹' },
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>CCTV Connection Guide</h2>
      <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 20 }}>Step-by-step guide for connecting your CCTV cameras to CrowdShield for real-time crowd analysis.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(s => (
          <div key={s.step} onClick={() => setExpandedStep(expandedStep === s.step ? null : s.step)} style={{
            padding: 16, borderRadius: 10, background: 'var(--cs-glass)', border: '1px solid var(--cs-glass-border)',
            cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--cs-red-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cs-text-bright)' }}>Step {s.step}: {s.title}</div>
              </div>
              <ChevronRight size={14} color="var(--cs-text-muted)" style={{ transform: expandedStep === s.step ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            {expandedStep === s.step && (
              <div style={{ marginTop: 12, paddingLeft: 48, fontSize: 12, color: 'var(--cs-text-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{s.desc}</div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 16, borderRadius: 10, background: 'var(--cs-glass)', border: '1px solid var(--cs-glass-border)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Common RTSP URLs</h3>
        <div style={{ background: '#000', borderRadius: 6, padding: 12, fontSize: 11, fontFamily: 'monospace', color: '#5cb85c', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
{`# Hikvision\nrtsp://admin:password@192.168.1.100:554/Streaming/Channels/101\n\n# Dahua\nrtsp://admin:password@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0\n\n# Generic / ONVIF\nrtsp://admin:password@192.168.1.102:554/live\n\n# USB Webcam (local)\n/dev/video0`}
        </div>
      </div>
    </div>
  );
}

// ─── App Update Page ─────────────────────────────────────────

function AppUpdatePage() {
  const [currentVersion] = useState('2.1.0');
  const [latestVersion] = useState('2.2.0');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMobileUp = useIsMobile();
  const platform = window.crowdshield?.platform || navigator.platform;
  const isWindows = platform?.includes('win');
  const isMac = platform?.includes('mac');
  const isLinux = platform?.includes('linux') || platform?.includes('Linux');
  const isAndroid = platform?.includes('Android');

  const updateAvailable = currentVersion !== latestVersion;

  const changelog = [
    { version: '2.2.0', date: '2026-08-23', changes: [
      'Added Urgent Contact: operators can now directly contact commanders',
      'Added push notifications for all alert types',
      'Added CCTV connection guide with step-by-step instructions',
      'Added crowd analysis report generation',
      'Added surge acknowledgment notifications',
      'Improved ML model accuracy with CrowdHuman/ShanghaiTech training',
      'Fixed nested page navigation across web, desktop, and Android',
      'Fixed desktop application layout and notification system',
      'Fixed Android application layout and notification delivery',
    ]},
    { version: '2.1.0', date: '2026-08-20', changes: [
      'Native Android app with Jetpack Compose',
      'Live CCTV monitoring with YOLO inference',
      'Digital twin venue visualization',
      'AI Assistant with crowd intelligence',
    ]},
  ];

  const download = () => {
    if (updateAvailable) {
      setDownloading(true);
      // Simulate download progress
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 15;
        if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setDownloading(false), 1000); }
        setProgress(Math.min(100, Math.round(p)));
      }, 300);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Application Updates</h2>

      {/* Current Status */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: `1px solid ${updateAvailable ? '#B5AC8A40' : '#5cb85c40'}`, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {updateAvailable ? (
            <><ArrowUp size={20} color="#B5AC8A" /><span style={{ fontSize: 16, fontWeight: 700, color: '#B5AC8A' }}>Update Available</span></>
          ) : (
            <><CheckCircle size={20} color="#5cb85c" /><span style={{ fontSize: 16, fontWeight: 700, color: '#5cb85c' }}>You are up to date</span></>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobileUp ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>Current Version</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{currentVersion}</div>
          </div>
          <div style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>Latest Version</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: updateAvailable ? '#B5AC8A' : '#5cb85c', marginTop: 4 }}>{latestVersion}</div>
          </div>
        </div>

        {updateAvailable && !downloading && (
          <button onClick={download} style={{ width: '100%', marginTop: 12, padding: 12, borderRadius: 8, border: 'none', background: 'var(--cs-red)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Download size={16} /> Update Now
          </button>
        )}

        {downloading && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--cs-text-muted)', marginBottom: 4 }}>
              <span>Downloading...</span><span>{progress}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--cs-red)', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Platform Download Links */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Download for Your Platform</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {[
            { label: 'Windows', icon: '🪟', ext: '.exe', current: isWindows, url: 'https://github.com/ishxn-s11/crowd-shield/releases/latest' },
            { label: 'macOS', icon: '🍎', ext: '.dmg', current: isMac, url: 'https://github.com/ishxn-s11/crowd-shield/releases/latest' },
            { label: 'Linux', icon: '🐧', ext: '.AppImage', current: isLinux, url: 'https://github.com/ishxn-s11/crowd-shield/releases/latest' },
            { label: 'Android', icon: '🤖', ext: '.apk', current: isAndroid, url: 'https://github.com/ishxn-s11/crowd-shield/releases/latest' },
          ].map(p => (
            <a key={p.label} href={p.url} target="_blank" rel="noreferrer" style={{
              padding: 14, borderRadius: 8, border: `1px solid ${p.current ? 'var(--cs-red)' : 'var(--cs-glass-border)'}`,
              background: p.current ? 'var(--cs-red-glow)' : 'rgba(0,0,0,0.4)', textAlign: 'center', textDecoration: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'border-color 0.2s',
            }}>
              <span style={{ fontSize: 24 }}>{p.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: p.current ? 'var(--cs-red)' : 'var(--cs-text)' }}>{p.label}</span>
              <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{p.ext}</span>
              {p.current && <span style={{ fontSize: 9, color: 'var(--cs-red)', fontWeight: 600 }}>Current Platform</span>}
            </a>
          ))}
        </div>
      </div>

      {/* Changelog */}
      <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Changelog</h3>
        {changelog.map(entry => (
          <div key={entry.version} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: entry.version === latestVersion ? '#B5AC8A' : 'var(--cs-text-bright)' }}>v{entry.version}</span>
              <span style={{ fontSize: 10, color: 'var(--cs-text-muted)' }}>{entry.date}</span>
              {entry.version === latestVersion && <span style={{ padding: '1px 6px', borderRadius: 3, background: '#B5AC8A20', color: '#B5AC8A', fontSize: 9, fontWeight: 700 }}>LATEST</span>}
            </div>
            {entry.changes.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 0', fontSize: 12, color: 'var(--cs-text-dim)' }}>
                <Check size={10} color="#5cb85c" style={{ marginTop: 3, flexShrink: 0 }} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/app/*" element={<ProtectedRoutes />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

function ProtectedRoutes() {
  // Always render dashboard content — auth is handled by LoginPage/Clerk separately
  // If no user in local AuthContext, create a default dev user
  if (!AuthContext.getUser()) {
    AuthContext.syncFromClerk({
      id: 'dev-user',
      username: 'commander',
      emailAddresses: [{ emailAddress: 'dev@crowdshield.io' }],
      firstName: 'Dev',
      lastName: 'User',
      unsafeMetadata: { role: 'COMMANDER' },
    });
  }

  const user = AuthContext.getUser();
  const role = user?.role || 'OPERATOR';
  const isCommander = role === 'ADMIN' || role === 'COMMANDER';

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/zones" element={<ZonesPage />} />
        <Route path="/cameras" element={isCommander ? <CamerasPage /> : <Navigate to="/app" />} />
        <Route path="/device-camera" element={<DeviceCameraPage />} />
        <Route path="/live-monitor" element={isCommander ? <LiveMonitorPage /> : <Navigate to="/app" />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/missing" element={<MissingReportsPage />} />
        <Route path="/incidents" element={isCommander ? <IncidentsPage /> : <Navigate to="/app" />} />
        <Route path="/assistant" element={isCommander ? <AssistantPage /> : <Navigate to="/app" />} />
        <Route path="/teams" element={isCommander ? <TeamsPage /> : <Navigate to="/app" />} />
        <Route path="/teams/new" element={isCommander ? <NewTeamPage /> : <Navigate to="/app" />} />
        <Route path="/teams/:teamId" element={isCommander ? <TeamDetailWrapper /> : <Navigate to="/app" />} />
        <Route path="/urgent-contact" element={<UrgentContactPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/analysis-reports" element={<AnalysisReportsPage />} />
        <Route path="/cctv-guide" element={<CCTVGuidePage />} />
        <Route path="/app-update" element={<AppUpdatePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<UserProfileWrapper />} />
        <Route path="/unauthorized" element={<div style={{ padding: 40, textAlign: 'center' }}><ShieldAlert size={48} color="#B5AC8A" /><h2 style={{ color: 'var(--cs-text-bright)', marginTop: 16 }}>Access Restricted</h2><p style={{ color: 'var(--cs-text-muted)', marginTop: 8 }}>This page requires Commander or Admin privileges.</p></div>} />
      </Routes>
    </AppLayout>
  );
}

function TeamDetailWrapper() {
  const { teamId } = useParams();
  return <TeamDetailPage teamId={teamId || ''} />;
}
function UserProfileWrapper() {
  const { userId } = useParams();
  return <UserProfilePage userId={userId || ''} />;
}

// ─── Team Detail Page ─────────────────────────────────────────

function TeamDetailPage({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/teams/${teamId}`).then(r => r.json()).then(setTeam).catch(() => {});
    fetch(`${API}/api/users`).then(r => r.json()).then(setUsers).catch(() => {});
  }, [teamId]);

  if (!team) return <div style={{ color: 'var(--cs-text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <Link to="/teams" style={{ fontSize: 12, color: 'var(--cs-red)', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Back to Teams</Link>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{team.name}</h2>
      <p style={{ fontSize: 12, color: 'var(--cs-text-muted)', marginBottom: 16 }}>{team.specialty} · {team.status}</p>

      <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Team Members ({team.members.length})</h3>
        {team.members.length === 0 ? (
          <p style={{ color: 'var(--cs-text-muted)', fontSize: 12 }}>No members yet. Add users to this team.</p>
        ) : team.members.map((m: any) => {
          const user = users.find(u => u.id === m.user_id);
          return (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(0,0,0,0.4)', borderRadius: 6, marginBottom: 6 }}>
              <div className="neuro-icon" style={{ borderRadius: 18, background: 'var(--cs-red-glow)' }}>
                <User size={16} color="var(--cs-red)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.full_name || m.user_id}</div>
                <div style={{ fontSize: 11, color: 'var(--cs-text-muted)' }}>{m.role} · {user?.email || ''}</div>
              </div>
              <Link to={`/profile/${m.user_id}`} style={{ fontSize: 11, color: 'var(--cs-red)', textDecoration: 'none' }}>View →</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── New Team Page ────────────────────────────────────────────

function NewTeamPage() {
  const [form, setForm] = useState({ name: '', specialty: 'Crowd Control' });
  const navigate = useNavigate();

  const create = async () => {
    if (!form.name) return;
    await fetch(`${API}/api/teams`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    navigate('/teams');
  };

  return (
    <div style={{ maxWidth: 400 }}>
      <Link to="/teams" style={{ fontSize: 12, color: 'var(--cs-red)', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Back</Link>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Create Response Team</h2>
      <div style={{ background: 'var(--cs-glass)', borderRadius: 16, padding: 20, border: '1px solid var(--cs-glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: 'var(--cs-neuro-shadow)' }}>
        <input placeholder="Team Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} style={{ ...inputStyle, appearance: 'auto' }}>
          {['Crowd Control', 'Medical Emergency', 'Evacuation & Routing', 'Fire Response', 'Communication'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={create} style={{ width: '100%', padding: 10, borderRadius: 6, border: 'none', background: 'var(--cs-red)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Create Team</button>
      </div>
    </div>
  );
}

// ─── User Profile Page ────────────────────────────────────────

function UserProfilePage({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API}/api/users/${userId}`).then(r => r.json()).then(setUser).catch(() => {});
    fetch(`${API}/api/teams`).then(r => r.json()).then(setTeams).catch(() => {});
  }, [userId]);

  if (!user) return <div style={{ color: 'var(--cs-text-muted)' }}>Loading...</div>;

  const userTeams = teams.filter(t => t.members.some((m: any) => m.user_id === userId));

  return (
    <div style={{ maxWidth: 600 }}>
      <Link to="/teams" style={{ fontSize: 12, color: 'var(--cs-red)', textDecoration: 'none', marginBottom: 12, display: 'inline-block' }}>← Back</Link>
      <div style={{ background: 'var(--cs-glass)', borderRadius: 10, padding: 24, border: '1px solid var(--cs-glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div className="neuro-icon neuro-icon-lg" style={{ borderRadius: 32, background: 'var(--cs-red-glow)', width: 64, height: 64 }}>
            <User size={28} color="var(--cs-red)" />
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700 }}>{user.full_name}</h3>
            <p style={{ fontSize: 12, color: 'var(--cs-text-muted)' }}>@{user.username}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[{ label: 'Email', value: user.email }, { label: 'Role', value: user.role }, { label: 'Status', value: user.is_active ? 'Active' : 'Inactive' }].map((f, i) => (
            <div key={i} style={{ padding: 12, background: 'rgba(0,0,0,0.4)', borderRadius: 6 }}>
              <div style={{ fontSize: 10, color: 'var(--cs-text-muted)', textTransform: 'uppercase' }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{f.value}</div>
            </div>
          ))}
        </div>
        {userTeams.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Team Memberships</h4>
            {userTeams.map(t => (
              <div key={t.id} style={{ padding: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 6, marginBottom: 4 }}>
                <Link to={`/teams/${t.id}`} style={{ color: 'var(--cs-red)', fontWeight: 600, textDecoration: 'none' }}>{t.name}</Link>
                <span style={{ fontSize: 11, color: 'var(--cs-text-muted)', marginLeft: 8 }}>{t.specialty}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
