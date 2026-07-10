'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Plus, Edit2, Trash2, X, Check, Save, AlertTriangle, 
  Package, Tag, Barcode, Scale, Coins
} from "lucide-react";
import { Product, db } from "../lib/db";

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Carnes Bovinas");
  const [preco, setPreco] = useState<number | "">("");
  const [estoque, setEstoque] = useState<number | "">("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [unidade, setUnidade] = useState("kg");

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = ["Todos", "Carnes Bovinas", "Carnes Suínas", "Aves", "Linguiças & Embutidos", "Bebidas & Outros"];
  const formCategories = ["Carnes Bovinas", "Carnes Suínas", "Aves", "Linguiças & Embutidos", "Bebidas & Outros"];

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const prods = await db.getProducts();
      setProducts(prods);
    } catch (err) {
      console.error("Error loading products:", err);
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
    setCategoria("Carnes Bovinas");
    setPreco("");
    setEstoque("");
    setCodigoBarras(Math.floor(10000000 + Math.random() * 90000000).toString()); // random barcode prefix
    setUnidade("kg");
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setNome(p.nome);
    setCategoria(p.categoria);
    setPreco(p.preco);
    setEstoque(p.estoque);
    setCodigoBarras(p.codigo_barras);
    setUnidade(p.unidade);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o produto "${name}"?`)) {
      const ok = await db.deleteProduct(id);
      if (ok) {
        triggerSuccess("Produto excluído com sucesso!");
        loadProducts();
      } else {
        triggerError("Falha ao excluir o produto.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !categoria || preco === "" || estoque === "" || !codigoBarras.trim()) {
      triggerError("Preencha todos os campos obrigatórios.");
      return;
    }

    const payload = {
      nome: nome.trim(),
      categoria,
      preco: Number(preco),
      estoque: Number(estoque),
      codigo_barras: codigoBarras.trim(),
      unidade
    };

    if (editingId) {
      // update
      const updated = await db.updateProduct(editingId, payload);
      if (updated) {
        triggerSuccess("Produto atualizado com sucesso!");
        setShowModal(false);
        loadProducts();
      } else {
        triggerError("Falha ao atualizar o produto.");
      }
    } else {
      // create
      const created = await db.addProduct(payload);
      if (created) {
        triggerSuccess("Produto cadastrado com sucesso!");
        setShowModal(false);
        loadProducts();
      } else {
        triggerError("Falha ao cadastrar o produto.");
      }
    }
  };

  // Filter products by search query and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.codigo_barras.includes(searchQuery);
    const matchesCategory = selectedCategory === "Todos" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="products-view" className="space-y-6">
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
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou código..." 
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
          Cadastrar Produto
        </button>
      </div>

      {/* Categories select row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat 
                ? "bg-rose-900 text-stone-100 border-rose-800" 
                : "bg-stone-900 text-stone-400 border-stone-850 hover:bg-stone-850"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Table card */}
      <div className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-600 mx-auto"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-stone-500 text-sm">
            Nenhum produto cadastrado ou correspondente à busca.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-stone-300 text-sm">
              <thead>
                <tr className="border-b border-stone-800 bg-stone-950/40 text-stone-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Produto</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Código Barras</th>
                  <th className="py-4 px-6 text-right">Preço</th>
                  <th className="py-4 px-6 text-center">Estoque</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-850">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-850/20 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-rose-950/20 text-rose-400 border border-rose-900/15">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-100">{p.nome}</p>
                          <p className="text-[10px] text-stone-500 uppercase tracking-wider">{p.unidade === 'kg' ? 'Venda por Quilo' : 'Venda por Unidade'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-medium text-stone-300 bg-stone-950 px-3 py-1 rounded-full border border-stone-800">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-stone-400">
                      {p.codigo_barras}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-rose-400 font-mono text-base">
                      {p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg border ${
                          p.estoque <= 0 
                            ? "bg-red-950/50 text-red-400 border-red-900/30" 
                            : p.estoque <= 10 
                            ? "bg-amber-950/55 text-amber-400 border-amber-900/35"
                            : "bg-stone-950 text-stone-200 border-stone-800"
                        }`}>
                          {p.estoque} {p.unidade}
                        </span>
                        {p.estoque <= 10 && (
                          <span className="text-[9px] font-bold text-amber-500 uppercase mt-1 flex items-center">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Estoque Baixo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-stone-400 hover:text-stone-100 rounded-lg hover:bg-stone-850 transition-all border border-transparent hover:border-stone-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.nome)}
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
        <div id="product-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-stone-900 border border-stone-800 text-stone-200 p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 p-1.5 rounded-xl hover:bg-stone-850"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-stone-100 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-rose-500" />
                {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
              </h3>
              <p className="text-stone-500 text-xs mt-1">Preencha os dados do item para inseri-lo ou atualizá-lo no estoque.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product name */}
              <div>
                <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                  <Package className="h-3 w-3 mr-1" /> Nome do Produto *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Alcatra Maturada Angus"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 placeholder-stone-700"
                />
              </div>

              {/* Category and unit selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-3 py-2.5 text-sm text-stone-300"
                  >
                    {formCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Scale className="h-3 w-3 mr-1" /> Unidade de Venda *
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-stone-950 border border-stone-850 rounded-xl p-1">
                    {(["kg", "un"] as const).map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnidade(u)}
                        className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                          unidade === u 
                            ? "bg-rose-950 text-rose-300" 
                            : "text-stone-500 hover:text-stone-300"
                        }`}
                      >
                        {u === "kg" ? "Quilo (kg)" : "Unidade (un)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price, stock, barcode */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Coins className="h-3 w-3 mr-1" /> Preço (R$) *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                    Estoque Inicial *
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.1"
                    placeholder="0.0"
                    value={estoque}
                    onChange={(e) => setEstoque(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-400 mb-1.5 flex items-center">
                    <Barcode className="h-3 w-3 mr-1" /> Código Barras *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Código..."
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-850 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-4 py-2.5 text-sm text-stone-200 font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
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
                  Salvar Produto
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
