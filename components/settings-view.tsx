'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Building2, 
  Percent, 
  Database,
  FileJson,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { db, CompanySettings } from '@/lib/db';

interface SettingsViewProps {
  dbRefresh: number;
  triggerRefresh: () => void;
  user: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  theme?: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
}

export default function SettingsView({ dbRefresh, triggerRefresh, user, showToast }: SettingsViewProps) {
  // --- ESTADO ---
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    setSettings(db.getSettings());
  }, [dbRefresh]);

  if (!settings) return null;

  // --- ATUALIZAÇÃO ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.nomeEmpresa || !settings.cnpj) {
      showToast('Nome da empresa e CNPJ são obrigatórios.', 'error');
      return;
    }

    db.saveSettings(settings, user.id, user.nome);
    showToast('Configurações da empresa salvas com sucesso!', 'success');
    triggerRefresh();
  };

  const handleFieldChange = (field: keyof CompanySettings, val: any) => {
    setSettings({
      ...settings,
      [field]: val
    });
  };

  // --- MANUTENÇÃO DE BANCO ---
  const handleResetDb = () => {
    if (confirm('ATENÇÃO: Isso irá redefinir todo o banco de dados do açougue, limpando novas vendas, novos clientes e restaurando as peças de carnes e dados de exemplo originais. Deseja continuar?')) {
      db.resetToSeed();
      showToast('O banco de dados local foi reiniciado com sucesso para os dados padrão!', 'success');
      triggerRefresh();
    }
  };

  const handleExportBackup = () => {
    try {
      const payload = db.exportDatabaseBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(payload);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `Acougue_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      showToast('Backup do ERP em formato JSON baixado com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao exportar backup de dados.', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const success = db.restoreDatabaseBackup(text);
        if (success) {
          showToast('Banco de dados restaurado com sucesso! Recarregando sistema...', 'success');
          setTimeout(() => {
            triggerRefresh();
          }, 800);
        } else {
          showToast('O arquivo de backup é inválido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler ou processar o arquivo JSON de backup.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Configurações do ERP</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Gerencie informações cadastrais, alíquotas fiscais de cupons e realize backups de segurança</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Configurações */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-slate-950 dark:text-white">Dados da Empresa</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia *</label>
                <input 
                  type="text"
                  value={settings.nomeEmpresa}
                  onChange={(e) => handleFieldChange('nomeEmpresa', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">CNPJ *</label>
                <input 
                  type="text"
                  value={settings.cnpj}
                  onChange={(e) => handleFieldChange('cnpj', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Inscrição Estadual (IE)</label>
                <input 
                  type="text"
                  value={settings.inscricaoEstadual}
                  onChange={(e) => handleFieldChange('inscricaoEstadual', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp de Contato</label>
                <input 
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Endereço Comercial</label>
              <input 
                type="text"
                value={settings.endereco}
                onChange={(e) => handleFieldChange('endereco', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chave PIX (Para Cupons)</label>
                <input 
                  type="text"
                  value={settings.chavePix || ''}
                  onChange={(e) => handleFieldChange('chavePix', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-mono focus:outline-none"
                  placeholder="E-mail ou CNPJ"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Alíquota de Tributos (%)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">%</span>
                  <input 
                    type="number"
                    step="0.01"
                    value={settings.aliquotaImposto}
                    onChange={(e) => handleFieldChange('aliquotaImposto', parseFloat(e.target.value) || 0)}
                    className="w-full pl-6 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-mono font-bold focus:outline-none text-right"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rodapé / Mensagem dos Cupons</label>
              <input 
                type="text"
                value={settings.mensagemFinal}
                onChange={(e) => handleFieldChange('mensagemFinal', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados Corporativos</span>
            </button>
          </form>
        </div>

        {/* Manutenção de Banco e Backups */}
        <div className="space-y-6">
          {/* Manutenção de Banco */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Database className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">Banco de Dados & Backups</h3>
            </div>

            <p className="text-xs text-slate-500 leading-tight">
              O Açougue Premium roda em modo de persistência durável no navegador utilizando criptografia e localStorage. Use as ferramentas abaixo para fazer auditoria ou exportação dos seus dados.
            </p>

            <div className="space-y-2.5">
              {/* Baixar Backup JSON */}
              <button 
                onClick={handleExportBackup}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Exporta todas as tabelas (clientes, estoque, vendas, caixas) para um arquivo JSON"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Exportar Backup (JSON)</span>
              </button>

              {/* Importar Backup JSON */}
              <label className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4 text-cyan-600" />
                <span>Restaurar Backup (JSON)</span>
                <input 
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              {/* Limpar e Seedar */}
              <button 
                onClick={handleResetDb}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100/50 text-red-600 border border-red-200 dark:border-red-950/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Restaurar o ERP para a demonstração original"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar com Dados de Exemplo</span>
              </button>
            </div>
          </div>

          {/* Dica de Segurança e Certificados */}
          <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-250 dark:border-amber-900/30 p-4 rounded-2xl space-y-2 text-xs text-amber-800 dark:text-amber-400">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Dica de Segurança Operacional</span>
            </div>
            <p className="leading-tight text-[11px]">
              Sempre realize o fechamento do caixa diário antes de encerrar as atividades de vendas para consolidar relatórios, ajustar quebras físicas de caixa e manter logs de auditoria organizados por turno.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
