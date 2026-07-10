'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Activity, 
  FileCheck2, 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  History,
  TrendingDown,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { db, CashDrawer, AccountMove, AccountPayableReceivable } from '@/lib/db';

interface FinancialViewProps {
  dbRefresh: number;
  triggerRefresh: () => void;
  user: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type SubTabType = 'CAIXA_DIARIO' | 'CONTAS';

export default function FinancialView({ dbRefresh, triggerRefresh, user, showToast }: FinancialViewProps) {
  // --- SUB TABS ---
  const [subTab, setSubTab] = useState<SubTabType>('CAIXA_DIARIO');
  const [searchQuery, setSearchQuery] = useState('');

  // --- COLEÇÕES DE DADOS ---
  const [activeDrawer, setActiveDrawer] = useState<CashDrawer | null>(null);
  const [drawerHistory, setDrawerHistory] = useState<CashDrawer[]>([]);
  const [accounts, setAccounts] = useState<AccountPayableReceivable[]>([]);
  const [drawerTransactions, setDrawerTransactions] = useState<AccountMove[]>([]);

  // --- CONTROLE DE MODAL ---
  const [openDrawerModal, setOpenDrawerModal] = useState(false);
  const [closeDrawerModal, setCloseDrawerModal] = useState(false);
  const [suprimentoModal, setSuprimentoModal] = useState(false);
  const [sangriaModal, setSangriaModal] = useState(false);
  const [accountModal, setAccountModal] = useState(false);

  // --- ESTADOS DE FORMULÁRIO ---
  const [startingCash, setStartingCash] = useState(250.00); // Suprimento inicial sugerido
  const [declaredCash, setDeclaredCash] = useState(0); // Para fechamento
  const [supAmount, setSupAmount] = useState(50.00);
  const [supReason, setSupReason] = useState('');
  const [sangAmount, setSangAmount] = useState(100.00);
  const [sangReason, setSangReason] = useState('');

  // --- FORMULÁRIO DE CONTAS ---
  const [accDesc, setAccDesc] = useState('');
  const [accType, setAccType] = useState<'PAGAR' | 'RECEBER'>('PAGAR');
  const [accCat, setAccCat] = useState('Compra de Carnes');
  const [accVal, setAccVal] = useState(0);
  const [accDue, setAccDue] = useState(new Date().toISOString().slice(0, 10));

  // Sincroniza dados do banco
  useEffect(() => {
    const act = db.getActiveDrawer();
    setActiveDrawer(act || null);
    setDrawerHistory(db.getDrawers().filter(d => !d.ativo)); // apenas fechados
    setAccounts(db.getAccounts());
    if (act) {
      setDrawerTransactions(db.getDrawerTransactions(act.id));
    }
  }, [dbRefresh]);

  // Filtros de contas
  const filteredAccounts = accounts.filter(acc => {
    return acc.descricao.toLowerCase().includes(searchQuery.toLowerCase()) || 
           acc.categoria.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // --- AÇÕES DO CAIXA ---
  const handleOpenDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    const result = db.openCashDrawer(startingCash, user.id, user.nome);
    if (typeof result === 'string') {
      showToast(result, 'error');
    } else {
      showToast(`Caixa aberto com sucesso! Troco inicial: R$ ${startingCash.toFixed(2)}`, 'success');
      setOpenDrawerModal(false);
      triggerRefresh();
    }
  };

  const handleCloseDrawer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawer) return;

    // Calcula balanço físico de fechamento
    const totalSalesAndInputs = activeDrawer.valorAbertura + activeDrawer.entradasDinheiro - activeDrawer.saidasDinheiro;
    const diff = declaredCash - totalSalesAndInputs;

    db.closeCashDrawer(activeDrawer.id, declaredCash, diff, user.nome);
    
    if (diff === 0) {
      showToast('Excelente! Caixa fechado e valores físicos correspondem perfeitamente!', 'success');
    } else if (diff < 0) {
      showToast(`Atenção: Caixa fechado com quebra de R$ ${Math.abs(diff).toFixed(2)} (Faltou dinheiro no físico).`, 'warning');
    } else {
      showToast(`Atenção: Caixa fechado com excesso físico de R$ ${diff.toFixed(2)}.`, 'info');
    }

    setCloseDrawerModal(false);
    triggerRefresh();
  };

  const handleSuprimento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawer || supAmount <= 0 || !supReason) return;

    db.addDrawerTransaction(activeDrawer.id, supAmount, 'SUPRIMENTO', supReason, user.nome);
    showToast(`Reforço de R$ ${supAmount.toFixed(2)} adicionado ao caixa diário.`, 'success');
    setSuprimentoModal(false);
    setSupReason('');
    triggerRefresh();
  };

  const handleSangria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrawer || sangAmount <= 0 || !sangReason) return;

    // Valida se há dinheiro suficiente no caixa para a sangria
    const currentCashInDrawer = activeDrawer.valorAbertura + activeDrawer.entradasDinheiro - activeDrawer.saidasDinheiro;
    if (sangAmount > currentCashInDrawer) {
      showToast(`Atenção: Sangria de R$ ${sangAmount.toFixed(2)} excede o saldo físico de dinheiro atual no caixa (R$ ${currentCashInDrawer.toFixed(2)})!`, 'error');
      return;
    }

    db.addDrawerTransaction(activeDrawer.id, sangAmount, 'SANGRIA', sangReason, user.nome);
    showToast(`Sangria de segurança de R$ ${sangAmount.toFixed(2)} retirada do caixa.`, 'warning');
    setSangriaModal(false);
    setSangReason('');
    triggerRefresh();
  };

  // --- AÇÕES DE CONTAS ---
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accDesc || accVal <= 0 || !accDue) {
      showToast('Preencha os campos obrigatórios.', 'error');
      return;
    }

    const acc: AccountPayableReceivable = {
      id: 0,
      descricao: accDesc,
      tipo: accType,
      categoria: accCat,
      valor: accVal,
      dataVencimento: accDue,
      pago: false,
      criadoEm: new Date().toISOString()
    };

    db.saveAccount(acc, user.id, user.nome);
    showToast('Conta adicionada com sucesso!', 'success');
    setAccountModal(false);
    setAccDesc('');
    setAccVal(0);
    triggerRefresh();
  };

  const handleSettleAccount = (id: number) => {
    if (confirm('Deseja realmente liquidar esta conta e registrar o fluxo financeiro?')) {
      const activeD = db.getActiveDrawer();
      const targetAcc = accounts.find(a => a.id === id);
      
      if (!targetAcc) return;

      // Se for pagar com caixa diário, checa se está aberto e se tem saldo caso seja despesa
      if (activeD) {
        if (targetAcc.tipo === 'PAGAR') {
          const currentCashInDrawer = activeD.valorAbertura + activeD.entradasDinheiro - activeD.saidasDinheiro;
          if (targetAcc.valor > currentCashInDrawer) {
            showToast('O caixa diário não tem saldo em dinheiro suficiente para pagar esta conta hoje! Faça suprimento.', 'error');
            return;
          }
        }
      }

      db.settleAccount(id, activeD?.id, user.id, user.nome);
      showToast('Conta liquidada com sucesso!', 'success');
      triggerRefresh();
    }
  };

  const handleDeleteAccount = (id: number) => {
    if (confirm('Deseja excluir este registro de conta?')) {
      db.deleteAccount(id);
      showToast('Conta removida com sucesso.', 'success');
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6 flex-1">
      {/* Header com Sub Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Movimentação Financeira</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Fluxos de caixa diário (frente de caixa), sangrias, suprimentos de troco e contas</p>
        </div>

        {/* Switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-slate-800/40">
          <button 
            onClick={() => { setSubTab('CAIXA_DIARIO'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'CAIXA_DIARIO' 
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <Unlock className="w-4 h-4 text-red-600" />
            <span>Frente de Caixa (PDV)</span>
          </button>
          <button 
            onClick={() => { setSubTab('CONTAS'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'CONTAS' 
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-850'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            <span>Contas a Pagar/Receber ({accounts.filter(a => !a.pago).length})</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          SUB-TAB 1: CAIXA DIÁRIO (FECHAMENTO / SUPRIMENTO / SANGRIA)
          ==================================================================== */}
      {subTab === 'CAIXA_DIARIO' && (
        <div className="space-y-6">
          {activeDrawer ? (
            /* Layout de Caixa Aberto */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Painel do Saldo do Caixa Ativo */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-extrabold text-xs uppercase tracking-wider">Caixa Diário Aberto</h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-2.5 py-0.5 rounded text-slate-500">
                    Sessão #{activeDrawer.id}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Operador Vinculado:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{activeDrawer.nomeUsuarioAbertura}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Abertura:</span>
                    <span className="font-mono text-slate-500">{new Date(activeDrawer.dataAbertura).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Troco Inicial (Float):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">R$ {activeDrawer.valorAbertura.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Vendas e Reforços (Dinheiro):</span>
                    <span className="font-mono">+ R$ {activeDrawer.entradasDinheiro.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-600 font-bold">
                    <span>Sangrias / Saídas do Caixa:</span>
                    <span className="font-mono">- R$ {activeDrawer.saidasDinheiro.toFixed(2)}</span>
                  </div>
                  
                  {/* Saldo de Outras Formas (Pix, Cartão) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 text-[11px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Vendas PIX:</span>
                      <span className="font-mono font-semibold">R$ {activeDrawer.entradasPix.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendas Cartão:</span>
                      <span className="font-mono font-semibold">R$ {activeDrawer.entradasCartao.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850 flex justify-between items-center pt-2.5 mt-3">
                    <span className="text-xs font-bold text-slate-600 uppercase">Saldo Físico Estimado:</span>
                    <span className="text-lg font-black text-slate-950 dark:text-white font-mono">
                      R$ {(activeDrawer.valorAbertura + activeDrawer.entradasDinheiro - activeDrawer.saidasDinheiro).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button 
                    onClick={() => setSuprimentoModal(true)}
                    className="py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-200/50 hover:bg-emerald-100 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Adicionar Troco
                  </button>
                  <button 
                    onClick={() => setSangriaModal(true)}
                    className="py-2 bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-200/50 hover:bg-red-100 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Sangria Segura
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setDeclaredCash(activeDrawer.valorAbertura + activeDrawer.entradasDinheiro - activeDrawer.saidasDinheiro);
                    setCloseDrawerModal(true);
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>Fechar Caixa de Hoje</span>
                </button>
              </div>

              {/* Histórico de Fluxos da Sessão */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 lg:col-span-2 flex flex-col justify-between h-full min-h-0">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
                  <Activity className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 dark:text-white">Atividades Recentes do Caixa</h3>
                    <p className="text-[10px] text-slate-500">Lista completa de suprimentos, sangrias e conciliação da sessão atual</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
                  {drawerTransactions.length > 0 ? (
                    drawerTransactions.map(t => (
                      <div key={t.id} className="p-3 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl flex justify-between items-center">
                        <div className="space-y-0.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            t.tipoMovimento === 'SUPRIMENTO' 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : t.tipoMovimento === 'SANGRIA' ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {t.tipoMovimento}
                          </span>
                          <h4 className="text-xs font-bold text-slate-950 dark:text-white mt-1.5">{t.descricao}</h4>
                          <p className="text-[10px] text-slate-500">Por {t.operador} • {new Date(t.dataMovimento).toLocaleTimeString('pt-BR')}</p>
                        </div>
                        <span className={`font-mono font-bold text-sm ${t.tipoMovimento === 'SANGRIA' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {t.tipoMovimento === 'SANGRIA' ? '-' : '+'} R$ {t.valor.toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                      Nenhum ajuste manual (sangria/suprimento) lançado nesta sessão.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Layout de Caixa Fechado (Gera Abertura) */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm text-center max-w-lg mx-auto space-y-5">
              <Lock className="w-12 h-12 text-red-600 mx-auto animate-bounce" />
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">O Caixa Está Fechado</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
                  Por favor, declare o troco em dinheiro físico que se encontra na gaveta para iniciar as atividades do dia e habilitar o PDV de vendas.
                </p>
              </div>

              <form onSubmit={handleOpenDrawer} className="space-y-3.5 max-w-xs mx-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-left">Fundo de Troco Inicial R$ *</label>
                  <input 
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-mono font-bold focus:outline-none text-center"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow transition-all cursor-pointer"
                >
                  Abrir Caixa Diário
                </button>
              </form>
            </div>
          )}

          {/* Histórico Antigo de Caixas Fechados */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <History className="w-5 h-5 text-red-600" />
              <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Histórico de Caixas Encerrados</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-2.5">Sessão ID</th>
                    <th className="py-2.5">Abertura</th>
                    <th className="py-2.5">Fechamento</th>
                    <th className="py-2.5 text-right">Troco Inicial</th>
                    <th className="py-2.5 text-right">Valor Final Declarado</th>
                    <th className="py-2.5 text-right text-amber-500">Diferença / Quebra</th>
                    <th className="py-2.5">Fechado Por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {drawerHistory.length > 0 ? (
                    drawerHistory.map(d => (
                      <tr key={d.id} className="text-slate-800 dark:text-slate-200">
                        <td className="py-3 font-mono font-bold text-slate-400">#{d.id}</td>
                        <td className="py-3 text-slate-500">{new Date(d.dataAbertura).toLocaleString('pt-BR')}</td>
                        <td className="py-3 text-slate-500">{d.dataFechamento ? new Date(d.dataFechamento).toLocaleString('pt-BR') : '-'}</td>
                        <td className="py-3 text-right font-mono">R$ {d.valorAbertura.toFixed(2)}</td>
                        <td className="py-3 text-right font-mono font-bold">R$ {d.valorFechamentoFisico?.toFixed(2) || '0.00'}</td>
                        <td className={`py-3 text-right font-mono font-bold ${
                          (d.diferencaFechamento || 0) === 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          R$ {d.diferencaFechamento?.toFixed(2) || '0.00'}
                        </td>
                        <td className="py-3 font-semibold text-slate-600">{d.nomeUsuarioFechamento || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        Nenhum caixa fechado arquivado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: CONTAS A PAGAR / RECEBER
          ==================================================================== */}
      {subTab === 'CONTAS' && (
        <div className="space-y-6">
          {/* Caixa de Pesquisa e Lançamento de Conta */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                placeholder="Pesquise por descrição ou categoria da conta (Ex: Aluguel)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none"
              />
            </div>

            <button 
              onClick={() => setAccountModal(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Nova Conta</span>
            </button>
          </div>

          {/* Tabela de Contas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Descrição da Conta</th>
                    <th className="p-4">Classificação</th>
                    <th className="p-4">Vencimento</th>
                    <th className="p-4 text-center">Tipo</th>
                    <th className="p-4 text-right">Valor R$</th>
                    <th className="p-4">Situação</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map(acc => {
                      const isExpired = new Date(acc.dataVencimento) < new Date() && !acc.pago;

                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200 transition-colors">
                          <td className="p-4 font-bold text-slate-950 dark:text-white">{acc.descricao}</td>
                          <td className="p-4 font-semibold text-slate-500">{acc.categoria}</td>
                          <td className={`p-4 font-mono font-semibold ${isExpired ? 'text-red-600 font-extrabold' : ''}`}>
                            {new Date(acc.dataVencimento).toLocaleDateString('pt-BR')}
                            {isExpired && <span className="text-[8px] font-bold ml-1.5 px-1 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider">Atrasada</span>}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-widest inline-flex items-center gap-1 ${
                              acc.tipo === 'PAGAR' 
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-600' 
                                : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                            }`}>
                              {acc.tipo === 'PAGAR' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                              {acc.tipo}
                            </span>
                          </td>
                          <td className={`p-4 text-right font-mono font-black ${acc.tipo === 'PAGAR' ? 'text-red-600' : 'text-emerald-600'}`}>
                            R$ {acc.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              acc.pago 
                                ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600' 
                                : 'bg-amber-100 dark:bg-amber-950/30 text-amber-500'
                            }`}>
                              {acc.pago ? 'LIQUIDADA' : 'PENDENTE'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              {!acc.pago && (
                                <button 
                                  onClick={() => handleSettleAccount(acc.id)}
                                  className="p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition-all cursor-pointer"
                                  title="Liquidar / Baixar Conta"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                </button>
                              )}
                              <button 
                                onClick={() => handleDeleteAccount(acc.id)}
                                className="p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition-all cursor-pointer"
                                title="Excluir Lançamento"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                        Nenhuma conta registrada ou correspondente à busca.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: REGISTRAR SUPRIMENTO
          ==================================================================== */}
      {suprimentoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-1.5 bg-emerald-500"></div>

            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Lançar Suprimento (Reforço)</h3>
              <button onClick={() => setSuprimentoModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSuprimento} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor do Reforço R$ *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={supAmount}
                  onChange={(e) => setSupAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-mono font-bold focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivação / Justificativa *</label>
                <input 
                  type="text"
                  placeholder="Ex: Troco de notas de 5 reais"
                  value={supReason}
                  onChange={(e) => setSupReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/20 -mx-5 -mb-5 p-5">
                <button type="button" onClick={() => setSuprimentoModal(false)} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow cursor-pointer">Adicionar Saldo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: REGISTRAR SANGRIA
          ==================================================================== */}
      {sangriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-1.5 bg-red-600"></div>

            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Lançar Sangria (Retirada de Sangue/Segurança)</h3>
              <button onClick={() => setSangriaModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSangria} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor de Retirada R$ *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sangAmount}
                  onChange={(e) => setSangAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-mono font-bold focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Motivação / Justificativa *</label>
                <input 
                  type="text"
                  placeholder="Ex: Retirada de notas de 100 para o cofre"
                  value={sangReason}
                  onChange={(e) => setSangReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/20 -mx-5 -mb-5 p-5">
                <button type="button" onClick={() => setSangriaModal(false)} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow cursor-pointer">Retirar Saldo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: LANÇAR NOVA CONTA (PAGAR / RECEBER)
          ==================================================================== */}
      {accountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-1.5 bg-red-600"></div>

            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Lançar Nova Conta Financeira</h3>
              <button onClick={() => setAccountModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição Curta *</label>
                <input 
                  type="text"
                  placeholder="Ex: Pagamento Fornecedor de Bovinos"
                  value={accDesc}
                  onChange={(e) => setAccDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Conta *</label>
                  <select 
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="PAGAR">🔴 Contas a Pagar (Despesa)</option>
                    <option value="RECEBER">🟢 Contas a Receber (Receita)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classificação / Categoria</label>
                  <select 
                    value={accCat}
                    onChange={(e) => setAccCat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none font-bold"
                  >
                    <option value="Compra de Carnes">Compra de Carnes (Estoque)</option>
                    <option value="Aluguel e Condomínio">Aluguel e Condomínio</option>
                    <option value="Água e Energia">Água e Energia</option>
                    <option value="Salários e Encargos">Salários e Encargos</option>
                    <option value="Serviços Contábeis">Serviços Contábeis</option>
                    <option value="Venda Fiado Amortização">Venda Fiado Amortização</option>
                    <option value="Outras Receitas">Outras Receitas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor R$ *</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={accVal || ''}
                    onChange={(e) => setAccVal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono font-bold focus:outline-none"
                    placeholder="R$ 0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data Vencimento *</label>
                  <input 
                    type="date"
                    value={accDue}
                    onChange={(e) => setAccDue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/20 -mx-5 -mb-5 p-5">
                <button type="button" onClick={() => setAccountModal(false)} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow cursor-pointer">Lançar Conta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
