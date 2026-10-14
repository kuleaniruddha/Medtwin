import React, { createContext, useContext, useState, useEffect } from 'react';
import { recordLoginToFirebase, getFirebaseLoginEvents } from '../services/firebase';

const AuthContext = createContext();

export const DUMMY_ACCOUNTS = [
  {
    id: "cmo",
    roleId: "cmo",
    name: "Dr. Sarah Jenkins",
    roleName: "Chief Medical Officer",
    title: "Chief Medical Officer",
    email: "cmo.jenkins@medtwin.health",
    password: "CMO•MedTwin#2026",
    department: "Clinical Governance & Critical Surge Control",
    clearance: "Level 5 — Clinical Directorate",
    badgeClass: "bg-cyan-500/20 text-cyan-700 border-cyan-400 dark:text-cyan-400",
    avatarBg: "from-cyan-500 to-blue-600",
    iconName: "Stethoscope",
    accentColor: "#0284c7"
  },
  {
    id: "ward_mgr",
    roleId: "ward_mgr",
    name: "Marcus Vance, RN",
    roleName: "Ward Manager",
    title: "Ward Manager",
    email: "ward.manager@medtwin.health",
    password: "Ward•Ops#2026",
    department: "Inpatient Bed Allocation & Nursing Flow",
    clearance: "Level 3 — Operations Dispatch",
    badgeClass: "bg-emerald-500/20 text-emerald-700 border-emerald-400 dark:text-emerald-400",
    avatarBg: "from-emerald-500 to-teal-600",
    iconName: "BedDouble",
    accentColor: "#059669"
  },
  {
    id: "logistics",
    roleId: "logistics",
    name: "Elena Rostova",
    roleName: "Logistics Lead",
    title: "Logistics Lead",
    email: "logistics.lead@medtwin.health",
    password: "Logistics•Supply#2026",
    department: "Cryo-Oxygen Reserves & High-Alert Pharmaceuticals",
    clearance: "Level 4 — Supply Operations",
    badgeClass: "bg-amber-500/20 text-amber-700 border-amber-400 dark:text-amber-400",
    avatarBg: "from-amber-500 to-orange-600",
    iconName: "Truck",
    accentColor: "#d97706"
  },
  {
    id: "ai_admin",
    roleId: "ai_admin",
    name: "Dr. Aniruddha Kule",
    roleName: "AI Systems Administrator",
    title: "AI Systems Administrator",
    email: "ai.admin@medtwin.health",
    password: "Neural•Twin#2026",
    department: "Digital Twin Core, Predictive ML & Hospital Simulation",
    clearance: "Level 5 — System SuperAdmin",
    badgeClass: "bg-violet-500/20 text-violet-700 border-violet-400 dark:text-violet-400",
    avatarBg: "from-violet-500 to-indigo-600",
    iconName: "Cpu",
    accentColor: "#7c3aed"
  }
];

export const ROLES = DUMMY_ACCOUNTS.map(acc => ({
  id: acc.id,
  name: acc.name,
  roleName: acc.roleName,
  badgeClass: acc.badgeClass
}));

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('medtwin_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [activeRole, setActiveRole] = useState(() => {
    try {
      const saved = localStorage.getItem('medtwin_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = DUMMY_ACCOUNTS.find(a => a.id === parsed.roleId);
        if (match) return match;
      }
    } catch (_) {}
    return DUMMY_ACCOUNTS[0];
  });

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);

  useEffect(() => {
    try {
      const events = getFirebaseLoginEvents();
      if (events) setLoginHistory(events);
    } catch (_) {}
  }, [currentUser]);

  const loginWithAccount = async (account) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // Simulate real auth handshake with Firebase project medtwin-83f0f
      await new Promise(r => setTimeout(r, 650));

      const sessionUser = {
        uid: `usr_${account.id}_${Date.now().toString(36)}`,
        email: account.email,
        name: account.name,
        roleId: account.id,
        roleName: account.roleName,
        title: account.title,
        clearance: account.clearance,
        department: account.department,
        badgeClass: account.badgeClass,
        accentColor: account.accentColor,
        projectId: "medtwin-83f0f",
        loginAt: new Date().toISOString()
      };

      // Record to Firebase Firestore (and local sync)
      recordLoginToFirebase(sessionUser);

      setCurrentUser(sessionUser);
      setActiveRole(account);

      localStorage.setItem('medtwin_auth_user', JSON.stringify(sessionUser));
      setIsAuthenticating(false);
      return sessionUser;
    } catch (err) {
      setIsAuthenticating(false);
      setAuthError(err.message || "Authentication failed");
      throw err;
    }
  };

  const loginWithCredentials = async (email, password) => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      await new Promise(r => setTimeout(r, 700));

      // Match against dummy accounts or create guest user
      const matched = DUMMY_ACCOUNTS.find(
        acc => acc.email.toLowerCase() === email.trim().toLowerCase()
      );

      const targetAccount = matched || {
        id: "custom_operator",
        roleId: "cmo",
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        roleName: "Clinical Operator",
        title: "Clinical Operator",
        email: email.trim(),
        password: password,
        department: "General Hospital Operations",
        clearance: "Level 2 — General Operations",
        badgeClass: "bg-slate-500/20 text-slate-700 border-slate-400 dark:text-slate-300",
        avatarBg: "from-slate-500 to-slate-700",
        accentColor: "#0284c7"
      };

      return await loginWithAccount(targetAccount);
    } catch (err) {
      setIsAuthenticating(false);
      setAuthError(err.message || "Invalid credentials");
      throw err;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('medtwin_auth_user');
    } catch (_) {}
  };

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    activeRole,
    setActiveRole: (role) => {
      setActiveRole(role);
      const match = DUMMY_ACCOUNTS.find(a => a.id === role.id || a.roleId === role.id);
      if (match && currentUser) {
        const updated = { ...currentUser, roleId: match.id, roleName: match.roleName, clearance: match.clearance };
        setCurrentUser(updated);
        localStorage.setItem('medtwin_auth_user', JSON.stringify(updated));
      }
    },
    userName: currentUser?.name || activeRole.name,
    setUserName: (name) => {
      if (currentUser) {
        const updated = { ...currentUser, name };
        setCurrentUser(updated);
        localStorage.setItem('medtwin_auth_user', JSON.stringify(updated));
      }
    },
    ROLES: DUMMY_ACCOUNTS,
    DUMMY_ACCOUNTS,
    loginWithAccount,
    loginWithCredentials,
    logout,
    isAuthenticating,
    authError,
    loginHistory
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
