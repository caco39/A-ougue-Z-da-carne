import { pgTable, serial, text, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. TABELA: configuracoes
export const configuracoes = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  nomeEmpresa: text("nome_empresa").notNull(),
  nomeFantasia: text("nome_fantasia"),
  cnpj: text("cnpj").notNull().unique(),
  inscricaoEstadual: text("inscricao_estadual"),
  logo: text("logo"),
  endereco: text("endereco"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  instagram: text("instagram"),
  qrCodePix: text("qr_code_pix"),
  mensagemFinal: text("mensagem_final"),
  aliquotaImposto: numeric("aliquota_imposto", { precision: 5, scale: 2 }).default("0.00"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

// 2. TABELA: usuarios
export const users = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  usuario: text("usuario").notNull().unique(),
  senha: text("senha").notNull(), // Hash bcrypt
  nome: text("nome").notNull(),
  cpf: text("cpf").unique(),
  cargo: text("cargo"),
  nivelAcesso: text("nivel_acesso").notNull().default("Operador de Caixa"), // 'Administrador' | 'Gerente' | 'Operador de Caixa'
  foto: text("foto"),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

// 3. TABELA: clientes
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf").unique(),
  rg: text("rg"),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  endereco: text("endereco"),
  cidade: text("cidade").default("São Paulo"),
  estado: text("estado").default("SP"),
  cep: text("cep"),
  dataNascimento: text("data_nascimento"),
  limiteCredito: numeric("limite_credito", { precision: 10, scale: 2 }).default("0.00"),
  saldoDevedor: numeric("saldo_devedor", { precision: 10, scale: 2 }).default("0.00"),
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

// 4. TABELA: fornecedores
export const fornecedores = pgTable("fornecedores", {
  id: serial("id").primaryKey(),
  razaoSocial: text("razao_social").notNull(),
  nomeFantasia: text("nome_fantasia"),
  cnpj: text("cnpj").notNull().unique(),
  telefone: text("telefone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  produtosFornecidos: text("produtos_fornecidos"),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

// 5. TABELA: funcionarios
export const funcionarios = pgTable("funcionarios", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull().unique(),
  cargo: text("cargo").notNull(),
  telefone: text("telefone"),
  endereco: text("endereco"),
  usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
  foto: text("foto"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

// 6. TABELA: categorias
export const categorias = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  descricao: text("descricao"),
});

// 7. TABELA: produtos
export const produtos = pgTable("produtos", {
  id: serial("id").primaryKey(),
  codigoInterno: text("codigo_interno").notNull().unique(),
  codigoBarras: text("codigo_barras").unique(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  categoriaId: integer("categoria_id").references(() => categorias.id).notNull(),
  fornecedorId: integer("fornecedor_id").references(() => fornecedores.id, { onDelete: "set null" }),
  marca: text("marca"),
  peso: numeric("peso", { precision: 10, scale: 3 }).default("0.000"),
  unidade: text("unidade").notNull().default("KG"), // 'KG' | 'UNID' | 'PCT' | 'G'
  precoCusto: numeric("preco_custo", { precision: 10, scale: 2 }).notNull().default("0.00"),
  precoVenda: numeric("preco_venda", { precision: 10, scale: 2 }).notNull().default("0.00"),
  estoque: numeric("estoque", { precision: 10, scale: 3 }).notNull().default("0.000"),
  estoqueMinimo: numeric("estoque_minimo", { precision: 10, scale: 3 }).notNull().default("0.000"),
  dataValidade: text("data_validade"),
  imagem: text("imagem"),
  ativo: boolean("ativo").default(true),
  criadoEm: timestamp("criado_em").defaultNow(),
  atualizadoEm: timestamp("atualizado_em").defaultNow(),
});

// 8. TABELA: caixa
export const caixa = pgTable("caixa", {
  id: serial("id").primaryKey(),
  dataAbertura: timestamp("data_abertura").notNull(),
  dataFechamento: timestamp("data_fechamento"),
  saldoInicial: numeric("saldo_inicial", { precision: 10, scale: 2 }).notNull().default("0.00"),
  saldoFinal: numeric("saldo_final", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("Aberto"), // 'Aberto' | 'Fechado'
  usuarioId: integer("usuario_id").references(() => users.id).notNull(),
  observacoes: text("observacoes"),
});

// 9. TABELA: vendas
export const vendas = pgTable("vendas", {
  id: serial("id").primaryKey(),
  codigoVenda: text("codigo_venda").notNull().unique(),
  caixaId: integer("caixa_id").references(() => caixa.id).notNull(),
  dataVenda: timestamp("data_venda").defaultNow(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull().default("0.00"),
  descontoTipo: text("desconto_tipo").default("NENHUM"), // 'NENHUM' | 'PORCENTAGEM' | 'VALOR'
  descontoValor: numeric("desconto_valor", { precision: 10, scale: 2 }).default("0.00"),
  acrescimo: numeric("acrescimo", { precision: 10, scale: 2 }).default("0.00"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("CONCLUIDA"), // 'CONCLUIDA' | 'CANCELADA' | 'PENDENTE'
  observacoes: text("observacoes"),
  clienteId: integer("cliente_id").references(() => clientes.id, { onDelete: "set null" }),
  funcionarioId: integer("funcionario_id").references(() => funcionarios.id, { onDelete: "set null" }),
});

// 10. TABELA: itens_venda
export const itensVenda = pgTable("itens_venda", {
  id: serial("id").primaryKey(),
  vendaId: integer("venda_id").references(() => vendas.id, { onDelete: "cascade" }).notNull(),
  produtoId: integer("produto_id").references(() => produtos.id, { onDelete: "set null" }),
  nomeProduto: text("nome_produto").notNull(),
  quantidade: numeric("quantidade", { precision: 10, scale: 3 }).notNull(),
  precoVenda: numeric("preco_venda", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
});

// 11. TABELA: pagamentos
export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  vendaId: integer("venda_id").references(() => vendas.id, { onDelete: "cascade" }).notNull(),
  tipoPagamento: text("tipo_pagamento").notNull(), // 'DINHEIRO' | 'PIX' | 'CARTAO_DEBITO' | 'CARTAO_CREDITO' | 'CHEQUE' | 'FIADO'
  valorPago: numeric("valor_pago", { precision: 10, scale: 2 }).notNull(),
  valorRecebido: numeric("valor_recebido", { precision: 10, scale: 2 }).default("0.00"),
  troco: numeric("troco", { precision: 10, scale: 2 }).default("0.00"),
});

// 12. TABELA: estoque (movimentacao)
export const estoque = pgTable("estoque", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id").references(() => produtos.id, { onDelete: "cascade" }).notNull(),
  quantidade: numeric("quantidade", { precision: 10, scale: 3 }).notNull(),
  tipoMovimentacao: text("tipo_movimentacao").notNull(), // 'ENTRADA' | 'SAIDA' | 'AJUSTE_INVENTARIO' | 'PERDA'
  motivo: text("motivo").notNull(),
  usuarioId: integer("usuario_id").references(() => users.id).notNull(),
  dataMovimentacao: timestamp("data_movimentacao").defaultNow(),
});

// 13. TABELA: movimentacoes (financeiras gerais)
export const movimentacoes = pgTable("movimentacoes", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // 'RECEITA' | 'DESPESA'
  descricao: text("descricao").notNull(),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  dataMovimentacao: timestamp("data_movimentacao").defaultNow(),
  categoria: text("categoria"),
  caixaId: integer("caixa_id").references(() => caixa.id, { onDelete: "set null" }),
  usuarioId: integer("usuario_id").references(() => users.id).notNull(),
});

// 14. TABELA: contas_pagar
export const contasPagar = pgTable("contas_pagar", {
  id: serial("id").primaryKey(),
  descricao: text("descricao").notNull(),
  fornecedorId: integer("fornecedor_id").references(() => fornecedores.id, { onDelete: "set null" }),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: text("data_vencimento").notNull(),
  dataPagamento: text("data_pagamento"),
  status: text("status").notNull().default("PENDENTE"), // 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO'
  categoria: text("categoria").default("Geral"),
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

// 15. TABELA: contas_receber
export const contasReceber = pgTable("contas_receber", {
  id: serial("id").primaryKey(),
  descricao: text("descricao").notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id, { onDelete: "set null" }),
  vendaId: integer("venda_id").references(() => vendas.id, { onDelete: "set null" }),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: text("data_vencimento").notNull(),
  dataRecebimento: text("data_recebimento"),
  status: text("status").notNull().default("PENDENTE"), // 'PENDENTE' | 'RECEBIDO' | 'ATRASADO' | 'CANCELADO'
  observacoes: text("observacoes"),
  criadoEm: timestamp("criado_em").defaultNow(),
});

// 16. TABELA: logs
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  data: timestamp("data").defaultNow(),
  usuarioId: integer("usuario_id").references(() => users.id, { onDelete: "set null" }),
  usuarioNome: text("usuario_nome"),
  acao: text("acao").notNull(), // 'LOGIN_SISTEMA' | 'ABERTURA_CAIXA' | 'VENDA_PDV' etc.
  detalhes: text("detalhes"),
  ipAddress: text("ip_address"),
});

// Relacionamentos para Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  funcionarios: many(funcionarios),
  caixas: many(caixa),
  estoques: many(estoque),
  movimentacoes: many(movimentacoes),
  logs: many(logs),
}));

export const clientesRelations = relations(clientes, ({ many }) => ({
  vendas: many(vendas),
  contasReceber: many(contasReceber),
}));

export const fornecedoresRelations = relations(fornecedores, ({ many }) => ({
  produtos: many(produtos),
  contasPagar: many(contasPagar),
}));

export const funcionariosRelations = relations(funcionarios, ({ one, many }) => ({
  usuario: one(users, {
    fields: [funcionarios.usuarioId],
    references: [users.id],
  }),
  vendas: many(vendas),
}));

export const categoriasRelations = relations(categorias, ({ many }) => ({
  produtos: many(produtos),
}));

export const produtosRelations = relations(produtos, ({ one, many }) => ({
  categoria: one(categorias, {
    fields: [produtos.categoriaId],
    references: [categorias.id],
  }),
  fornecedor: one(fornecedores, {
    fields: [produtos.fornecedorId],
    references: [fornecedores.id],
  }),
  itensVenda: many(itensVenda),
  estoques: many(estoque),
}));

export const caixaRelations = relations(caixa, ({ one, many }) => ({
  usuario: one(users, {
    fields: [caixa.usuarioId],
    references: [users.id],
  }),
  vendas: many(vendas),
  movimentacoes: many(movimentacoes),
}));

export const vendasRelations = relations(vendas, ({ one, many }) => ({
  caixa: one(caixa, {
    fields: [vendas.caixaId],
    references: [caixa.id],
  }),
  cliente: one(clientes, {
    fields: [vendas.clienteId],
    references: [clientes.id],
  }),
  funcionario: one(funcionarios, {
    fields: [vendas.funcionarioId],
    references: [funcionarios.id],
  }),
  itensVenda: many(itensVenda),
  pagamentos: many(pagamentos),
  contasReceber: many(contasReceber),
}));

export const itensVendaRelations = relations(itensVenda, ({ one }) => ({
  venda: one(vendas, {
    fields: [itensVenda.vendaId],
    references: [vendas.id],
  }),
  produto: one(produtos, {
    fields: [itensVenda.produtoId],
    references: [produtos.id],
  }),
}));

export const pagamentosRelations = relations(pagamentos, ({ one }) => ({
  venda: one(vendas, {
    fields: [pagamentos.vendaId],
    references: [vendas.id],
  }),
}));

export const estoqueRelations = relations(estoque, ({ one }) => ({
  produto: one(produtos, {
    fields: [estoque.produtoId],
    references: [produtos.id],
  }),
  usuario: one(users, {
    fields: [estoque.usuarioId],
    references: [users.id],
  }),
}));

export const movimentacoesRelations = relations(movimentacoes, ({ one }) => ({
  caixa: one(caixa, {
    fields: [movimentacoes.caixaId],
    references: [caixa.id],
  }),
  usuario: one(users, {
    fields: [movimentacoes.usuarioId],
    references: [users.id],
  }),
}));

export const contasPagarRelations = relations(contasPagar, ({ one }) => ({
  fornecedor: one(fornecedores, {
    fields: [contasPagar.fornecedorId],
    references: [fornecedores.id],
  }),
}));

export const contasReceberRelations = relations(contasReceber, ({ one }) => ({
  cliente: one(clientes, {
    fields: [contasReceber.clienteId],
    references: [clientes.id],
  }),
  venda: one(vendas, {
    fields: [contasReceber.vendaId],
    references: [vendas.id],
  }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  usuario: one(users, {
    fields: [logs.usuarioId],
    references: [users.id],
  }),
}));
