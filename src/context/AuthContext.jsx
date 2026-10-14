import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const ROLES = [
  { id: "cmo", name: "Chief Medical Officer", badgeClass: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40" },
  { id: "ward_mgr", name: "Ward Manager", badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  { id: "logistics", name: "Logistics Lead", badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { id: "ai_admin", name: "AI Systems Administrator", badgeClass: "bg-violet-500/20 text-violet-400 border-violet-500/40" }
];

export const AuthProvider = ({ children }) => {
  const [activeRole, setActiveRole] = useState(ROLES[0]);
  const [userName, setUserName] = useState("Dr. Sarah Jenkins");

  return (
    <AuthContext.Provider value={{ activeRole, setActiveRole, userName, setUserName, ROLES }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
