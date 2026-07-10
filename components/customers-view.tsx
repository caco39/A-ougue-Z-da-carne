'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Plus, Edit2, Trash2, X, Check, Save, AlertCircle, 
  User, Award, Phone, Mail, FileText
} from "lucide-react";
import { Customer, db } from "../lib/db";

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [pontos, setPontos] = useState<number>(0);

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    try {
      const custs = await db.getCustomers();
      setCustomers(custs);
    } catch (err) {
      console.error("Error loading customers:", err);
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
    setEditingId(null);
    setNome("");
    setCpf("");
    setTelefone("");
    setEmail("");
    setPontos(0);
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingId(c.id);
    setNome(c.nome);
    setCpf(c.cpf);
    setTelefone(c.telefone);
    setEmail(c.email || "");
    setPontos(c.pontos);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o cliente "${name}"?`)) {
      const ok = await db.deleteCustomer(id);
      if (ok) {
        triggerSuccess("Cliente excluído com sucesso!");
        loadCustomers();
      } else {
        triggerError("Falha ao excluir o cliente.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !cpf.trim() || !telefone.trim()) {
      triggerError("Nome, CPF e Telefone são obrigatórios.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      cpf: cpf.trim(),
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      pontos
    };

    if (editingId) {
      const updated = await db.updateCustomer(editingId, payload);
      if (updated) {
        triggerSuccess("Cliente atualizado com sucesso!");
        setShowModal(false);
        loadCustomers();
      } else {
        triggerError("Falha ao atualizar o cliente.");
      }
    } else {
      const created = await db.addCustomer(payload);
      if (created) {
        triggerSuccess("Cliente cadastrado com sucesso!");
        setShowModal(false);
        loadCustomers();
      } else {
        triggerError("Falha ao cadastrar o cliente.");
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.cpf.includes(searchQuery) ||
    c.telefone.includes(searchQuery)
  );

  return (
    <div id="customers-view" className="space-y-6">
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

      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF ou celular..." 
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
          Cadastrar Cliente
        </button>
      </div>

      {/* Main Customers List */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600 mx-auto"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-20 text-stone-500 text-sm">
            Nenhum cliente cadastrado ou encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-stone-300 text-sm">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/40 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">CPF / Identificação</th>
                  <th className="py-4 px-6">Contato</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6 text-center">Fidelidade</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-850/20 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/15 font-bold uppercase text-xs w-10 h-10 flex items-center justify-center">
                          {c.nome.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-stone-100">{c.nome}</p>
                          <p className="text-[10px] text-stone-500 font-mono">ID: {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-stone-300">
                      {c.cpf}
                    </td>
                    <td className="py-4 px-6 text-stone-400">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1.5 text-stone-500" />
                        {c.telefone}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-stone-400">
                      {c.email ? (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1.5 text-stone-500" />
                          {c.email}
                        </div>
                      ) : (
                        <span className="text-stone-600">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center bg-rose-950/20 border border-rose-900/30 text-rose-400 px-3 py-1 rounded-full text-xs font-bold font-mono">
                        <Award className="h-3.5 w-3.5 mr-1" />
                        {c.pontos} pts
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-850 transition-all border border-transparent hover:border-stone-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id, c.nome)}
                          className="p-2 text-stone-500 hover:text-red-400 rounded-lg hover:bg-red-950/20 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL (ADD / EDIT) */}
      {showModal && (
        <div id="customer-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
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
                <User className="h-5 w-5 mr-2 text-rose-500" />
                {editingId ? "Editar Cliente" : "Cadastrar Cliente"}
              </h3>
              <p className="text-stone-500 text-xs mt-1">Preencha os campos abaixo para cadastrar ou gerenciar o cliente.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                  Nome Completo *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Carlos Silva Medeiros"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200"
                />
              </div>

              {/* CPF & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <FileText className="h-3 w-3 mr-1" /> CPF *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Phone className="h-3 w-3 mr-1" /> Telefone Celular *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                  <Mail className="h-3 w-3 mr-1" /> E-mail (Opcional)
                </label>
                <input 
                  type="email" 
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200"
                />
              </div>

              {/* Points (Only editable for editing/refactoring) */}
              {editingId && (
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Award className="h-3 w-3 mr-1" /> Pontos de Fidelidade Acumulados
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={pontos}
                    onChange={(e) => setPontos(parseInt(e.target.value) || 0)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>
              )}

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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
