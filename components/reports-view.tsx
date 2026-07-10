'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  Beef, 
  Users, 
  Download, 
  Printer, 
  Activity,
  FileCheck2,
  Percent
} from 'lucide-react';
import { db, Sale, Product, Category, Employee } from '@/lib/db';

interface ReportsViewProps {
  dbRefresh: number;
  triggerRefresh: () => void;
  user: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function ReportsView({ dbRefresh, triggerRefresh, user, showToast }: ReportsViewProps) {
  // --- COLEÇÕES ---
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // --- FILTROS ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('');
  const [filterEmployee, setFilterEmployee] = useState<string>('');

  // Sincroniza dados
  useEffect(() => {
    setSales(db.getSales());
    setProducts(db.getProducts());
    setCategories(db.getCategories());
    setEmployees(db.getEmployees());
  }, [dbRefresh]);

  // Aplica filtros na lista de vendas
  const filteredSales = sales.filter(s => {
    const operator = employees.find(e => e.id === s.funcionarioId);
    const operatorName = operator ? operator.nome : '';
    const matchesQuery = s.codigoVenda.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         operatorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Checa se o método de pagamento bate
    const matchesPayment = !filterPayment || s.pagamentos.some(p => p.tipoPagamento === filterPayment);
    
    // Checa se operador bate
    const matchesEmployee = !filterEmployee || s.funcionarioId === parseInt(filterEmployee);

    return matchesQuery && matchesPayment && matchesEmployee;
  });

  // --- CÁLCULO DE MÉTRICAS ANALÍTICAS ---
  const totalSalesCount = filteredSales.length;
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const averageTicket = totalSalesCount > 0 ? parseFloat((totalRevenue / totalSalesCount).toFixed(2)) : 0;
  
  // Estima lucro bruto com base no custo real dos itens vendidos
  let totalCostOfSoldItems = 0;
  filteredSales.forEach(s => {
    s.itens.forEach(it => {
      const originalProd = products.find(p => p.id === it.produtoId);
      const itemCost = originalProd ? originalProd.precoCusto : (it.precoVenda * 0.5); // Fallback de 50% de custo
      totalCostOfSoldItems += (itemCost * it.quantidade);
    });
  });
  const estimatedProfit = Math.max(0, totalRevenue - totalCostOfSoldItems);
  const grossMargin = totalRevenue > 0 ? parseFloat(((estimatedProfit / totalRevenue) * 100).toFixed(1)) : 0;

  // --- CÁLCULOS PARA GRÁFICOS SVG ---
  // 1. Vendas por Categoria de Carne
  const categoryChartData = categories.map(cat => {
    let salesCount = 0;
    sales.forEach(s => {
      s.itens.forEach(it => {
        const prod = products.find(p => p.id === it.produtoId);
        if (prod && prod.categoriaId === cat.id) {
          salesCount += it.total;
        }
      });
    });
    return { name: cat.nome, value: salesCount };
  });

  const maxCategorySales = Math.max(...categoryChartData.map(c => c.value), 1);

  // 2. Vendas por Método de Pagamento
  const paymentModes = ['DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'FIADO'];
  const paymentChartData = paymentModes.map(mode => {
    let amount = 0;
    sales.forEach(s => {
      s.pagamentos.forEach(p => {
        if (p.tipoPagamento === mode) {
          amount += p.valorPago;
        }
      });
    });
    return { name: mode.replace('_', ' '), value: amount };
  });

  const maxPaymentSales = Math.max(...paymentChartData.map(p => p.value), 1);

  // --- AÇÃO EXPORTAR PLANILHA CSV ---
  const handleExportSalesCSV = () => {
    if (sales.length === 0) {
      showToast('Não há histórico de vendas para exportar.', 'error');
      return;
    }

    const headers = ['CodigoVenda', 'Data', 'Subtotal', 'Desconto', 'Acrescimo', 'Total', 'ClienteId', 'Operador'];
    const rows = sales.map(s => {
      const operator = employees.find(e => e.id === s.funcionarioId);
      const operatorName = operator ? operator.nome : `Funcionário #${s.funcionarioId}`;
      return [
        s.codigoVenda,
        new Date(s.dataVenda).toLocaleDateString('pt-BR'),
        s.subtotal,
        s.descontoValor,
        s.acrescimo,
        s.total,
        s.clienteId || 'Consumidor Final',
        operatorName
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Acougue_Faturamento_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha de vendas exportada em formato Excel/CSV com sucesso!', 'success');
  };

  return (
    <div className="space-y-6 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Relatórios & Auditoria</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Analise faturamentos, margens de lucro estimadas, ranking de vendas e exporte relatórios em planilhas</p>
        </div>

        <button 
          onClick={handleExportSalesCSV}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-red-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Planilha Completa (CSV)</span>
        </button>
      </div>

      {/* Grid de Métricas Gerais de Fechamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Ticket Médio */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Ticket Médio</p>
          <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight mt-2.5 leading-none">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">média por nota fiscal</p>
        </div>

        {/* Total Notas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Vendas Realizadas</p>
          <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight mt-2.5 leading-none">
            {totalSalesCount} cupons
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">registradas em banco</p>
        </div>

        {/* Faturamento Acumulado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Faturamento Líquido</p>
          <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tight mt-2.5 leading-none">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">valores após descontos</p>
        </div>

        {/* Lucro Bruto Estimado */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Lucro Bruto Estimado</p>
          <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight mt-2.5 leading-none">
            R$ {estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">faturamento (-) custo médio</p>
        </div>

        {/* Margem Bruta Média */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Margem Média Geral</p>
          <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight mt-2.5 leading-none">
            {grossMargin}%
          </h3>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">retorno sobre capital</p>
        </div>
      </div>

      {/* Grid de Gráficos SVG para Análise de Carne */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Vendas por Categoria de Carne */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Faturamento por Categoria</h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-none">Divisão proporcional de saídas financeiras de carnes</p>
          </div>

          <div className="space-y-3 pt-2">
            {categoryChartData.map((cat, idx) => {
              const percentage = (cat.value / maxCategorySales) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                      {cat.name}
                    </span>
                    <span className="font-mono font-bold text-slate-500">
                      R$ {cat.value.toFixed(2)}
                    </span>
                  </div>
                  {/* Proportional Bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gráfico 2: Divisão por Meios de Pagamento */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Métodos de Pagamento Utilizados</h3>
            <p className="text-[10px] text-slate-500 mt-1 leading-none">Soma total transacionada por tipo de pagamento</p>
          </div>

          <div className="space-y-3 pt-2">
            {paymentChartData.map((pay, idx) => {
              const percentage = (pay.value / maxPaymentSales) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                      {pay.name}
                    </span>
                    <span className="font-mono font-bold text-slate-500">
                      R$ {pay.value.toFixed(2)}
                    </span>
                  </div>
                  {/* Proportional Bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabela Detalhada de Vendas Realizadas (Auditoria de Cupons) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filtros da tabela */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Auditoria de Cupons / Vendas</h3>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5" />
              <input 
                type="text"
                placeholder="Buscar por cupom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <select 
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
            >
              <option value="">Todos os Pagos</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="PIX">Pix</option>
              <option value="CARTAO_DEBITO">Débito</option>
              <option value="CARTAO_CREDITO">Crédito</option>
              <option value="FIADO">Fiado</option>
            </select>

            <select 
              value={filterEmployee}
              onChange={(e) => setFilterEmployee(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold"
            >
              <option value="">Todos os Caixas</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabela de Vendas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                <th className="p-4">Cupom ID / Hora</th>
                <th className="p-4">Operador de Caixa</th>
                <th className="p-4 text-right">Subtotal</th>
                <th className="p-4 text-right text-amber-500">Descontos</th>
                <th className="p-4 text-right">Acréscimo</th>
                <th className="p-4 text-right text-red-600">Total Pago</th>
                <th className="p-4">Meios Utilizados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {filteredSales.length > 0 ? (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-850 dark:text-slate-250 transition-colors">
                    <td className="p-4 font-mono">
                      <span className="font-bold block text-slate-900 dark:text-white">{sale.codigoVenda}</span>
                      <span className="text-[10px] text-slate-400">{new Date(sale.dataVenda).toLocaleString('pt-BR')}</span>
                    </td>
                    <td className="p-4 font-semibold">
                      {employees.find(e => e.id === sale.funcionarioId)?.nome || `Funcionário #${sale.funcionarioId}`}
                    </td>
                    <td className="p-4 text-right font-mono">R$ {sale.subtotal.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono font-semibold text-amber-500">- R$ {sale.descontoValor.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-slate-500">+ R$ {sale.acrescimo.toFixed(2)}</td>
                    <td className="p-4 text-right font-mono font-black text-red-600">R$ {sale.total.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {sale.pagamentos.map((p, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[8px] font-black bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-855 text-slate-600 dark:text-slate-350">
                            {p.tipoPagamento}: R${p.valorPago.toFixed(0)}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhuma venda arquivada correspondente aos filtros.
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
