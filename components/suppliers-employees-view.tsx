'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Contact, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ShieldCheck, 
  X, 
  UserPlus, 
  DollarSign, 
  BadgeCheck, 
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { db, Supplier, Employee, User as SystemUser } from '@/lib/db';

interface SuppliersEmployeesViewProps {
  dbRefresh: number;
  triggerRefresh: () => void;
  user: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

type TabType = 'FORNECEDORES' | 'FUNCIONARIOS';

export default function SuppliersEmployeesView({ dbRefresh, triggerRefresh, user, showToast }: SuppliersEmployeesViewProps) {
  // --- CONTROLE DE TAB ---
  const [activeTab, setActiveTab] = useState<TabType>('FORNECEDORES');
  const [searchQuery, setSearchQuery] = useState('');

  // --- COLEÇÕES DE DADOS ---
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // --- MODAL DE FORNECEDOR ---
  const [supModalOpen, setSupModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [supRazao, setSupRazao] = useState('');
  const [supFantasia, setSupFantasia] = useState('');
  const [supCnpj, setSupCnpj] = useState('');
  const [supIe, setSupIe] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supCity, setSupCity] = useState('');

  // --- MODAL DE FUNCIONÁRIO ---
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empCpf, setEmpCpf] = useState('');
  const [empCargo, setEmpCargo] = useState('');
  const [empSal, setEmpSal] = useState(1500.00);
  const [empPhone, setEmpPhone] = useState('');
  const [empDate, setEmpDate] = useState('');
  const [empUserLink, setEmpUserLink] = useState<number | undefined>(undefined);

  // Sincroniza dados
  useEffect(() => {
    setSuppliers(db.getSuppliers());
    setEmployees(db.getEmployees());
    setSystemUsers(db.getUsers());
  }, [dbRefresh]);

  // --- FILTROS ---
  const filteredSuppliers = suppliers.filter(s => {
    return s.nomeFantasia.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.razaoSocial.toLowerCase().includes(searchQuery.toLowerCase()) || 
           s.cnpj.includes(searchQuery);
  });

  const filteredEmployees = employees.filter(e => {
    return e.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
           e.cpf.includes(searchQuery) || 
           e.cargo.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // --- CONTROLES MODAL FORNECEDOR ---
  const openCreateSupModal = () => {
    setEditingSup(null);
    setSupRazao('');
    setSupFantasia('');
    setSupCnpj('');
    setSupIe('');
    setSupPhone('');
    setSupEmail('');
    setSupCity('');
    setSupModalOpen(true);
  };

  const openEditSupModal = (s: Supplier) => {
    setEditingSup(s);
    setSupRazao(s.razaoSocial);
    setSupFantasia(s.nomeFantasia);
    setSupCnpj(s.cnpj);
    setSupIe(s.inscricaoEstadual || '');
    setSupPhone(s.telefone || '');
    setSupEmail(s.email || '');
    setSupCity(s.cidade || '');
    setSupModalOpen(true);
  };

  const handleSupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supRazao || !supFantasia || !supCnpj) {
      showToast('Por favor, preencha a razão social, nome fantasia e CNPJ.', 'error');
      return;
    }

    const saved: Supplier = {
      id: editingSup ? editingSup.id : 0,
      razaoSocial: supRazao,
      nomeFantasia: supFantasia,
      cnpj: supCnpj,
      inscricaoEstadual: supIe,
      telefone: supPhone,
      whatsapp: editingSup ? editingSup.whatsapp : '',
      email: supEmail,
      endereco: editingSup ? editingSup.endereco : '',
      cidade: supCity,
      estado: editingSup ? editingSup.estado : 'GO',
      produtosFornecidos: editingSup ? editingSup.produtosFornecidos : '',
      criadoEm: editingSup ? editingSup.criadoEm : new Date().toISOString()
    };

    db.saveSupplier(saved, user.id, user.nome);
    showToast(editingSup ? 'Fornecedor atualizado com sucesso!' : 'Novo fornecedor cadastrado com sucesso!', 'success');
    setSupModalOpen(false);
    triggerRefresh();
  };

  const handleSupDelete = (id: number) => {
    if (confirm('Deseja realmente excluir este fornecedor do açougue?')) {
      db.deleteSupplier(id, user.id, user.nome);
      showToast('Fornecedor removido com sucesso!', 'success');
      triggerRefresh();
    }
  };

  // --- CONTROLES MODAL FUNCIONÁRIO ---
  const openCreateEmpModal = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpCpf('');
    setEmpCargo('Açougueiro / Cortador');
    setEmpSal(2400.00);
    setEmpPhone('');
    setEmpDate(new Date().toISOString().slice(0, 10));
    setEmpUserLink(undefined);
    setEmpModalOpen(true);
  };

  const openEditEmpModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.nome);
    setEmpCpf(emp.cpf);
    setEmpCargo(emp.cargo);
    setEmpSal(emp.salarioBase || 0);
    setEmpPhone(emp.telefone || '');
    setEmpDate(emp.dataAdmissao || '');
    setEmpUserLink(emp.usuarioId);
    setEmpModalOpen(true);
  };

  const handleEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empCpf || !empCargo || empSal <= 0) {
      showToast('Por favor, verifique os campos obrigatórios e salários.', 'error');
      return;
    }

    const saved: Employee = {
      id: editingEmp ? editingEmp.id : 0,
      nome: empName,
      cpf: empCpf,
      cargo: empCargo,
      salarioBase: empSal,
      dataAdmissao: empDate,
      telefone: empPhone,
      endereco: editingEmp ? editingEmp.endereco : '',
      usuarioId: empUserLink,
      criadoEm: editingEmp ? editingEmp.criadoEm : new Date().toISOString()
    };

    db.saveEmployee(saved, user.id, user.nome);
    showToast(editingEmp ? 'Cadastro de funcionário atualizado!' : 'Novo funcionário registrado com sucesso!', 'success');
    setEmpModalOpen(false);
    triggerRefresh();
  };

  const handleEmpDelete = (id: number) => {
    if (confirm('Deseja realmente remover este funcionário dos cadastros ativos?')) {
      db.deleteEmployee(id, user.id, user.nome);
      showToast('Funcionário removido com sucesso!', 'success');
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6 flex-1">
      {/* Header com Tab Switches */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gerenciamento Administrativo</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Controles e dados cadastrais de parceiros comerciais e recursos humanos do açougue</p>
        </div>

        {/* Tab switcher visual */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full sm:w-auto border border-slate-200/50 dark:border-slate-800/40">
          <button 
            onClick={() => { setActiveTab('FORNECEDORES'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'FORNECEDORES' 
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Building2 className="w-4 h-4 text-red-600" />
            <span>Fornecedores ({suppliers.length})</span>
          </button>
          <button 
            onClick={() => { setActiveTab('FUNCIONARIOS'); setSearchQuery(''); }}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'FUNCIONARIOS' 
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Contact className="w-4 h-4 text-red-600" />
            <span>Funcionários ({employees.length})</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa e Botão Novo com base na Tab Ativa */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
          <input 
            type="text"
            placeholder={activeTab === 'FORNECEDORES' ? "Pesquise por nome fantasia, CNPJ ou razão social..." : "Pesquise funcionário por nome, cargo ou CPF..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs sm:text-sm focus:outline-none"
          />
        </div>

        <button 
          onClick={activeTab === 'FORNECEDORES' ? openCreateSupModal : openCreateEmpModal}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-red-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo {activeTab === 'FORNECEDORES' ? 'Fornecedor' : 'Funcionário'}</span>
        </button>
      </div>

      {/* ====================================================================
          TABELA: FORNECEDORES
          ==================================================================== */}
      {activeTab === 'FORNECEDORES' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Nome Fantasia / Razão Social</th>
                  <th className="p-4">CNPJ / IE</th>
                  <th className="p-4">Contatos</th>
                  <th className="p-4">Cidade</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-800 dark:text-slate-200 transition-colors">
                      <td className="p-4">
                        <span className="font-bold block text-slate-950 dark:text-white">{s.nomeFantasia}</span>
                        <span className="text-[10px] text-slate-400">{s.razaoSocial}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-550 dark:text-slate-400">
                        <span className="block font-semibold">CNPJ: {s.cnpj}</span>
                        <span className="text-[10px] text-slate-400">IE: {s.inscricaoEstadual || 'Isento'}</span>
                      </td>
                      <td className="p-4">
                        <span className="block font-semibold text-slate-850 dark:text-slate-300">{s.telefone || '-'}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{s.email || 'Sem e-mail'}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-500">{s.cidade || 'Não informada'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => openEditSupModal(s)}
                            className="p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition-all cursor-pointer"
                            title="Editar Cadastro"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          <button 
                            onClick={() => handleSupDelete(s.id)}
                            className="p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition-all cursor-pointer"
                            title="Remover Cadastro"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhum fornecedor cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          TABELA: FUNCIONÁRIOS
          ==================================================================== */}
      {activeTab === 'FUNCIONARIOS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Colaborador / CPF</th>
                  <th className="p-4">Cargo / Função</th>
                  <th className="p-4">Salário Base</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Usuário ERP</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(e => {
                    const linkedUser = systemUsers.find(u => u.id === e.usuarioId);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 text-slate-850 dark:text-slate-250 transition-colors">
                        <td className="p-4">
                          <span className="font-bold block text-slate-950 dark:text-white">{e.nome}</span>
                          <span className="text-[10px] text-slate-400 font-mono">CPF: {e.cpf}</span>
                        </td>
                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-950/40 inline-block">
                            {e.cargo}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          R$ {(e.salarioBase || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4 font-semibold text-slate-500">{e.telefone || '-'}</td>
                        <td className="p-4">
                          {linkedUser ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center gap-1 w-fit">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              {linkedUser.usuario} ({linkedUser.nivelAcesso})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Sem acesso ao painel</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => openEditEmpModal(e)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition-all cursor-pointer"
                              title="Editar Ficha"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button 
                              onClick={() => handleEmpDelete(e.id)}
                              className="p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-slate-500 transition-all cursor-pointer"
                              title="Demitir / Apagar"
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
                    <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      Nenhum funcionário cadastrado no açougue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CADASTRAR/EDITAR FORNECEDOR
          ==================================================================== */}
      {supModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-1.5 bg-red-600"></div>

            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                {editingSup ? `Editar Fornecedor: ${editingSup.nomeFantasia}` : 'Cadastrar Fornecedor Wholesaler'}
              </h3>
              <button onClick={() => setSupModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSupSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Razão Social *</label>
                  <input 
                    type="text"
                    value={supRazao}
                    onChange={(e) => setSupRazao(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                    placeholder="Ex: JBS Distribuidora S/A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia *</label>
                  <input 
                    type="text"
                    value={supFantasia}
                    onChange={(e) => setSupFantasia(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                    placeholder="Ex: Friboi Carnes"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CNPJ *</label>
                  <input 
                    type="text"
                    value={supCnpj}
                    onChange={(e) => setSupCnpj(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                    placeholder="00.000.000/0001-00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Inscrição Estadual</label>
                  <input 
                    type="text"
                    value={supIe}
                    onChange={(e) => setSupIe(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                    placeholder="Isento ou numérico"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone Comercial</label>
                  <input 
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail Comercial</label>
                  <input 
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                    placeholder="vendas@friboi.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cidade / Estado Origem</label>
                <input 
                  type="text"
                  value={supCity}
                  onChange={(e) => setSupCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  placeholder="Ex: Barretos / SP"
                />
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/20 -mx-5 -mb-5 p-5">
                <button type="button" onClick={() => setSupModalOpen(false)} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow cursor-pointer">Salvar Fornecedor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CADASTRAR/EDITAR FUNCIONÁRIO
          ==================================================================== */}
      {empModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col">
            <div className="h-1.5 bg-red-600"></div>

            <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                {editingEmp ? `Editar Funcionário: ${editingEmp.nome}` : 'Registrar Novo Funcionário'}
              </h3>
              <button onClick={() => setEmpModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleEmpSubmit} className="p-5 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                <input 
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  placeholder="Ex: Francisco Sales Oliveira"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CPF (11 dígitos) *</label>
                  <input 
                    type="text"
                    value={empCpf}
                    onChange={(e) => setEmpCpf(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                    placeholder="111.222.333-44"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone Celular</label>
                  <input 
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                    placeholder="(11) 98888-7777"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo / Função *</label>
                  <input 
                    type="text"
                    value={empCargo}
                    onChange={(e) => setEmpCargo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none font-semibold"
                    placeholder="Ex: Operador de Caixa, Açougueiro"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Salário Base Mensal R$ *</label>
                  <input 
                    type="number"
                    step="50"
                    value={empSal}
                    onChange={(e) => setEmpSal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none text-right font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data de Admissão</label>
                  <input 
                    type="date"
                    value={empDate}
                    onChange={(e) => setEmpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vincular Conta Usuário ERP</label>
                  <select 
                    value={empUserLink || ''}
                    onChange={(e) => setEmpUserLink(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">Nenhuma Conta</option>
                    {systemUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.usuario})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-950/20 -mx-5 -mb-5 p-5">
                <button type="button" onClick={() => setEmpModalOpen(false)} className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow cursor-pointer">Salvar Funcionário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
