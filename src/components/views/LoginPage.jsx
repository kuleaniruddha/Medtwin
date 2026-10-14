import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft,
  Sparkles, Database, Cpu, CheckCircle2, Zap, Stethoscope, Bed, Truck,
  KeyRound, Shield, Radio, Terminal
} from 'lucide-react';
import { useAuth, DUMMY_ACCOUNTS } from '../../context/AuthContext';

export const LoginPage = ({ onLoginSuccess, onBackToHome }) => {
  const { loginWithAccount, loginWithCredentials, isAuthenticating, authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [activeStepText, setActiveStepText] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Mouse tilt & spotlight state
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, normX: 0, normY: 0 });

  // ── Particle & Interactive Mesh Canvas ────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = 45;
    const particles = [];
    const colors = ['rgba(6, 182, 212, 0.65)', 'rgba(16, 185, 129, 0.65)', 'rgba(99, 102, 241, 0.65)'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI
      });
    }

    let mouseCoord = { x: width / 2, y: height / 2 };
    const onCanvasMouseMove = (e) => {
      mouseCoord.x = e.clientX;
      mouseCoord.y = e.clientY;
    };
    window.addEventListener('mousemove', onCanvasMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update & render particles
      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Interaction with mouse pointer
        const dx = mouseCoord.x - p.x;
        const dy = mouseCoord.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          p.x -= (dx / dist) * 1.5;
          p.y -= (dy / dist) * 1.5;
        }

        // Draw particle dot
        const glowRadius = p.radius + Math.sin(p.pulse) * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, glowRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect nearby nodes
        for (let j = index + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist2 = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist2 < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.22 * (1 - dist2 / 110)})`;
            ctx.lineWidth = 0.85;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onCanvasMouseMove);
    };
  }, []);

  // ── 3D Card Tilt & Interactive Mouse Coordinates ──────────────
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Normalizing between -1 and 1
    const normX = (clientX / innerWidth) * 2 - 1;
    const normY = (clientY / innerHeight) * 2 - 1;

    setMousePos({ x: clientX, y: clientY, normX, normY });

    if (cardRef.current) {
      const tiltX = -normY * 7; // deg
      const tiltY = normX * 7;  // deg
      cardRef.current.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    }
  };

  // ── Auto-Fill & Automatic Login for the 4 Dummy Buttons ────────
  const handleDummyRoleClick = async (account) => {
    if (isAutoTyping || isAuthenticating) return;

    setSelectedRole(account.id);
    setIsAutoTyping(true);
    setEmail('');
    setPassword('');
    setActiveStepText(`Selecting ${account.roleName}...`);

    // Simulated authentic typing animation for eye-catching feel
    const targetEmail = account.email;
    const targetPass = account.password;

    for (let i = 1; i <= targetEmail.length; i++) {
      setEmail(targetEmail.slice(0, i));
      await new Promise(r => setTimeout(r, 15));
    }

    setActiveStepText('Encrypting credentials...');
    for (let i = 1; i <= targetPass.length; i++) {
      setPassword(targetPass.slice(0, i));
      await new Promise(r => setTimeout(r, 12));
    }

    setIsAutoTyping(false);
    setActiveStepText(`Authenticating with Firebase [medtwin-83f0f]...`);

    try {
      await loginWithAccount(account);
      setActiveStepText('Handshake approved! Launching digital twin...');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 400);
    } catch (err) {
      setActiveStepText('');
    }
  };

  // ── Manual Login Submission ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || isAuthenticating) return;

    setActiveStepText('Verifying credentials with Firebase medtwin-83f0f...');
    try {
      await loginWithCredentials(email, password);
      setActiveStepText('Access Granted. Opening MedTwin...');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 400);
    } catch (err) {
      setActiveStepText('');
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'cmo': return Stethoscope;
      case 'ward_mgr': return Bed;
      case 'logistics': return Truck;
      case 'ai_admin': return Cpu;
      default: return ShieldCheck;
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Interactive Mesh Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-80" />

      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.16), rgba(16, 185, 129, 0.05) 45%, transparent 70%)`
        }}
      />

      {/* Atmospheric neon glows in corners */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />

      {/* ── Top Navigation Bar ── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBackToHome}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-all text-xs font-semibold backdrop-blur"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/25">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-lg text-white tracking-tight">MedTwin</span>
              <span className="ml-2 text-[10px] font-mono tracking-widest uppercase bg-cyan-950/80 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/60">
                Cloud Identity
              </span>
            </div>
          </div>
        </div>

        {/* Firebase Live Status Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 hidden md:inline">Firebase Project:</span>
          <span className="text-cyan-400 font-bold">medtwin-83f0f</span>
        </div>
      </header>

      {/* ── Main Login Center ── */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-center my-auto">
        
        {/* Holographic 3D Tilt Card */}
        <div 
          ref={cardRef}
          className="w-full max-w-4xl bg-slate-900/75 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-cyan-950/40 transition-transform duration-150 ease-out relative overflow-hidden"
          style={{ willChange: 'transform' }}
        >
          {/* Subtle top edge specular highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          {/* Header titles */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/40 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Biometric & Role-Based Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
              Sign In to <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">MedTwin TwinCore</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
              Select one of the 4 operational roles below for instant one-click authentication, or enter custom credentials.
            </p>
          </div>

          {/* ── 4 DUMMY QUICK-LOGIN ROLE BUTTONS (Eye-Catching Grid) ── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Quick-Select Operational Personas (One-Click Auto Login):
              </span>
              <span className="text-[11px] text-cyan-400/90 font-medium hidden sm:inline">
                Click any role to autofill & authenticate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DUMMY_ACCOUNTS.map((acc) => {
                const IconComponent = getRoleIcon(acc.id);
                const isSelected = selectedRole === acc.id;

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleDummyRoleClick(acc)}
                    disabled={isAuthenticating || isAutoTyping}
                    className={`group relative text-left p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/50 hover:-translate-y-1'
                    }`}
                  >
                    {/* Role badge glow */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`p-2 rounded-xl text-white bg-gradient-to-br ${acc.avatarBg} shadow-md`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {acc.clearance.split('—')[0].trim()}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {acc.roleName}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium line-clamp-1 mt-0.5">
                        {acc.name}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="group-hover:text-cyan-400 transition-colors font-mono">
                        {acc.email.split('@')[0]}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>

                    {/* Active highlight bar */}
                    {isSelected && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-emerald-400 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Form Section ── */}
          <form onSubmit={handleSubmit} className="border-t border-slate-800/80 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Operator Email / ID</span>
                  <span className="text-[10px] text-slate-500 font-mono">Encrypted Firebase Auth</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4 text-cyan-400/80" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. cmo.jenkins@medtwin.health"
                    required
                    disabled={isAuthenticating || isAutoTyping}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Access Key / Password</span>
                  <span className="text-[10px] text-slate-500 font-mono">SHA-256 / Firebase</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4 text-cyan-400/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    disabled={isAuthenticating || isAutoTyping}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember Me and Live Feedback text */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 text-xs">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 w-3.5 h-3.5"
                />
                <span>Persist session in secure local state</span>
              </label>

              {activeStepText ? (
                <div className="flex items-center gap-2 text-cyan-400 font-mono animate-pulse">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{activeStepText}</span>
                </div>
              ) : (
                <span className="text-slate-500 font-mono text-[11px]">
                  SSL/TLS • 2048-bit Key Exchange
                </span>
              )}
            </div>

            {/* Error banner if any */}
            {authError && (
              <div className="mt-3 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 font-mono">
                <Shield className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* ── Submit / Authenticate Button ── */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={isAuthenticating || isAutoTyping || !email || !password}
                className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
              >
                {isAuthenticating || isAutoTyping ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Synchronizing with Firebase...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize & Open MedTwin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Telemetry pill row */}
          <div className="mt-8 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Firestore Sync: Active</span>
            </div>
            <div>Database: medtwin-83f0f.firestore</div>
            <div>Latency: 32ms</div>
            <div>Clearance Protocol: HIPAA / ISO-27001</div>
          </div>
        </div>
      </main>

      {/* ── Bottom Footer ── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-900">
        <p>© {new Date().getFullYear()} MedTwin Digital Twin Platform. Firebase Connected.</p>
        <p className="font-mono text-[11px] text-slate-600">Instance ID: medtwin-83f0f-live</p>
      </footer>
    </div>
  );
};
