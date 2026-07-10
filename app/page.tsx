'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, ShoppingCart, Beef, Users, FileText, 
  LogOut, Shield, Key, Sparkles, Menu, X, ArrowRight
} from "lucide-react";

import { db } from "../lib/db";
import DashboardView from "../components/dashboard-view";
import PdvView from "../components/pdv-view";
import ProductsView from "../components/products-view";
import CustomersView from "../components/customers-view";
import ContasPagarView from "../components/contas-pagar-view";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setIsLoggedIn(db.isLoggedIn());
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    setTimeout(() => {
      const success = db.login(username, password);
      setLoginLoading(false);
      if (success) {
        setIsLoggedIn(true);
        setActiveTab("dashboard");
      } else {
        setLoginError("Usuário ou senha incorretos.");
      }
    }, 600); // realistic short delay
  };

  const handleLogout = () => {
    db.logout();
    setIsLoggedIn(false);
  };

  // Nav items configuration
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pdv", label: "Ponto de Venda", icon: ShoppingCart },
    { id: "produtos", label: "Produtos", icon: Beef },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "contas", label: "Contas a Pagar", icon: FileText }
  ];

  return (
    <div id="app-root" className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      <AnimatePresence mode="wait">
        {!isLoggedIn ? (
          /* LOGIN VIEW */
          <motion.div
            key="login-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-4 relative overflow-hidden"
          >
            {/* Visual background accents */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-900/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-900/40 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-stone-900 border border-stone-800 p-8 rounded-3xl shadow-2xl relative z-10 space-y-6"
            >
              {/* Logo / Header */}
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-rose-950 border border-rose-900 rounded-2xl flex items-center justify-center text-rose-400">
                  <Beef className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-100">
                  Açougue Gourmet
                </h1>
                <p className="text-stone-500 text-xs">
                  Acesse sua conta para gerenciar o PDV e as finanças.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="bg-red-950/45 text-red-300 border border-red-900/30 p-3 rounded-xl text-xs font-semibold flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    {loginError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Usuário
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Nome de usuário..."
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-700 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Sua senha..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder-stone-700 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 bg-rose-900 hover:bg-rose-850 text-stone-100 border border-rose-800 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-rose-950/25 transition-all flex items-center justify-center"
                >
                  {loginLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Helper Credentials */}
              <div className="bg-stone-950 border border-stone-850 p-3.5 rounded-2xl space-y-1 text-center">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-center">
                  <Key className="h-3 w-3 mr-1 text-rose-400" /> Credenciais de Demonstração
                </p>
                <p className="text-[11px] font-mono text-stone-300">
                  Usuário: <span className="text-rose-400 font-bold">admin</span> | Senha: <span className="text-rose-400 font-bold">admin</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* MAIN WORKSPACE */
          <motion.div
            key="main-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col md:flex-row h-screen overflow-hidden"
          >
            {/* Sidebar (Desktop) */}
            <aside id="sidebar" className="hidden md:flex flex-col w-64 bg-stone-900 border-r border-stone-800 p-5 space-y-6 h-full select-none">
              {/* Brand Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-stone-850">
                <div className="w-10 h-10 bg-rose-900 border border-rose-800 rounded-xl flex items-center justify-center text-rose-100">
                  <Beef className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-stone-100 tracking-tight leading-tight">
                    Açougue Gourmet
                  </h2>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Supabase Conectado
                  </span>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav className="flex-1 space-y-1.5">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                        isActive
                          ? "bg-rose-950/40 text-rose-300 border-rose-900/35 shadow-md"
                          : "text-stone-400 border-transparent hover:text-stone-200 hover:bg-stone-850/50"
                      }`}
                    >
                      <IconComponent className={`h-4.5 w-4.5 ${isActive ? "text-rose-400" : "text-stone-500"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer / User Profile & Logout */}
              <div className="pt-4 border-t border-stone-850 space-y-3">
                <div className="flex items-center space-x-3 px-2">
                  <div className="w-8 h-8 bg-stone-950 rounded-full border border-stone-800 flex items-center justify-center font-bold text-xs text-rose-400 font-mono">
                    AD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-200 truncate">Administrador</p>
                    <p className="text-[9px] text-stone-500 truncate">Sessão Ativa</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-950 border border-stone-850 text-stone-400 hover:text-red-400 hover:border-red-950/30 transition-all hover:bg-red-950/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </aside>

            {/* Topbar (Mobile) */}
            <header className="md:hidden bg-stone-900 border-b border-stone-800 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-rose-900 rounded-lg flex items-center justify-center text-rose-100">
                  <Beef className="h-4 w-4" />
                </div>
                <h2 className="font-extrabold text-xs text-stone-100 tracking-tight">
                  Açougue Gourmet
                </h2>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 bg-stone-950 border border-stone-850 rounded-lg text-stone-400"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </header>

            {/* Mobile Nav Overlay Menu */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:hidden bg-stone-900 border-b border-stone-800 px-4 py-3 space-y-1 relative z-25"
                >
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-rose-950/45 text-rose-300"
                            : "text-stone-400 hover:bg-stone-850/50"
                        }`}
                      >
                        <IconComponent className="h-4.5 w-4.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/20"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    <span>Sair do Sistema</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MAIN VIEWS SWITCHSTAGE */}
            <main id="main-content-stage" className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === "dashboard" && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
                  {activeTab === "pdv" && <PdvView />}
                  {activeTab === "produtos" && <ProductsView />}
                  {activeTab === "clientes" && <CustomersView />}
                  {activeTab === "contas" && <ContasPagarView />}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
