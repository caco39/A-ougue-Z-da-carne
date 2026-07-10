'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
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
import logoImg from "@/src/assets/images/ze_da_carne_logo_1783698673060.jpg";

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
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
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
    <div id="app-root" className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
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
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-100/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-stone-200/50 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-white border border-stone-200 p-8 rounded-3xl shadow-xl relative z-10 space-y-6"
            >
              {/* Logo / Header */}
              <div className="text-center space-y-3">
                <div className="mx-auto w-24 h-24 bg-stone-100 border border-stone-200 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                  <Image
                    src={logoImg}
                    alt="Zé da Carne"
                    fill
                    sizes="96px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-stone-900 uppercase">
                  Zé da Carne
                </h1>
                <p className="text-stone-500 text-xs">
                  Acesse sua conta para gerenciar o PDV e as finanças.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-semibold flex items-center">
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
                      className="w-full bg-white border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 transition-all outline-none"
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
                      className="w-full bg-white border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-sm tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center"
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
              <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-2xl space-y-1 text-center">
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-center">
                  <Key className="h-3 w-3 mr-1 text-rose-600" /> Credenciais de Demonstração
                </p>
                <p className="text-[11px] font-mono text-stone-700">
                  Usuário: <span className="text-rose-600 font-bold">admin</span> | Senha: <span className="text-rose-600 font-bold">admin</span>
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
            <aside id="sidebar" className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 p-5 space-y-6 h-full select-none">
               {/* Brand Header */}
              <div className="flex items-center space-x-3 pb-4 border-b border-stone-200">
                <div className="w-12 h-12 bg-stone-50 border border-stone-200 rounded-xl overflow-hidden flex items-center justify-center relative shrink-0">
                  <Image
                    src={logoImg}
                    alt="Zé da Carne"
                    fill
                    sizes="48px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-stone-900 tracking-tight leading-tight uppercase">
                    Zé da Carne
                  </h2>
                  <span className="text-[10px] text-emerald-600 font-medium flex items-center">
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
                          ? "bg-rose-50 text-rose-700 border-rose-100 shadow-sm"
                          : "text-stone-500 border-transparent hover:text-stone-900 hover:bg-stone-50"
                      }`}
                    >
                      <IconComponent className={`h-4.5 w-4.5 ${isActive ? "text-rose-600" : "text-stone-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Sidebar Footer / User Profile & Logout */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center space-x-3 px-2">
                  <div className="w-8 h-8 bg-stone-100 rounded-full border border-stone-200 flex items-center justify-center font-bold text-xs text-rose-600 font-mono">
                    AD
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-800 truncate">Administrador</p>
                    <p className="text-[9px] text-stone-500 truncate">Sessão Ativa</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-50 border border-stone-200 text-stone-600 hover:text-red-600 hover:border-red-200 transition-all hover:bg-red-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sair do Sistema</span>
                </button>
              </div>
            </aside>

            {/* Topbar (Mobile) */}
            <header className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 bg-stone-50 border border-stone-200 rounded-lg overflow-hidden flex items-center justify-center relative shrink-0">
                  <Image
                    src={logoImg}
                    alt="Zé da Carne"
                    fill
                    sizes="40px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="font-extrabold text-sm text-stone-900 tracking-tight leading-tight uppercase">
                  Zé da Carne
                </h2>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-600"
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
                  className="md:hidden bg-white border-b border-stone-200 px-4 py-3 space-y-1 relative z-25"
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
                            ? "bg-rose-50 text-rose-700"
                            : "text-stone-500 hover:bg-stone-100"
                        }`}
                      >
                        <IconComponent className="h-4.5 w-4.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
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
