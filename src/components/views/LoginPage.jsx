import { 
  Activity, Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft,
  Stethoscope, BedDouble, Truck, Cpu, Check, ShieldCheck, RefreshCw
} from 'lucide-react';
import { useAuth, DUMMY_ACCOUNTS } from '../../context/AuthContext';
import { seedFirestoreCollections } from '../../services/firebase';

export const LoginPage = ({ onLoginSuccess, onBackToHome }) => {
  const { loginWithAccount, loginWithCredentials, isAuthenticating, authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Trigger Firestore collection check & seed on mount
  React.useEffect(() => {
    seedFirestoreCollections().catch(() => {});
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMessage('Syncing collections with Firebase medtwin-83f0f...');
    await seedFirestoreCollections();
    setTimeout(() => {
      setIsSyncing(false);
      setStatusMessage('Collections verified on Firebase!');
      setTimeout(() => setStatusMessage(''), 2500);
    }, 800);
  };

  // Subtle mouse movement interaction
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    setMousePos({ x: clientX, y: clientY });

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (clientX - centerX) / (rect.width / 2);
      const deltaY = (clientY - centerY) / (rect.height / 2);

      // Very subtle tilt (max 3 degrees) for elegant feel
      const tiltX = -deltaY * 2.5;
      const tiltY = deltaX * 2.5;
      cardRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  // 1-Click dummy role selection with automatic login
  const handleSelectRole = async (account) => {
    if (isAuthenticating) return;

    setSelectedRole(account.id);
    setEmail(account.email);
    setPassword(account.password);
    setStatusMessage(`Signing in as ${account.roleName}...`);

    try {
      await loginWithAccount(account);
      setStatusMessage('Signed in! Redirecting to dashboard...');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 350);
    } catch (err) {
      setStatusMessage('');
    }
  };

  // Manual email & password login
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || isAuthenticating) return;

    setStatusMessage('Verifying credentials...');
    try {
      await loginWithCredentials(email, password);
      setStatusMessage('Signed in! Redirecting...');
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess();
      }, 350);
    } catch (err) {
      setStatusMessage('');
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 'cmo': return Stethoscope;
      case 'ward_mgr': return BedDouble;
      case 'logistics': return Truck;
      case 'ai_admin': return Cpu;
      default: return ShieldCheck;
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Soft, elegant ambient light gradient following mouse */}
      <div 
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(8, 127, 154, 0.08), transparent 70%)`
        }}
      />

      {/* Subtle background ambient pastel blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-100/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Header Navigation ── */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <button 
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-cyan-600 hover:text-cyan-700 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-300 px-3 py-1.5 rounded-full shadow-xs transition-all cursor-pointer"
          title="Click to verify or seed Firestore collections"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Firebase: <strong className="text-slate-800 font-semibold">medtwin-83f0f</strong></span>
          <RefreshCw className={`w-3 h-3 text-slate-400 ${isSyncing ? 'animate-spin text-cyan-600' : ''}`} />
        </button>
      </header>

      {/* ── Center Login Card ── */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-4 py-4 my-auto">
        <div 
          ref={cardRef}
          className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 transition-transform duration-200 ease-out"
          style={{ willChange: 'transform' }}
        >
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20 mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-heading">
              Sign In to MedTwin
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your role for 1-click access, or enter your credentials.
            </p>
          </div>

          {/* ── 4 Dummy Login Buttons (Clean 2x2 Grid) ── */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Quick 1-Click Persona Login
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DUMMY_ACCOUNTS.map((account) => {
                const IconComponent = getRoleIcon(account.id);
                const isSelected = selectedRole === account.id;

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleSelectRole(account)}
                    disabled={isAuthenticating}
                    className={`group text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'border-cyan-600 bg-cyan-50/60 shadow-sm ring-1 ring-cyan-600/30'
                        : 'border-slate-200 bg-white hover:border-cyan-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    <div className={`p-2 rounded-lg text-slate-700 bg-slate-100 group-hover:bg-cyan-600 group-hover:text-white transition-colors flex-shrink-0 ${
                      isSelected ? '!bg-cyan-600 !text-white' : ''
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-700 truncate transition-colors">
                        {account.roleName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {account.name}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtle Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or sign in with email</span>
            </div>
          </div>

          {/* ── Manual Login Form ── */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  required
                  disabled={isAuthenticating}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  disabled={isAuthenticating}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Status Feedback / Errors */}
            {statusMessage && (
              <div className="text-xs text-cyan-700 font-medium bg-cyan-50 border border-cyan-200 p-2.5 rounded-lg flex items-center gap-2 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                <span>{statusMessage}</span>
              </div>
            )}

            {authError && (
              <div className="text-xs text-rose-700 font-medium bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                {authError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating || !email || !password}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer security note */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>HIPAA-compliant session</span>
            <span>256-bit SSL encryption</span>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} MedTwin • Predictive Hospital Resource & Digital Twin Platform
      </footer>
    </div>
  );
};
