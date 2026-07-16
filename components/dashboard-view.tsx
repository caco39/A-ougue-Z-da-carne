'use client';

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { TrendingUp, Users, AlertTriangle, FileText, ShoppingBag, ArrowUpRight, CheckCircle, Calendar } from "lucide-react";
import { Product, Customer, ContaPagar, Sale, db } from "../lib/db";

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, custs, cnts, sls] = await Promise.all([
          db.getProducts(),
          db.getCustomers(),
          db.getContasPagar(),
          db.getSales()
        ]);
        setProducts(prods);
        setCustomers(custs);
        setContas(cnts);
        setSales(sls);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div id="dashboard-loading" className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Calculate stats
  const totalSalesToday = sales
    .filter(s => {
      const todayStr = new Date().toISOString().split("T")[0];
      return s.data_venda.startsWith(todayStr);
    })
    .reduce((sum, s) => sum + s.total, 0);

  const pendingContas = contas.filter(c => c.status === "Pendente");
  const totalPendingContasAmount = pendingContas.reduce((sum, c) => sum + c.valor, 0);

  const lowStockProducts = products.filter(p => p.estoque <= 10);

  // Recent sales list
  const recentSales = sales.slice(0, 5);

  return (
    <div id="dashboard-view" className="space-y-8">
      {/* Hero Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-stone-900 to-rose-950 p-8 rounded-2xl border border-stone-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-900/50">
            Painel de Controle
          </span>
          <h1 className="text-4xl font-black text-stone-100 tracking-tight uppercase">
            Distribuidora Dona Budega
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Bem-vindo ao seu painel de gestão integrada. Acompanhe suas vendas em tempo real, gerencie o estoque, clientes e controle suas contas a pagar de forma automatizada e integrada ao Supabase.
          </p>
        </div>

        <div className="absolute top-0 right-0 w-80 h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-900/15 via-stone-900/0 to-stone-900/0 pointer-events-none" />
      </motion.div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1: Sales Today */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate("pdv")}
          className="group cursor-pointer bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-rose-900/50 transition-all duration-300 shadow-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Vendas Hoje</p>
            <h3 className="text-2xl font-bold text-stone-100 mt-1">
              {totalSalesToday.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-xs text-emerald-400 font-medium flex items-center mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>PDV Ativo</span>
            </p>
          </div>
          <div className="bg-rose-950/50 p-4 rounded-xl border border-rose-900/30 text-rose-400 group-hover:bg-rose-900 group-hover:text-rose-100 transition-colors duration-300">
            <ShoppingBag className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Stat 2: Active Customers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          onClick={() => onNavigate("clientes")}
          className="group cursor-pointer bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-rose-900/50 transition-all duration-300 shadow-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Clientes Cadastrados</p>
            <h3 className="text-2xl font-bold text-stone-100 mt-1">
              {customers.length}
            </h3>
            <p className="text-xs text-stone-400 mt-2">Clientes ativos na loja</p>
          </div>
          <div className="bg-amber-950/30 p-4 rounded-xl border border-amber-900/30 text-amber-400 group-hover:bg-amber-900 group-hover:text-amber-100 transition-colors duration-300">
            <Users className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Stat 3: Out of Stock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate("produtos")}
          className="group cursor-pointer bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-rose-900/50 transition-all duration-300 shadow-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Alerta de Estoque</p>
            <h3 className="text-2xl font-bold text-rose-500 mt-1">
              {lowStockProducts.length}
            </h3>
            <p className="text-xs text-amber-400 font-medium flex items-center mt-2">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>≤ 10 kg/un</span>
            </p>
          </div>
          <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/20 text-rose-500 group-hover:bg-rose-950 group-hover:text-rose-400 transition-colors duration-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </motion.div>

        {/* Stat 4: Accounts Payable */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          onClick={() => onNavigate("contas")}
          className="group cursor-pointer bg-stone-900 p-6 rounded-2xl border border-stone-800 hover:border-rose-900/50 transition-all duration-300 shadow-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Contas a Pagar</p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">
              {totalPendingContasAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h3>
            <p className="text-xs text-amber-400 mt-2">{pendingContas.length} contas pendentes</p>
          </div>
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-stone-400 group-hover:bg-stone-850 group-hover:text-stone-200 transition-colors duration-300">
            <FileText className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Recent Sales & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions list (2/3 width) */}
        <div className="lg:col-span-2 bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-100 flex items-center">
              <ShoppingBag className="h-5 w-5 mr-2 text-rose-500" />
              Últimas Vendas Realizadas
            </h2>
            <button 
              onClick={() => onNavigate("pdv")} 
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center transition-colors duration-200"
            >
              Ir para o PDV
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentSales.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-sm">
                Nenhuma venda realizada hoje ainda.
              </div>
            ) : (
              <table className="w-full text-left text-stone-300 text-sm">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3">Data/Hora</th>
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Forma de Pgto</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-stone-850/30 transition-colors duration-150">
                      <td className="py-3.5 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-stone-500" />
                        {new Date(sale.data_venda).toLocaleDateString("pt-BR")} {new Date(sale.data_venda).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 font-medium text-stone-200">
                        {sale.cliente_nome || "Cliente Balcão"}
                      </td>
                      <td className="py-3.5 text-stone-400">
                        {sale.forma_pagamento}
                      </td>
                      <td className="py-3.5 text-right font-bold text-stone-100">
                        {sale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stock Warnings (1/3 width) */}
        <div className="bg-stone-900 p-6 rounded-2xl border border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-100 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-rose-500" />
              Estoque Crítico
            </h2>
            <button 
              onClick={() => onNavigate("produtos")} 
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center transition-colors duration-200"
            >
              Ver tudo
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10 text-stone-500 text-sm flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500/80 mb-1" />
                <span>Todos os produtos com estoque em dia!</span>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-stone-950 border border-stone-800 hover:border-stone-700 transition-colors duration-150"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-stone-200">{p.nome}</p>
                    <p className="text-xs text-stone-500">{p.categoria}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${p.estoque === 0 ? 'bg-red-950/55 text-red-400 border border-red-900/40' : 'bg-amber-950/45 text-amber-400 border border-amber-900/35'}`}>
                      {p.estoque} {p.unidade}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
