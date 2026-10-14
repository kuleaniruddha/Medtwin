import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Cpu, Shield, BarChart3, Brain, Layers, ArrowRight, Heart, Zap, Wifi, ChevronDown, Users, Bed, Pill, TrendingUp, Star, CheckCircle } from 'lucide-react';

/* ─── Animated counter hook ──────────────────────────────── */
const useCountUp = (end, duration = 2000, startOnMount = false) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(startOnMount);

  const start = useCallback(() => setStarted(true), []);

  useEffect(() => {
    if (!started) return;
    let startTs = null;
    let raf;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  return [count, start];
};

/* ─── Intersection Observer hook ─────────────────────────── */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, { threshold: 0.2, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, inView];
};

/* ─── Floating particle canvas ───────────────────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let particles = [];
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 60;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8, 127, 154, ${p.opacity})`;
        ctx.fill();

        // Draw connection lines
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(8, 127, 154, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-particles" />;
};

/* ─── Animated heartbeat line SVG ────────────────────────── */
const HeartbeatLine = () => (
  <svg className="landing-heartbeat-svg" viewBox="0 0 600 80" preserveAspectRatio="none">
    <path
      d="M0,40 L100,40 L120,40 L140,15 L160,65 L180,30 L200,50 L220,40 L340,40 L360,40 L380,10 L400,70 L420,25 L440,55 L460,40 L600,40"
      fill="none"
      stroke="url(#heartGrad)"
      strokeWidth="2.5"
      className="landing-heartbeat-path"
    />
    <defs>
      <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="rgba(8,127,154,0.05)" />
        <stop offset="30%" stopColor="rgba(8,127,154,0.6)" />
        <stop offset="50%" stopColor="rgba(4,120,87,0.7)" />
        <stop offset="70%" stopColor="rgba(8,127,154,0.6)" />
        <stop offset="100%" stopColor="rgba(8,127,154,0.05)" />
      </linearGradient>
    </defs>
  </svg>
);

/* ─── Interactive floating orb that follows cursor ───────── */
const FloatingOrb = () => {
  const orbRef = useRef(null);

  useEffect(() => {
    let mx = window.innerWidth / 2;
    let my = 300;
    let cx = mx, cy = my;

    const handleMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', handleMove);

    let raf;
    const animate = () => {
      cx += (mx - cx) * 0.03;
      cy += (my - cy) * 0.03;
      if (orbRef.current) {
        orbRef.current.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

  return <div ref={orbRef} className="landing-orb" />;
};

/* ─── Feature card ───────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, description, color, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`landing-feature-card ${inView ? 'in-view' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="landing-feature-icon" style={{ background: `${color}12`, color }}>
        <Icon size={28} />
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
    </div>
  );
};

/* ─── Stat card with count-up ────────────────────────────── */
const StatCard = ({ icon: Icon, value, suffix, label, color }) => {
  const [ref, inView] = useInView();
  const [count, start] = useCountUp(value, 2200);

  useEffect(() => {
    if (inView) start();
  }, [inView, start]);

  return (
    <div ref={ref} className={`landing-stat-card ${inView ? 'in-view' : ''}`}>
      <div className="landing-stat-icon" style={{ color }}>
        <Icon size={22} />
      </div>
      <div className="landing-stat-value" style={{ color }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="landing-stat-label">{label}</div>
    </div>
  );
};

/* ─── Testimonial card ───────────────────────────────────── */
const TestimonialCard = ({ name, role, text, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`landing-testimonial ${inView ? 'in-view' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="landing-testimonial-stars">
        {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
      </div>
      <p className="landing-testimonial-text">"{text}"</p>
      <div className="landing-testimonial-author">
        <div className="landing-testimonial-avatar">{name.charAt(0)}</div>
        <div>
          <div className="landing-testimonial-name">{name}</div>
          <div className="landing-testimonial-role">{role}</div>
        </div>
      </div>
    </div>
  );
};

/* ─── Step card ───────────────────────────────────────────── */
const StepCard = ({ number, title, description, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`landing-step-card ${inView ? 'in-view' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="landing-step-number">{number}</div>
      <h4 className="landing-step-title">{title}</h4>
      <p className="landing-step-desc">{description}</p>
    </div>
  );
};

/* ─── Floating badge ─────────────────────────────────────── */
const FloatingBadge = ({ icon: Icon, label, className }) => (
  <div className={`landing-floating-badge ${className}`}>
    <Icon size={16} />
    <span>{label}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export const LandingPage = ({ onEnter }) => {
  const [loaded, setLoaded] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true));
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`landing-root ${loaded ? 'loaded' : ''}`}>
      {/* ── NAV BAR ── */}
      <nav className={`landing-nav ${navScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-brand-icon">
              <Activity size={20} />
            </div>
            <span className="landing-brand-text">MedTwin</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#stats" className="landing-nav-link">Impact</a>
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
            <button onClick={onEnter} className="landing-nav-cta">
              Launch Dashboard <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="landing-hero">
        <ParticleCanvas />
        <FloatingOrb />

        {/* Floating badges */}
        <FloatingBadge icon={Heart} label="Real-time Monitoring" className="badge-1" />
        <FloatingBadge icon={Wifi} label="Live Data Sync" className="badge-2" />
        <FloatingBadge icon={Shield} label="99.9% Uptime" className="badge-3" />

        <div className="landing-hero-content">
          <div className="landing-hero-eyebrow">
            <Zap size={14} />
            <span>AI-Powered Hospital Intelligence</span>
          </div>

          <h1 className="landing-hero-title">
            <span className="landing-hero-line-1">Your Hospital's</span>
            <span className="landing-hero-line-2">
              <span className="landing-gradient-text">Digital Twin</span>
            </span>
            <span className="landing-hero-line-3">Starts Here</span>
          </h1>

          <p className="landing-hero-subtitle">
            Predict demand, optimize bed allocation, and manage resources in
            real-time with intelligent simulation and actionable forecasts.
          </p>

          <div className="landing-hero-actions">
            <button onClick={onEnter} className="landing-cta-primary" id="hero-enter-btn">
              <span>Enter Dashboard</span>
              <ArrowRight size={18} />
            </button>
            <button onClick={scrollToFeatures} className="landing-cta-secondary">
              Explore Features
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="landing-hero-trust">
            <CheckCircle size={14} />
            <span>No installation required &mdash; runs in your browser</span>
          </div>
        </div>

        <HeartbeatLine />
      </section>

      {/* ── STATS SECTION ── */}
      <section className="landing-section landing-stats-section" id="stats">
        <div className="landing-container">
          <div className="landing-stats-grid">
            <StatCard icon={Bed} value={2400} suffix="+" label="Beds Managed" color="#087f9a" />
            <StatCard icon={Users} value={180} suffix="+" label="Staff Tracked" color="#047857" />
            <StatCard icon={Pill} value={520} suffix="+" label="Supply Items" color="#6d5bd0" />
            <StatCard icon={TrendingUp} value={97} suffix="%" label="Forecast Accuracy" color="#b45309" />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-eyebrow">Powerful Capabilities</div>
            <h2 className="landing-section-title">Everything You Need to Run <span className="landing-gradient-text">Smarter Hospitals</span></h2>
            <p className="landing-section-subtitle">
              From bed management to AI-driven forecasts, MedTwin gives operations teams
              complete visibility and predictive power.
            </p>
          </div>

          <div className="landing-features-grid">
            <FeatureCard
              icon={Bed}
              title="Smart Bed Manager"
              description="Real-time ward-by-ward bed tracking with drag-and-drop allocation, patient assignment, and occupancy heatmaps."
              color="#087f9a"
              delay={0}
            />
            <FeatureCard
              icon={Layers}
              title="Resource Tracker"
              description="Live inventory monitoring for PPE, medications, oxygen, and surgical supplies with automatic low-stock alerts."
              color="#047857"
              delay={100}
            />
            <FeatureCard
              icon={BarChart3}
              title="Demand Forecasting"
              description="AI-powered 7-day admission, discharge, and ER visit predictions with scenario modeling for surge planning."
              color="#6d5bd0"
              delay={200}
            />
            <FeatureCard
              icon={Brain}
              title="Digital Twin Simulation"
              description="Visual patient-flow simulation engine showing bottlenecks, queue times, and what-if scenario analysis in real time."
              color="#b45309"
              delay={300}
            />
            <FeatureCard
              icon={Shield}
              title="Smart Alerts"
              description="Rule-based alerting system that surfaces critical capacity breaches, expiring supplies, and staffing gaps before they escalate."
              color="#be123c"
              delay={400}
            />
            <FeatureCard
              icon={Cpu}
              title="AI Copilot Chat"
              description="Ask questions in natural language — get instant answers about capacity, trends, and recommended actions from MedTwin AI."
              color="#0d9488"
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-section landing-how-section" id="how-it-works">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-eyebrow">Simple Setup</div>
            <h2 className="landing-section-title">Get Started in <span className="landing-gradient-text">Three Steps</span></h2>
          </div>
          <div className="landing-steps-grid">
            <StepCard number="01" title="Connect Your Data" description="Plug in your hospital's data feeds — or use our built-in simulator to explore instantly." delay={0} />
            <StepCard number="02" title="Configure & Customize" description="Set alert thresholds, define wards, and tailor the dashboard to your operations workflow." delay={150} />
            <StepCard number="03" title="Monitor & Predict" description="Watch real-time metrics, run what-if simulations, and let the AI copilot guide your decisions." delay={300} />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <div className="landing-section-eyebrow">Trusted by Leaders</div>
            <h2 className="landing-section-title">What Operations Teams <span className="landing-gradient-text">Are Saying</span></h2>
          </div>
          <div className="landing-testimonials-grid">
            <TestimonialCard
              name="Dr. Priya Sharma"
              role="Chief Medical Officer"
              text="MedTwin reduced our bed turnaround time by 34%. The digital twin simulation is a game-changer for planning surge capacity."
              delay={0}
            />
            <TestimonialCard
              name="Rajesh Kulkarni"
              role="Operations Manager"
              text="The AI copilot answers questions that used to take us hours of digging through spreadsheets. Truly transformative."
              delay={150}
            />
            <TestimonialCard
              name="Sarah Chen"
              role="Nursing Director"
              text="Finally, a dashboard that gives me real-time ward visibility. Alert accuracy is outstanding — we catch issues before they escalate."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="landing-section landing-final-cta">
        <div className="landing-container">
          <div className="landing-cta-card">
            <h2 className="landing-cta-title">Ready to Transform Hospital Operations?</h2>
            <p className="landing-cta-subtitle">
              Launch the MedTwin dashboard and experience intelligent hospital management today.
            </p>
            <button onClick={onEnter} className="landing-cta-primary large" id="final-enter-btn">
              <span>Open MedTwin Dashboard</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <Activity size={18} />
              <span>MedTwin</span>
            </div>
            <p className="landing-footer-copy">
              © {new Date().getFullYear()} MedTwin — Predictive Hospital Resource & Digital Twin Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
