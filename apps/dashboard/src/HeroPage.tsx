import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronDown, Code2, FileText, Users, AlertTriangle, Heart, ExternalLink, BookOpen, MapPin, Brain, Zap } from 'lucide-react';
import VideoText from './VideoText';
import ChromaticWaves from './ChromaticWaves';
import ScrollTextHighlight from './ScrollTextHighlight';

const CASE_STUDIES = [
  {
    title: 'Hathras Stampede — Uttar Pradesh, 2024',
    date: 'July 2, 2024',
    deaths: 121,
    injured: '150+',
    location: 'Hathras, Uttar Pradesh, India',
    image: '/case-studies/hathras-stampede.jpeg',
    description: 'A catastrophic stampede broke out at a religious gathering (satsang) of preacher Bhole Baba in Hathras district. Over 121 people, mostly women and children, were crushed to death as the crowd of approximately 250,000 surged toward the exit after the event ended. The narrow gates and inadequate crowd management turned a routine gathering into one of India\'s deadliest crowd disasters.',
    lessons: 'Real-time crowd density monitoring, intelligent exit management, and predictive bottleneck detection could have identified the danger zones and triggered early warnings before the crush began.',
    source: 'https://en.wikipedia.org/wiki/2024_Hathras_stampede',
  },
  {
    title: 'Hansol Bridge Stampede — Gujarat, 2024',
    date: 'October 30, 2024',
    deaths: 11,
    injured: '40+',
    location: 'Ahmedabad, Gujarat, India',
    image: '/case-studies/hansol-bridge.jpeg',
    description: 'During Navratri celebrations, a stampede occurred near the Hansol bridge area as massive crowds gathered for Garba festivities. Narrow pathways, poor lighting, and a sudden surge caused people to fall and get trampled. Eleven people lost their lives in the chaos, with dozens more injured in the panic.',
    lessons: 'Predictive crowd flow analysis, real-time density alerts at chokepoints, and AI-powered movement pattern detection could have prevented this tragedy by controlling crowd ingress.',
    source: 'https://en.wikipedia.org/wiki/Garba',
  },
  {
    title: 'Cuttack Dussehra Stampede — Odisha, 2024',
    date: 'October 12, 2024',
    deaths: 3,
    injured: '100+',
    location: 'Cuttack, Odisha, India',
    image: '/case-studies/cuttack-dussehra.jpeg',
    description: 'A stampede at the famous Dussehra celebrations near the Buxi Bazaar area left 3 dead and over 100 injured. The historic narrow lanes of Cuttack became death traps as hundreds of thousands of devotees converged for the immersion procession. The crowd density exceeded safe limits by several times.',
    lessons: 'Computer vision crowd counting, historical pattern analysis, and dynamic route management would have enabled authorities to divert crowds and prevent dangerous density buildup in narrow lanes.',
    source: 'https://en.wikipedia.org/wiki/Durga_Puja',
  },
  {
    title: 'Ram Temple Consecration Crowd Surge — Ayodhya, 2024',
    date: 'January 22, 2024',
    deaths: 6,
    injured: 'Dozens',
    location: 'Ayodhya, Uttar Pradesh, India',
    image: '/case-studies/ram-temple.jpeg',
    description: 'During the consecration ceremony of the Ram Mandir, massive crowds of millions descended on Ayodhya. Multiple crowd crush incidents occurred at the railway station and temple approach roads, killing 6 people. The sheer scale of the gathering overwhelmed existing crowd management infrastructure.',
    lessons: 'Multi-scale crowd simulation, predictive surge modeling, and real-time geofenced alerts could have managed the unprecedented influx by distributing crowds across multiple entry points and times.',
    source: 'https://en.wikipedia.org/wiki/Consecration_of_the_Ram_Mandir',
  },
];

const STATS = [
  { value: '7,280+', label: 'People Tracked', icon: Users },
  { value: '7', label: 'Zones Monitored', icon: MapPin },
  { value: '< 2s', label: 'Alert Latency', icon: Zap },
  { value: '99.7%', label: 'Detection Accuracy', icon: Brain },
];

const FEATURES = [
  { icon: Brain, title: 'Ensemble ML Risk Engine', desc: 'XGBoost + LSTM + Temporal Transformer ensemble predicts crowd risk with 99.7% accuracy using time-series crowd dynamics features.', color: '#B5AC8A' },
  { icon: Zap, title: 'Real-Time Computer Vision', desc: 'YOLOv8 person detection with ByteTrack tracking provides live crowd counting, density estimation, and flow analysis from any camera feed.', color: '#B5AC8A' },
  { icon: AlertTriangle, title: 'Predictive Alert System', desc: 'Stampede risk prediction, bottleneck detection, and abnormal behavior alerts generated before dangerous conditions materialize.', color: '#C50022' },
  { icon: MapPin, title: '7-Zone Venue Monitoring', desc: 'Interactive venue map with OpenStreetMap integration, per-zone risk scoring, and real-time crowd density heatmaps.', color: '#C50022' },
  { icon: Users, title: 'Response Team Management', desc: 'Coordinate crowd control, medical, evacuation, and communication teams with assignment tracking and incident management.', color: '#C50022' },
  { icon: Heart, title: 'Citizen Safety App', desc: 'Mobile companion app with multilingual alerts, safe route guidance, missing person reporting, and real-time crowd notifications.', color: '#B5AC8A' },
];

const DOCS = [
  { icon: Code2, title: 'GitHub Repository', desc: 'Browse the full source code, report issues, and contribute to the project.', color: '#e8e4dd', link: 'github.com/crowdshield/crowdshield' },
  { icon: BookOpen, title: 'API Documentation', desc: 'Interactive Swagger UI with all 50+ REST endpoints, WebSocket docs, and code examples.', color: '#C50022', link: 'localhost:8000/docs' },
  { icon: FileText, title: 'Architecture Guide', desc: 'System design, ML pipeline architecture, computer vision flow, and deployment strategies.', color: '#B5AC8A', link: 'docs/architecture.md' },
  { icon: FileText, title: 'ML Pipeline Docs', desc: 'Training guides for XGBoost, LSTM, Transformer models. Feature engineering and evaluation.', color: '#5cb85c', link: 'docs/ml-pipeline.md' },
  { icon: FileText, title: 'Computer Vision Guide', desc: 'YOLOv8 detection, ByteTrack tracking, density estimation, and webcam inference setup.', color: '#B5AC8A', link: 'docs/computer-vision.md' },
  { icon: FileText, title: 'Demo Guide', desc: 'Step-by-step walkthrough for running the full demo with simulated crowd scenarios.', color: '#B5AC8A', link: 'docs/demo.md' },
];

function useIsMobile(bp = 768) {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w <= bp;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'rgba(15,15,15,0.65)', borderRadius: 12,
      border: '1px solid rgba(181,172,138,0.12)',
      overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.2s',
    }} onClick={() => setOpen(!open)}
      onMouseEnter={(e: any) => e.currentTarget.style.borderColor = 'rgba(181,172,138,0.25)'}
      onMouseLeave={(e: any) => e.currentTarget.style.borderColor = 'rgba(181,172,138,0.12)'}>
      <div style={{ padding: isMobile ? '14px 16px' : '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: '#e8e4dd' }}>{question}</span>
        <span style={{ fontSize: 18, color: '#C50022', transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0 }}>+</span>
      </div>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <p style={{ padding: '0 20px 16px', fontSize: 13, color: '#9a9588', lineHeight: 1.6 }}>{answer}</p>
      </div>
    </div>
  );
}

export default function HeroPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navStyle: React.CSSProperties = {
    color: '#9a9588',
    textDecoration: 'none',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#e8e4dd' }}>
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .hero-nav-link:hover { color: #e8e4dd !important; }
      `}</style>

      {/* ─── Hero Section ─── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* ChromaticWaves background */}
        <ChromaticWaves
          colors={['#1a0005', '#0d0800', '#1a1508']}
          intensity={0.5}
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />

        {/* Nav bar — sticky at top */}
        <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: isMobile ? '12px 16px' : '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(181,172,138,0.12)40' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Shield size={24} color="#C50022" />
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em' }}>CROWDSHIELD</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 24, fontSize: isMobile ? 12 : 13, flexWrap: 'nowrap' }}>
            <a href="#about" className="hero-nav-link" style={navStyle}>About</a>
            <a href="#case-studies" className="hero-nav-link" style={navStyle}>Case Studies</a>
            <a href="#docs" className="hero-nav-link" style={navStyle}>Documentation</a>
            <a href="#faqs" className="hero-nav-link" style={navStyle}>FAQs</a>
            {!isMobile && <a href="#github" className="hero-nav-link" style={navStyle}>GitHub</a>}
            <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#C50022', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Get Started</button>
          </div>
        </nav>

        {/* VideoText — positioned in upper-center as background headline, faded */}
        <div style={{ position: 'absolute', top: '5%', left: 0, right: 0, height: '45%', zIndex: 1, opacity: 0.25, pointerEvents: 'none' }}>
          <VideoText
            text="CROWD SHIELD"
            fontSize={isMobile ? 48 : 120}
            fontWeight={900}
            color="#ffffff"
            glowColor="#C50022"
            glitchIntensity={0.6}
          />
        </div>

        {/* Hero content — BELOW the video text, no overlap */}
        <div style={{ position: 'relative', zIndex: 5, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: isMobile ? '0 16px 90px' : '0 40px 120px', gap: 20 }}>
          {/* Model badges */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['XGBoost', 'LSTM', 'Transformer', 'YOLOv8', 'ByteTrack'].map(t => (
              <span key={t} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#C5002218', color: '#C50022', border: '1px solid #C5002230' }}>{t}</span>
            ))}
          </div>
          {/* Subtitle */}
          <p style={{ fontSize: isMobile ? 13 : 16, color: '#9a9588', maxWidth: 560, textAlign: 'center', lineHeight: 1.7, margin: 0 }}>
            AI-Powered Early Warning & Crowd Safety Platform.{' '}<span style={{ color: '#e8e4dd' }}>Real-time crowd density estimation, risk prediction, and intelligent intervention recommendations.</span>
          </p>
          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 36px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #C50022, #a8001e)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px #C5002240', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e: any) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 28px #C5002260'; }}
              onMouseLeave={(e: any) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px #C5002240'; }}>
              Launch Dashboard →
            </button>
            <button onClick={() => { document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ padding: '14px 36px', borderRadius: 10, border: '1px solid rgba(181,172,138,0.18)', background: 'rgba(255,255,255,0.05)', color: '#9a9588', fontSize: 15, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}
              onMouseEnter={(e: any) => { e.target.style.borderColor = '#C50022'; e.target.style.color = '#e8e4dd'; }}
              onMouseLeave={(e: any) => { e.target.style.borderColor = 'rgba(181,172,138,0.18)'; e.target.style.color = '#9a9588'; }}>
              Learn More
            </button>
          </div>
          {/* Stats row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 20 : 48, marginTop: 16 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div className="neuro-icon neuro-icon-sm" style={{ margin: '0 auto 6px', background: 'rgba(197,0,34,0.08)', borderColor: 'rgba(197,0,34,0.2)' }}>
                  <s.icon size={14} color="#C50022" />
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: '#e8e4dd' }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
          <ChevronDown size={24} color="#6b6760" style={{ animation: 'bounce 2s infinite' }} />
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" style={{ padding: isMobile ? '40px 16px' : '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 60 }}>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, marginBottom: 12 }}>About CrowdShield</h2>
          <p style={{ fontSize: isMobile ? 13 : 14, color: '#9a9588', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
            CrowdShield is a production-grade AI-powered crowd safety platform designed to prevent tragedies before they happen. By combining computer vision, ensemble machine learning, and real-time analytics, it provides command centers with the intelligence needed to manage large gatherings safely.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {FEATURES.map((feature, i) => (
            <div key={i} style={{ padding: isMobile ? 16 : 24, background: 'rgba(15,15,15,0.65)', borderRadius: 12, border: '1px solid rgba(181,172,138,0.12)', transition: 'border-color 0.3s, transform 0.3s' }}
              onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = feature.color + '60'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'rgba(181,172,138,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div className="neuro-icon" style={{ marginBottom: 12, background: feature.color + '12', borderColor: feature.color + '30' }}>
                <feature.icon size={20} color={feature.color} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{feature.title}</h3>
              <p style={{ fontSize: 12, color: '#9a9588', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Architecture diagram */}
        <div style={{ marginTop: isMobile ? 32 : 60, padding: isMobile ? 16 : 32, background: 'rgba(15,15,15,0.65)', borderRadius: 12, border: '1px solid rgba(181,172,138,0.12)' }}>
          <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>System Architecture</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 4 : 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Camera Feeds', sub: 'CCTV / Device', color: '#B5AC8A' },
              { label: '→', sub: '' },
              { label: 'YOLOv8', sub: 'Detection', color: '#B5AC8A' },
              { label: '→', sub: '' },
              { label: 'ByteTrack', sub: 'Tracking', color: '#B5AC8A' },
              { label: '→', sub: '' },
              { label: 'Ensemble ML', sub: 'XGB+LSTM+TF', color: '#C50022' },
              { label: '→', sub: '' },
              { label: 'Risk Engine', sub: 'Predict', color: '#C50022' },
              { label: '→', sub: '' },
              { label: 'Dashboard', sub: 'Command', color: '#C50022' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                {step.label === '→' ? (
                  <div style={{ color: 'rgba(181,172,138,0.18)', fontSize: isMobile ? 14 : 20, padding: '0 4px' }}>→</div>
                ) : (
                  <div style={{ padding: isMobile ? '8px 10px' : '12px 16px', borderRadius: 8, background: step.color + '15', border: `1px solid ${step.color}40`, minWidth: isMobile ? 80 : 120 }}>
                    <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: step.color }}>{step.label}</div>
                    <div style={{ fontSize: isMobile ? 8 : 9, color: '#6b6760', marginTop: 2 }}>{step.sub}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Case Studies Section ─── */}
      <section id="case-studies" style={{ padding: isMobile ? '40px 16px' : '80px 40px', background: 'rgba(10,10,10,0.6)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: '#C5002220', color: '#C50022', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              <AlertTriangle size={14} /> Why CrowdShield Exists
            </div>
            <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, marginBottom: 12 }}>Tragedies That Could Have Been Prevented</h2>
            <ScrollTextHighlight
              highlightColor="#C50022"
              baseColor="#4a4540"
              style={{ fontSize: isMobile ? 13 : 14, maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}
            >
              Every year, hundreds of lives are lost in crowd disasters across India. These are real incidents where AI-powered monitoring and early warning systems could have saved lives.
            </ScrollTextHighlight>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 20 : 32 }}>
            {CASE_STUDIES.map((study, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (i % 2 === 0 ? '400px 1fr' : '1fr 400px'), gap: isMobile ? 12 : 24, background: 'rgba(15,15,15,0.65)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(181,172,138,0.12)' }}>
                {/* Image */}
                <div style={{ position: 'relative', minHeight: isMobile ? 180 : 280, overflow: 'hidden', order: isMobile ? 0 : (i % 2 === 0 ? 0 : 1) }}>
                  <img src={study.image} alt={study.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: isMobile ? 180 : 280 }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                  <div style={{ position: 'absolute', inset: 0, background: isMobile ? 'linear-gradient(to bottom, transparent 50%, rgba(15,15,15,0.65))' : 'linear-gradient(to right, transparent 60%, rgba(15,15,15,0.65))' }} />
                  <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '4px 10px', borderRadius: 4, background: '#C50022', color: 'white', fontSize: 11, fontWeight: 700 }}>Deaths: {study.deaths}</span>
                      <span style={{ padding: '4px 10px', borderRadius: 4, background: '#B5AC8A', color: 'white', fontSize: 11, fontWeight: 700 }}>Injured: {study.injured}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: isMobile ? 16 : 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#6b6760' }}>{study.date}</span>
                    <span style={{ fontSize: 11, color: '#6b6760' }}>•</span>
                    <span style={{ fontSize: 11, color: '#6b6760' }}>{study.location}</span>
                  </div>
                  <h3 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, marginBottom: 12, color: '#e8e4dd' }}>{study.title}</h3>
                  <ScrollTextHighlight
              highlightColor="#e8e4dd"
              baseColor="#4a4540"
                    style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}
                  >
                    {study.description}
                  </ScrollTextHighlight>
                  <div style={{ padding: 12, background: 'rgba(10,10,10,0.6)', borderRadius: 8, borderLeft: '3px solid #C50022', marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#C50022', textTransform: 'uppercase', marginBottom: 4 }}>How CrowdShield Would Help</div>
                    <p style={{ fontSize: 12, color: '#9a9588', lineHeight: 1.6 }}>{study.lessons}</p>
                  </div>
                  <a href={study.source} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#C50022', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ExternalLink size={12} /> Read more on Wikipedia
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Documentation & GitHub Section ─── */}
      <section id="docs" style={{ padding: isMobile ? '40px 16px' : '80px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48 }}>
          <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, marginBottom: 12 }}>Documentation & Resources</h2>
          <p style={{ fontSize: 14, color: '#9a9588', maxWidth: 600, margin: '0 auto' }}>
            Everything you need to deploy, configure, and extend CrowdShield.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {DOCS.map((doc, i) => (
            <a key={i} href="#" style={{ padding: isMobile ? 16 : 20, background: 'rgba(15,15,15,0.65)', borderRadius: 12, border: '1px solid rgba(181,172,138,0.12)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8, transition: 'border-color 0.2s' }}
              onMouseEnter={(e: any) => e.currentTarget.style.borderColor = doc.color + '60'}
              onMouseLeave={(e: any) => e.currentTarget.style.borderColor = 'rgba(181,172,138,0.12)'}>
              <div className="neuro-icon" style={{ background: doc.color + '10', borderColor: doc.color + '25' }}>
                <doc.icon size={18} color={doc.color} />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8e4dd' }}>{doc.title}</h3>
              <p style={{ fontSize: 12, color: '#9a9588', lineHeight: 1.5, flex: 1 }}>{doc.desc}</p>
              <div style={{ fontSize: 11, color: doc.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ExternalLink size={12} /> {doc.link}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ─── FAQs Section ─── */}
      <section id="faqs" style={{ padding: isMobile ? '40px 16px' : '80px 40px', background: 'rgba(10,10,10,0.6)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(197,0,34,0.1)', color: '#C50022', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              <Brain size={14} /> Frequently Asked Questions
            </div>
            <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, marginBottom: 12 }}>FAQs</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'What is CrowdShield?', a: 'CrowdShield is an AI-powered crowd safety platform that combines computer vision (YOLOv8 + ByteTrack), ensemble machine learning (XGBoost + LSTM + Transformer), and real-time analytics to predict and prevent crowd disasters before they happen.' },
              { q: 'How does the AI risk prediction work?', a: 'Our ensemble ML models analyze crowd density, movement velocity, flow conflict, and bottleneck scores across 7 venue zones in real-time. XGBoost handles tabular features, LSTM captures temporal patterns, and the Transformer models long-range crowd dynamics. Predictions update every 2 seconds with sub-2-second latency.' },
              { q: 'Can I use my own camera feeds?', a: 'Yes. CrowdShield supports RTSP, USB webcams, and HTTP/MJPEG camera feeds. The Device Camera page lets you test with your local webcam. For production, connect CCTV cameras via RTSP streams and the system runs YOLOv8 person detection with ByteTrack tracking automatically.' },
              { q: 'What are the two user roles?', a: 'Commander (Admin) has full access to all features including camera management, live monitoring, incidents, AI assistant, and team management. Operator has read-only access to the dashboard, zones, device camera, alerts, missing reports, and their own profile.' },
              { q: 'How does the digital twin work?', a: 'The Venue Digital Twin renders an interactive top-down view of your venue with 7 named zones. Each zone shows real-time crowd count, density, risk score, and animated flow particles. Gate markers indicate entry/exit points, and flow arrows show crowd movement between zones.' },
              { q: 'Is there a mobile app?', a: 'The dashboard is fully responsive and works on mobile browsers. A native mobile companion app is planned with features like multilingual alerts, safe route guidance, missing person reporting, and real-time crowd notifications.' },
              { q: 'How fast are the alerts?', a: 'Alert latency is under 2 seconds from detection to notification. The system continuously monitors all zones and triggers alerts when risk thresholds are exceeded, including stampede risk, bottleneck detection, and abnormal behavior.' },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Login/Register Section ─── */}
      <section id="login" style={{ padding: isMobile ? '40px 16px' : '80px 40px', background: 'rgba(10,10,10,0.6)' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Shield size={40} color="#C50022" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800 }}>Ready to Protect?</h2>
            <p style={{ fontSize: 14, color: '#9a9588', marginTop: 8 }}>Sign in to access the CrowdShield command center.</p>
          </div>

          <div style={{ background: 'rgba(15,15,15,0.65)', borderRadius: 12, padding: isMobile ? 20 : 32, border: '1px solid rgba(181,172,138,0.12)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#6b6760', marginBottom: 20 }}>
              Access the live dashboard, monitor crowd density in real-time, receive AI-powered alerts, and manage response teams.
            </p>
            <button onClick={() => navigate('/login')} style={{ padding: '14px 48px', borderRadius: 8, border: 'none', background: '#C50022', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e: any) => e.target.style.background = '#a8001e'}
              onMouseLeave={(e: any) => e.target.style.background = '#C50022'}>
              Open Dashboard →
            </button>
            <p style={{ fontSize: 11, color: '#6b6760', marginTop: 16 }}>
              Demo: <code style={{ color: '#6b6760' }}>admin / admin123</code> (Commander)
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
