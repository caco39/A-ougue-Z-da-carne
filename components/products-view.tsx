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
  const [categoria, setCategoria] = useState("Cervejas");
  const [preco, setPreco] = useState<number | "">("");
  const [estoque, setEstoque] = useState<number | "">("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [unidade, setUnidade] = useState("un");

  // Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const categories = ["Todos", "Cervejas", "Destilados", "Vinhos & Espumantes", "Refrigerantes & Sucos", "Águas & Energéticos", "Petiscos & Diversos"];
  const formCategories = ["Cervejas", "Destilados", "Vinhos & Espumantes", "Refrigerantes & Sucos", "Águas & Energéticos", "Petiscos & Diversos"];

  // Unit Options
  const unitOptions = [
    { value: "kg", label: "Quilo (kg)" },
    { value: "un", label: "Unidade (un)" },
    { value: "g", label: "Grama (g)" },
    { value: "l", label: "Litro (l)" },
    { value: "ml", label: "Mililitro (ml)" },
    { value: "pct", label: "Pacote (pct)" },
    { value: "cx", label: "Caixa (cx)" },
    { value: "fdo", label: "Fardo (fdo)" }
  ];

  const getUnitLabel = (u: string) => {
    switch (u) {
      case "kg": return "Quilo (kg)";
      case "un": return "Unidade (un)";
      case "g": return "Grama (g)";
      case "l": return "Litro (l)";
      case "ml": return "Mililitro (ml)";
      case "pct": return "Pacote (pct)";
      case "cx": return "Caixa (cx)";
      case "fdo": return "Fardo (fdo)";
      default: return u;
    }
  };

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
    setCategoria("Cervejas");
    setPreco("");
    setEstoque("");
    setCodigoBarras(Math.floor(10000000 + Math.random() * 90000000).toString()); // random barcode prefix
    setUnidade("un");
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
    <div id="products-view" className="space-y-6 text-stone-900">
      {/* Toast notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center"
          >
            <Check className="h-5 w-5 mr-2 text-emerald-600" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-xl shadow-2xl flex items-center"
          >
            <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Control row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou código..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition-all outline-none"
          />
        </div>

        <button 
          onClick={handleOpenAdd}
          className="bg-rose-700 hover:bg-rose-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center justify-center transition-all shadow-md hover:shadow-lg"
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
                ? "bg-rose-700 text-white border-rose-600 shadow-sm" 
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Table card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-md">
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
            <table className="w-full text-left text-stone-600 text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Produto</th>
                  <th className="py-4 px-6">Categoria</th>
                  <th className="py-4 px-6">Código Barras</th>
                  <th className="py-4 px-6 text-right">Preço</th>
                  <th className="py-4 px-6 text-center">Estoque</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/50 transition-colors duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
                          <Package className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-800">{p.nome}</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-wider">Venda por {getUnitLabel(p.unidade)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[11px] font-medium text-stone-700 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-stone-500">
                      {p.codigo_barras}
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-rose-600 font-mono text-base">
                      {p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold font-mono px-2.5 py-0.5 rounded-lg border ${
                          p.estoque <= 0 
                            ? "bg-red-50 text-red-600 border-red-200" 
                            : p.estoque <= 10 
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-stone-50 text-stone-800 border-stone-200"
                        }`}>
                          {p.estoque} {p.unidade}
                        </span>
                        {p.estoque <= 10 && (
                          <span className="text-[9px] font-bold text-amber-600 uppercase mt-1 flex items-center">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Estoque Baixo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-50 transition-all border border-transparent hover:border-stone-200"
                          title="Editar Produto"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.nome)}
                          className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                          title="Excluir Produto"
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
        <div id="product-modal" className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-stone-200 text-stone-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-stone-900 flex items-center">
                <Tag className="h-5 w-5 mr-2 text-rose-600" />
                {editingId ? "Editar Produto" : "Cadastrar Novo Produto"}
              </h3>
              <p className="text-stone-500 text-xs mt-1">Preencha os dados do item para inseri-lo ou atualizá-lo no estoque.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product name */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
                  <Package className="h-3 w-3 mr-1" /> Nome do Produto *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Alcatra Maturada Angus"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 outline-none transition-all"
                />
              </div>

              {/* Category and unit selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-3 py-2.5 text-sm text-stone-800 outline-none transition-all"
                  >
                    {formCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
                    <Scale className="h-3 w-3 mr-1" /> Unidade de Venda *
                  </label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-3 py-2.5 text-sm text-stone-800 outline-none transition-all"
                  >
                    {unitOptions.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, stock, barcode */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
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
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2.5 text-sm text-stone-800 font-mono outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">
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
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2.5 text-sm text-stone-800 font-mono outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
                    <Barcode className="h-3 w-3 mr-1" /> Código Barras *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Código..."
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-stone-400 focus:ring-1 focus:ring-stone-400 rounded-xl px-4 py-2.5 text-sm text-stone-800 font-mono outline-none transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-700 text-sm font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center transition-all"
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
