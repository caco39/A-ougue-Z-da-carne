'use client';

import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Minus, 
  History, 
  Search, 
  SlidersHorizontal, 
  Beef, 
  CornerDownRight, 
  CornerDownLeft, 
  User, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { db, Product, StockMovement, User as SystemUser } from '@/lib/db';

interface StockViewProps {
  dbRefresh: number;
  triggerRefresh: () => void;
  user: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function StockView({ dbRefresh, triggerRefresh, user, showToast }: StockViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- FORMULÁRIO DE MOVIMENTAÇÃO DE ESTOQUE ---
  const [selectedProdId, setSelectedProdId] = useState<number>(1);
  const [formQty, setFormQty] = useState(1.000);
  const [formType, setFormType] = useState<StockMovement['tipoMovimentacao']>('ENTRADA');
  const [formMotive, setFormMotive] = useState('');

  // Sincroniza dados
  useEffect(() => {
    setProducts(db.getProducts().filter(p => p.ativo));
    setMovements(db.getStockMovements());
    setUsers(db.getUsers());
  }, [dbRefresh]);

  // Filtros de Histórico
  const filteredMovements = movements.filter(m => {
    const prod = products.find(p => p.id === m.produtoId);
    if (!prod) return false;
    const matchesSearch = prod.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.codigoInterno.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // --- AÇÃO SALVAR AJUSTE ---
  const handleStockAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || formQty <= 0 || !formMotive) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    db.addStockMovement(selectedProdId, formQty, formType, formMotive, user.id);
    
    const prodName = products.find(p => p.id === selectedProdId)?.nome || 'Produto';
    showToast(`Movimentação de ${formType} de ${formQty} ${products.find(p => p.id === selectedProdId)?.unidade} em ${prodName} salva com sucesso!`, 'success');
    
    // Reseta form
    setFormQty(1.000);
    setFormMotive('');
    triggerRefresh();
  };

  const handleQuickReplenish = (prodId: number, qty: number) => {
    db.addStockMovement(prodId, qty, 'ENTRADA', 'Reabastecimento rápido de lote de carne', user.id);
    const prodName = products.find(p => p.id === prodId)?.nome || 'Produto';
    showToast(`Reabastecido +${qty} unidades/kg de ${prodName} com sucesso!`, 'success');
    triggerRefresh();
  };

  // Encontra alertas de estoque baixo para exibição
  const lowStockItems = products.filter(p => p.estoque <= p.estoqueMinimo);

  return (
    <div className="space-y-6 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Movimentação & Ajuste de Estoque</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Entradas de mercadoria, baixas por perdas no açougue e inventário histórico</p>
        </div>
      </div>

      {/* Grid de Formulário de Entrada/Saída e Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloco 1: Registrar Movimentação Manual */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Boxes className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Lançar Ajuste Manual</h3>
          </div>

          <form onSubmit={handleStockAdjust} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Selecionar Carne / Item *</label>
              <select 
                value={selectedProdId}
                onChange={(e) => setSelectedProdId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none font-semibold text-slate-750 dark:text-slate-300"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    🥩 {p.nome} ({p.codigoInterno}) [Estoque: {p.estoque.toFixed(1)} {p.unidade}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Ajuste *</label>
                <select 
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="ENTRADA">🟢 Entrada (+)</option>
                  <option value="SAIDA">🔴 Saída (-)</option>
                  <option value="AJUSTE_INVENTARIO">🔵 Inventário (=)</option>
                  <option value="PERDA">⚫ Perda / Descarte (x)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Qtd / Peso *</label>
                <input 
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={formQty}
                  onChange={(e) => setFormQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivo / Justificativa *</label>
              <input 
                type="text"
                placeholder="Ex: Compra de carcaça Friboi"
                value={formMotive}
                onChange={(e) => setFormMotive(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Confirmar Movimentação
            </button>
          </form>
        </div>

        {/* Bloco 2: Alertas de Reposição Rápida */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Alerta de Reposição Urgente</h3>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-500 px-2.5 py-0.5 rounded-lg border border-amber-200/40">
              {lowStockItems.length} itens baixos
            </span>
          </div>

          <div className="overflow-y-auto max-h-[220px] pr-1 space-y-2.5">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(p => {
                const isVeryLow = p.estoque === 0;
                return (
                  <div 
                    key={p.id}
                    className="p-3 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-amber-500 transition-all"
                  >
                    <div className="space-y-0.5">
                      <p className="font-mono text-[9px] font-bold text-slate-400 leading-none">{p.codigoInterno}</p>
                      <h4 className="text-xs font-bold text-slate-950 dark:text-white">{p.nome}</h4>
                      <p className="text-[10px] text-slate-500">
                        Mínimo: {p.estoqueMinimo.toFixed(1)} {p.unidade} • <span className={`font-black ${isVeryLow ? 'text-red-600' : 'text-amber-500'}`}>Estoque Atual: {p.estoque.toFixed(1)} {p.unidade}</span>
                      </p>
                    </div>

                    <div className="flex gap-1.5 w-full sm:w-auto">
                      <button 
                        onClick={() => handleQuickReplenish(p.id, p.unidade === 'KG' ? 20.0 : 10)}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Reabastecer {p.unidade === 'KG' ? '+20kg' : '+10un'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-14 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <p className="font-semibold">Estoque Saudável!</p>
                <p className="text-[11px]">Todos os cortes de carne possuem quantidades adequadas acima do limite mínimo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico Consolidado de Todas as Entradas e Saídas */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header do Histórico */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Histórico de Movimentações</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5" />
            <input 
              type="text"
              placeholder="Filtrar histórico por carne..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                <th className="p-4">Data/Hora</th>
                <th className="p-4">Carne / Item</th>
                <th className="p-4 text-center">Tipo</th>
                <th className="p-4 text-right">Quantidade</th>
                <th className="p-4">Finalidade / Motivo</th>
                <th className="p-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredMovements.length > 0 ? (
                filteredMovements.map(m => {
                  const prod = products.find(p => p.id === m.produtoId);
                  const op = users.find(u => u.id === m.usuarioId)?.nome || 'Operador';
                  
                  // Detalhes visuais
                  let badge = '';
                  let icon = null;
                  if (m.tipoMovimentacao === 'ENTRADA') {
                    badge = 'bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600';
                    icon = <CornerDownRight className="w-3.5 h-3.5" />;
                  } else if (m.tipoMovimentacao === 'SAIDA') {
                    badge = 'bg-red-50 dark:bg-red-950/10 text-red-600';
                    icon = <CornerDownLeft className="w-3.5 h-3.5" />;
                  } else if (m.tipoMovimentacao === 'AJUSTE_INVENTARIO') {
                    badge = 'bg-blue-50 dark:bg-blue-950/10 text-blue-600';
                    icon = <SlidersHorizontal className="w-3.5 h-3.5" />;
                  } else {
                    badge = 'bg-slate-100 dark:bg-slate-800 text-slate-600';
                    icon = <AlertTriangle className="w-3.5 h-3.5" />;
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-850 dark:text-slate-250">
                      <td className="p-4 font-mono text-slate-400">{new Date(m.dataMovimentacao).toLocaleString('pt-BR')}</td>
                      <td className="p-4">
                        <span className="font-bold block text-slate-900 dark:text-white">{prod?.nome || 'Produto removido'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Cód: {prod?.codigoInterno || '-'}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-1 ${badge}`}>
                          {icon}
                          {m.tipoMovimentacao}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {m.quantidade.toFixed(1)} {prod?.unidade || 'KG'}
                      </td>
                      <td className="p-4 font-semibold">{m.motivo}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{op}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma movimentação de estoque registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
