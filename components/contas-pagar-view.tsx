'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Plus, Trash2, X, Check, Save, AlertCircle, 
  FileText, Calendar, DollarSign, Tag, CheckCircle2, AlertTriangle, UserCheck
} from "lucide-react";
import { ContaPagar, db } from "../lib/db";

export default function ContasPagarView() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Pago" | "Pendente">("Todos");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [valor, setValor] = useState<number | "">("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState<"Pendente" | "Pago">("Pendente");
  const [categoria, setCategoria] = useState("Mercadoria");
  const [observacoes, setObservacoes] = useState("");

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = ["Mercadoria", "Insumos", "Utilidades", "Infraestrutura", "Impostos", "Pessoal", "Outros"];

  useEffect(() => {
    loadContas();
  }, []);

  async function loadContas() {
    setLoading(true);
    try {
      const data = await db.getContasPagar();
      setContas(data);
    } catch (err) {
      console.error("Error loading contas a pagar:", err);
    } finally {
      setLoading(false);
    }
  }

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 3000);
  };

  const handleOpenAdd = () => {
    setDescricao("");
    setFornecedorNome("");
    setValor("");
    setDataVencimento(new Date().toISOString().split("T")[0]);
    setStatus("Pendente");
    setCategoria("Mercadoria");
    setObservacoes("");
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Excluir o lançamento "${name}"?`)) {
      const ok = await db.deleteContaPagar(id);
      if (ok) {
        triggerSuccess("Lançamento excluído com sucesso!");
        loadContas();
      } else {
        triggerError("Falha ao excluir lançamento.");
      }
    }
  };

  const handleToggleStatus = async (item: ContaPagar) => {
    const newStatus = item.status === "Pago" ? "Pendente" : "Pago";
    const dataPagamento = newStatus === "Pago" ? new Date().toISOString().split("T")[0] : null;

    const ok = await db.updateContaPagar(item.id, { 
      status: newStatus,
      data_pagamento: dataPagamento
    });

    if (ok) {
      triggerSuccess(`Conta lançada como ${newStatus === "Pago" ? "PAGA" : "PENDENTE"}!`);
      loadContas();
    } else {
      triggerError("Falha ao alterar o status do pagamento.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao.trim() || valor === "" || !dataVencimento) {
      triggerError("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      descricao: descricao.trim(),
      fornecedor_nome: fornecedorNome.trim() || undefined,
      valor: Number(valor),
      data_vencimento: dataVencimento,
      status: status,
      categoria: categoria,
      observacoes: observacoes.trim() || undefined,
      data_pagamento: status === "Pago" ? new Date().toISOString().split("T")[0] : null
    };

    const created = await db.addContaPagar(payload);
    if (created) {
      triggerSuccess("Lançamento financeiro cadastrado!");
      setShowModal(false);
      loadContas();
    } else {
      triggerError("Falha ao salvar lançamento.");
    }
  };

  const filteredContas = contas.filter(c => {
    const matchesSearch = c.descricao.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.fornecedor_nome && c.fornecedor_nome.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "Todos" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOutstanding = filteredContas
    .filter(c => c.status === "Pendente")
    .reduce((sum, c) => sum + c.valor, 0);

  const totalPaid = filteredContas
    .filter(c => c.status === "Pago")
    .reduce((sum, c) => sum + c.valor, 0);

  return (
    <div id="contas-pagar-view" className="space-y-6">
      {/* Toast notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-rose-950/95 text-rose-300 border border-rose-900 px-4 py-3 rounded-xl shadow-2xl flex items-center"
          >
            <Check className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-red-950/90 text-red-300 border border-red-900 px-4 py-3 rounded-xl shadow-2xl flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Pendente</span>
            <h4 className="text-2xl font-black text-amber-500 font-mono mt-1">
              {totalOutstanding.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h4>
          </div>
          <div className="p-3 bg-amber-950/20 text-amber-500 rounded-xl border border-amber-900/10">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Pago</span>
            <h4 className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {totalPaid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </h4>
          </div>
          <div className="p-3 bg-emerald-950/20 text-emerald-400 rounded-xl border border-emerald-900/10">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Filtro Rápido</span>
          <div className="grid grid-cols-3 gap-1 bg-stone-950 p-1 border border-stone-850 rounded-xl mt-2">
            {(["Todos", "Pendente", "Pago"] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === status 
                    ? "bg-rose-950 text-rose-300 border border-rose-900/20" 
                    : "text-stone-500 hover:text-stone-400"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou fornecedor..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-300 placeholder-stone-600 transition-all"
          />
        </div>

        <button 
          onClick={handleOpenAdd}
          className="bg-rose-900 hover:bg-rose-850 border border-rose-800/40 text-stone-100 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center transition-all shadow-md shadow-rose-950/25"
        >
          <Plus className="h-4 w-4 mr-2" />
          Lançar Conta a Pagar
        </button>
      </div>

      {/* Table list */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600 mx-auto"></div>
          </div>
        ) : filteredContas.length === 0 ? (
          <div className="text-center py-20 text-stone-500 text-sm">
            Nenhuma conta cadastrada ou correspondente aos filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-stone-300 text-sm">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/40 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Descrição / Fornecedor</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Vencimento</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Valor</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {filteredContas.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-850/20 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl border font-bold uppercase text-xs w-10 h-10 flex items-center justify-center ${
                          item.status === "Pago" 
                            ? "bg-emerald-950/15 text-emerald-400 border-emerald-900/10" 
                            : "bg-amber-950/15 text-amber-500 border-amber-900/10"
                        }`}>
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-100">{item.descricao}</p>
                          <p className="text-[10px] text-stone-500 flex items-center mt-0.5">
                            <UserCheck className="h-3 w-3 mr-1 text-stone-600" />
                            {item.fornecedor_nome || "Fornecedor não especificado"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-medium text-stone-300 bg-stone-950 px-3 py-1 rounded-full border border-stone-800">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-400">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-stone-500" />
                        {new Date(item.data_vencimento).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                          item.status === "Pago" 
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40 hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/30" 
                            : "bg-amber-950/40 text-amber-500 border-amber-900/40 hover:bg-emerald-950/35 hover:text-emerald-400 hover:border-emerald-900/30"
                        }`}
                      >
                        {item.status === "Pago" ? "✓ Pago" : "⚠ Pendente"}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-stone-100 font-mono text-base">
                      {item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleDelete(item.id, item.descricao)}
                        className="p-2 text-stone-500 hover:text-red-400 rounded-lg hover:bg-red-950/20 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL (ADD) */}
      {showModal && (
        <div id="conta-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-stone-900 border border-stone-800 text-stone-200 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 p-1.5 rounded-xl hover:bg-stone-850"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-stone-100 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-rose-500" />
                Lançar Conta a Pagar
              </h3>
              <p className="text-stone-500 text-xs mt-1">Insira os dados do pagamento/despesa para o planejamento do fluxo de caixa.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Descrição da Despesa *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Conta de Energia Copel - Junho"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200"
                />
              </div>

              {/* Supplier / Fornecedor */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Fornecedor / Credor
                </label>
                <input 
                  type="text" 
                  placeholder="Ex: Copel Distribuidora S.A."
                  value={fornecedorNome}
                  onChange={(e) => setFornecedorNome(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200"
                />
              </div>

              {/* Value & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" /> Valor (R$) *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" /> Data Vencimento *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-300 font-mono"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Tag className="h-3 w-3 mr-1" /> Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-3 py-2.5 text-sm text-stone-300"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                    Status de Lançamento
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-950 border border-stone-850 rounded-xl p-1">
                    {(["Pendente", "Pago"] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          status === s 
                            ? s === "Pago" ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                            : "text-stone-500 hover:text-stone-400"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                  Observações / Notas
                </label>
                <textarea 
                  placeholder="Ex: Boleto emitido com vencimento prorrogado..."
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2 text-sm text-stone-200"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-900 hover:bg-rose-850 text-stone-100 rounded-xl font-bold text-sm border border-rose-800/55 shadow-lg shadow-rose-950/15 flex items-center justify-center transition-all"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
