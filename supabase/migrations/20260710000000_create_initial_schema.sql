-- Migration: Create Initial Schema for Distribuidora Dona Budega
-- Created At: 2026-07-10

-- -----------------------------------------------------------------------------
-- 1. TABELA: PRODUTOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.produtos (
    id text PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text), 1, 8)),
    nome text NOT NULL,
    preco numeric(10,2) NOT NULL,
    estoque numeric(10,2) NOT NULL,
    codigo_barras text NOT NULL,
    categoria text NOT NULL,
    imagem_url text,
    unidade text NOT NULL DEFAULT 'kg'
);

-- -----------------------------------------------------------------------------
-- 2. TABELA: CLIENTES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
    id text PRIMARY KEY DEFAULT ('cust_' || substr(md5(random()::text), 1, 8)),
    nome text NOT NULL,
    cpf text NOT NULL,
    telefone text NOT NULL,
    email text,
    pontos integer NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 3. TABELA: CONTAS A PAGAR
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contas_pagar (
    id text PRIMARY KEY DEFAULT ('cnt_' || substr(md5(random()::text), 1, 8)),
    descricao text NOT NULL,
    fornecedor_id text,
    fornecedor_nome text,
    valor numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    status text NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago')),
    categoria text NOT NULL,
    observacoes text,
    criado_em timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. TABELA: VENDAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendas (
    id text PRIMARY KEY DEFAULT ('sale_' || substr(md5(random()::text), 1, 8)),
    cliente_id text REFERENCES public.clientes(id) ON DELETE SET NULL,
    total numeric(10,2) NOT NULL,
    forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix')),
    data_venda timestamptz DEFAULT now(),
    desconto numeric(10,2) NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 5. TABELA: ITENS DA VENDA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itens_venda (
    id text PRIMARY KEY DEFAULT ('sitem_' || substr(md5(random()::text), 1, 8)),
    venda_id text REFERENCES public.vendas(id) ON DELETE CASCADE NOT NULL,
    produto_id text REFERENCES public.produtos(id) ON DELETE SET NULL,
    quantidade numeric(10,2) NOT NULL,
    preco_unitario numeric(10,2) NOT NULL
);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
-- Habilitando RLS para todas as tabelas
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;

-- Políticas públicas completas (Permite leitura, inserção, atualização e exclusão anônimas/autenticadas)
CREATE POLICY "Acesso total público para produtos" ON public.produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total público para clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total público para contas_pagar" ON public.contas_pagar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total público para vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total público para itens_venda" ON public.itens_venda FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- SEED DATA (DADOS INICIAIS)
-- -----------------------------------------------------------------------------

-- Produtos
INSERT INTO public.produtos (id, nome, preco, estoque, codigo_barras, categoria, unidade) VALUES
('p1', 'Picanha Angus Premium', 89.90, 25.5, '78910001', 'Carnes Bovinas', 'kg'),
('p2', 'Alcatra Maturada', 54.90, 40.0, '78910002', 'Carnes Bovinas', 'kg'),
('p3', 'Contra Filé Grill', 62.90, 30.0, '78910003', 'Carnes Bovinas', 'kg'),
('p4', 'Maminha Selecionada', 48.90, 18.0, '78910004', 'Carnes Bovinas', 'kg'),
('p5', 'Costela Minga', 29.90, 55.0, '78910005', 'Carnes Bovinas', 'kg'),
('p6', 'Costelinha de Porco', 32.90, 35.0, '78910006', 'Carnes Suínas', 'kg'),
('p7', 'Panceta Temperada', 36.90, 15.0, '78910007', 'Carnes Suínas', 'kg'),
('p8', 'Filé de Peito de Frango', 21.90, 45.0, '78910008', 'Aves', 'kg'),
('p9', 'Coxa e Sobrecoxa Desossada', 18.90, 50.0, '78910009', 'Aves', 'kg'),
('p10', 'Linguiça Toscana Caseira', 24.90, 60.0, '78910010', 'Linguiças & Embutidos', 'kg'),
('p11', 'Carvão Vegetal 5kg', 19.90, 100, '78910011', 'Bebidas & Outros', 'un'),
('p12', 'Cerveja Heineken LN 330ml', 7.50, 240, '78910012', 'Bebidas & Outros', 'un')
ON CONFLICT (id) DO NOTHING;

-- Clientes
INSERT INTO public.clientes (id, nome, cpf, telefone, email, pontos) VALUES
('c1', 'Carlos Henrique Silva', '123.456.789-00', '(11) 98765-4321', 'carlos@email.com', 120),
('c2', 'Ana Paula Medeiros', '987.654.321-11', '(11) 97654-3210', 'ana@email.com', 85),
('c3', 'Roberto de Souza', '456.789.123-22', '(11) 96543-2109', 'roberto@email.com', 230)
ON CONFLICT (id) DO NOTHING;

-- Contas a Pagar
INSERT INTO public.contas_pagar (id, descricao, valor, data_vencimento, status, categoria, observacoes, fornecedor_nome) VALUES
('d1', 'Compra de Gado Angus - Frigorífico Sul', 15000.00, '2026-07-15', 'Pendente', 'Mercadoria', 'Lote de 200kg de Picanha e Alcatra', 'Frigorífico Sul Ltda'),
('d2', 'Aluguel Comercial - Julho', 3500.00, '2026-07-10', 'Pago', 'Infraestrutura', NULL, 'Imobiliária Central'),
('d3', 'Energia Elétrica - Copel', 1250.80, '2026-07-18', 'Pendente', 'Utilidades', NULL, 'Copel Distribuidora'),
('d4', 'Embalagens plásticas e bandejas', 450.00, '2026-07-25', 'Pendente', 'Insumos', NULL, 'Plásticos Embala+')
ON CONFLICT (id) DO NOTHING;

-- Vendas Históricas
INSERT INTO public.vendas (id, cliente_id, total, forma_pagamento, data_venda, desconto) VALUES
('s1', 'c1', 194.75, 'Pix', '2026-07-09 15:30:00+00', 5.00)
ON CONFLICT (id) DO NOTHING;

-- Itens de Vendas Históricas
INSERT INTO public.itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES
('s1', 'p1', 1.5, 89.90),
('s1', 'p10', 2.0, 24.90),
('s1', 'p12', 2, 7.50);
