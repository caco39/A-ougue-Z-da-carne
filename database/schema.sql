-- ==============================================================================
-- SISTEMA DE GERENCIAMENTO PARA AÇOUGUE (AÇOUGUE PREMIUM)
-- SCRIPT DE BANCO DE DATAS COMPLETO (COMPATÍVEL COM MYSQL 8.0+)
-- CONTÉM ESTRUTURAS, RELACIONAMENTOS COM CHAVES ESTRANGEIRAS, ÍNDICES E DADOS INICIAIS
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS acougue_premium DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE acougue_premium;

-- Desativar verificação de chaves estrangeiras temporariamente para criação limpa
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. TABELA: configuracoes
-- Armazena os dados da empresa, dados de nota fiscal, logotipo, PIX, etc.
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS configuracoes;
CREATE TABLE configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_empresa VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    inscricao_estadual VARCHAR(25),
    logo VARCHAR(255),
    endereco VARCHAR(255),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    instagram VARCHAR(50),
    qr_code_pix TEXT, -- Conteúdo do código copia e cola do PIX ou link
    mensagem_final VARCHAR(255), -- Mensagem de rodapé do cupom
    aliquota_imposto DECIMAL(5,2) DEFAULT 0.00, -- Percentual de imposto médio do açougue
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 2. TABELA: usuarios
-- Armazena os usuários de acesso ao sistema (Administradores, Gerentes, Operadores)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL, -- Hash bcrypt
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cargo VARCHAR(50),
    nivel_acesso ENUM('Administrador', 'Gerente', 'Operador de Caixa') NOT NULL DEFAULT 'Operador de Caixa',
    foto VARCHAR(255),
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 3. TABELA: clientes
-- Dados cadastrais de clientes com controle de crédito para vendas fiadas ("Pendura")
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS clientes;
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    endereco VARCHAR(255),
    cidade VARCHAR(100) DEFAULT 'São Paulo',
    estado CHAR(2) DEFAULT 'SP',
    cep VARCHAR(10),
    data_nascimento DATE,
    limite_credito DECIMAL(10,2) DEFAULT 0.00,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 4. TABELA: fornecedores
-- Dados dos fornecedores (frigoríficos, distribuidores de bebidas, carvão, etc.)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS fornecedores;
CREATE TABLE fornecedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado CHAR(2),
    produtos_fornecidos TEXT, -- Descrição textual dos produtos fornecidos
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 5. TABELA: funcionarios
-- Armazena os funcionários do estabelecimento (açougueiros, limpadores, caixa, etc.)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS funcionarios;
CREATE TABLE funcionarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    cargo VARCHAR(50) NOT NULL,
    telefone VARCHAR(20),
    endereco VARCHAR(255),
    usuario_id INT, -- Relacionamento opcional caso o funcionário tenha acesso ao sistema
    foto VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 6. TABELA: categorias
-- Categorias de produtos comercializados no açougue
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS categorias;
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao VARCHAR(255)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 7. TABELA: produtos
-- Cadastro de carnes e produtos complementares (peso, custo, venda, estoque)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS produtos;
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_interno VARCHAR(50) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50) UNIQUE,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria_id INT NOT NULL,
    fornecedor_id INT,
    marca VARCHAR(100),
    peso DECIMAL(10,3) DEFAULT 0.000, -- Peso em kg (ex: 1.250 kg)
    unidade ENUM('KG', 'UNID', 'PCT', 'G') NOT NULL DEFAULT 'KG',
    preco_custo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    margem_lucro DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN preco_custo = 0 THEN 100.00
            ELSE ((preco_venda - preco_custo) / preco_custo) * 100.00
        END
    ) STORED,
    estoque DECIMAL(10,3) NOT NULL DEFAULT 0.000, -- Quantidade ou peso atual em estoque
    estoque_minimo DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    data_validade DATE,
    imagem VARCHAR(255),
    ativo TINYINT(1) DEFAULT 1,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 8. TABELA: caixa
-- Controle das sessões de caixa (Abertura, Fechamento, Sangrias, Suprimentos)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS caixa;
CREATE TABLE caixa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_abertura DATETIME NOT NULL,
    data_fechamento DATETIME,
    saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    saldo_final DECIMAL(10,2),
    status ENUM('Aberto', 'Fechado') NOT NULL DEFAULT 'Aberto',
    usuario_id INT NOT NULL,
    observacoes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 9. TABELA: vendas
-- Registro cabeçalho das vendas efetuadas no PDV
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS vendas;
CREATE TABLE vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_venda VARCHAR(50) NOT NULL UNIQUE,
    caixa_id INT NOT NULL,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    desconto_tipo ENUM('NENHUM', 'PORCENTAGEM', 'VALOR') DEFAULT 'NENHUM',
    desconto_valor DECIMAL(10,2) DEFAULT 0.00,
    acrescimo DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('CONCLUIDA', 'CANCELADA', 'PENDENTE') NOT NULL DEFAULT 'CONCLUIDA',
    observacoes TEXT,
    cliente_id INT,
    funcionario_id INT, -- Operador do caixa que realizou a venda
    FOREIGN KEY (caixa_id) REFERENCES caixa(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 10. TABELA: itens_venda
-- Registro dos itens pertencentes a cada venda
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS itens_venda;
CREATE TABLE itens_venda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    produto_id INT,
    nome_produto VARCHAR(150) NOT NULL, -- Mantém histórico se o produto for alterado
    quantidade DECIMAL(10,3) NOT NULL, -- Suporta peso fracionário (ex: 1.345 kg)
    preco_venda DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL, -- quantidade * preco_venda
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 11. TABELA: pagamentos
-- Suporta pagamentos múltiplos em uma mesma venda (ex: R$ 50 em dinheiro + R$ 30 em PIX)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS pagamentos;
CREATE TABLE pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venda_id INT NOT NULL,
    tipo_pagamento ENUM('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'CHEQUE', 'FIADO') NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL,
    valor_recebido DECIMAL(10,2) DEFAULT 0.00, -- Apenas para dinheiro
    troco DECIMAL(10,2) DEFAULT 0.00, -- Apenas para dinheiro
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 12. TABELA: estoque
-- Controle histórico detalhado de movimentações de estoque
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS estoque;
CREATE TABLE estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    quantidade DECIMAL(10,3) NOT NULL,
    tipo_movimentacao ENUM('ENTRADA', 'SAIDA', 'AJUSTE_INVENTARIO', 'PERDA') NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id INT NOT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 13. TABELA: movimentacoes
-- Unificação para fluxo geral de caixa / balanço (Entradas e Saídas financeiras)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS movimentacoes;
CREATE TABLE movimentacoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('RECEITA', 'DESPESA') NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    categoria VARCHAR(100), -- ex: Vendas, Aluguel, Conta de Luz, Compra de Mercadoria
    caixa_id INT, -- Se a movimentação ocorreu dentro do caixa diário
    usuario_id INT NOT NULL,
    FOREIGN KEY (caixa_id) REFERENCES caixa(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 14. TABELA: contas_pagar
-- Contas a pagar administrativas do açougue (Aluguel, fornecedores de gado, energia)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS contas_pagar;
CREATE TABLE contas_pagar (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    fornecedor_id INT,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status ENUM('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    categoria VARCHAR(100) DEFAULT 'Geral',
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 15. TABELA: contas_receber
-- Contas a receber (vendas fiadas, pendências de clientes especiais)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS contas_receber;
CREATE TABLE contas_receber (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL,
    cliente_id INT,
    venda_id INT,
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_recebimento DATE,
    status ENUM('PENDENTE', 'RECEBIDO', 'ATRASADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------------------
-- 16. TABELA: logs
-- Auditoria de ações críticas no sistema por usuário
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    usuario_nome VARCHAR(100), -- Grava o nome caso o usuário seja excluído
    acao VARCHAR(150) NOT NULL, -- ex: EXCLUSAO_PRODUTO, AJUSTE_ESTOQUE, CANCELAMENTO_VENDA
    detalhes TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;


-- ==============================================================================
-- CRIAÇÃO DE ÍNDICES E CHAVES DE OTIMIZAÇÃO (PERFORMANCE EM CONSULTAS NO PDV)
-- ==============================================================================
CREATE INDEX idx_produtos_codigo_interno ON produtos(codigo_interno);
CREATE INDEX idx_produtos_codigo_barras ON produtos(codigo_barras);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_vendas_codigo_venda ON vendas(codigo_venda);
CREATE INDEX idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX idx_clientes_cpf ON clientes(cpf);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);


-- ==============================================================================
-- CARGA DE DADOS DE EXEMPLO (SEED DATA) - PROFISSIONAL E CONTEXTUALIZADO
-- ==============================================================================

-- Categorias de açougue padrão
INSERT INTO categorias (id, nome, descricao) VALUES
(1, 'Carnes Bovinas', 'Cortes de boi de primeira, segunda e especiais'),
(2, 'Carnes Suínas', 'Cortes de porco, costelinha, lombo, pernil'),
(3, 'Frango', 'Cortes de frango, asas, peito, corações'),
(4, 'Peixes', 'Filés e pescados congelados'),
(5, 'Linguiças', 'Linguiça toscana, linguiça de pernil, linguiça cuiabana, artesanais'),
(6, 'Temperos', 'Sal grosso, temperos para churrasco e molhos especiais'),
(7, 'Bebidas', 'Cervejas, refrigerantes, água e carvão'),
(8, 'Carvão', 'Sacos de carvão vegetal para churrasco'),
(9, 'Outros', 'Acompanhamentos, farofa, descartáveis');

-- Configurações padrão
INSERT INTO configuracoes (id, nome_empresa, nome_fantasia, cnpj, endereco, telefone, whatsapp, email, instagram, qr_code_pix, mensagem_final, aliquota_imposto) VALUES
(1, 'AÇOUGUE PREMIUM LTDA', 'AÇOUGUE PREMIUM - BOUTIQUE DE CARNES', '12.345.678/0001-90', 'Rua das Chácaras, 1250 - Centro - São Paulo/SP', '(11) 3254-9080', '(11) 98888-7777', 'contato@acouguepremium.com.br', '@acouguepremium', '00020101021126580014br.gov.bcb.pix0136contato@acouguepremium.com.br520400005303986540510.005802BR5915Acougue Premium6009Sao Paulo62070503PDV', 'Obrigado pela preferência! Volte Sempre!', 4.50);

-- Usuários iniciais com senhas seguras (hashes de exemplo compatíveis com bcrypt)
-- Senhas padrões usadas na demonstração: 'admin123' para admin, 'gerente123' para gerente, 'caixa123' para operador
INSERT INTO usuarios (id, usuario, senha, nome, cpf, cargo, nivel_acesso, ativo) VALUES
(1, 'admin', '$2b$10$fIeM785/M/Xw4z68y/TzLOfXJv/N6Uve966fS3e4C34iE6yT.vPe6', 'Marcos Goiano', '111.222.333-44', 'Diretor Geral', 'Administrador', 1),
(2, 'gerente', '$2b$10$w8T04/b39B7P4Z98v/7RHeXJv/N6Uve966fS3e4C34iE6yT.vPe6', 'Rodrigo Souza', '222.333.444-55', 'Gerente Operacional', 'Gerente', 1),
(3, 'caixa', '$2b$10$y5U96/c40C8Q5A09w/8SIfXJv/N6Uve966fS3e4C34iE6yT.vPe6', 'Ana Paula Lima', '333.444.555-66', 'Operadora de Caixa', 'Operador de Caixa', 1);

-- Fornecedores de carnes e produtos
INSERT INTO fornecedores (id, razao_social, nome_fantasia, cnpj, telefone, whatsapp, email, endereco, cidade, estado, produtos_fornecidos) VALUES
(1, 'JBS S/A - DIVISION CARNES', 'Friboi', '02.916.265/0001-60', '(11) 3144-4000', '(11) 99900-1122', 'vendas@friboi.com.br', 'Av. Marginal Direita do Tietê, 500', 'São Paulo', 'SP', 'Carnes bovinas de primeira e segunda em peças vácuo'),
(2, 'COOPERATIVA CENTRAL AURORA ALIMENTOS', 'Aurora Alimentos', '83.310.435/0001-15', '(49) 3321-3000', '(49) 98811-2233', 'vendas@aurora.coop.br', 'Rua Dilso Cecchin, 100', 'Chapecó', 'SC', 'Carnes suínas, linguiças frescais e cortes congelados de frango'),
(3, 'CARVÃO SÃO JOSÉ INDÚSTRIA LTDA', 'Carvão São José', '45.123.456/0001-77', '(19) 3801-1234', '(19) 99822-3344', 'contato@carvaosaojose.com.br', 'Rodovia SP-340, km 124', 'Mogi Mirim', 'SP', 'Sacos de carvão vegetal de Eucalipto 3kg, 5kg e 8kg'),
(4, 'DISTRIBUIDORA DE BEBIDAS AMBEV S.A.', 'Ambev', '07.526.557/0001-00', '(11) 2122-1200', '(11) 98777-6655', 'suporte@ambev.com.br', 'Av. Renato de Paiva, 100', 'São Paulo', 'SP', 'Bebidas alcoólicas, refrigerantes e águas');

-- Funcionários cadastrados
INSERT INTO funcionarios (id, nome, cpf, cargo, telefone, endereco, usuario_id) VALUES
(1, 'Marcos Goiano', '111.222.333-44', 'Administrador', '(11) 98888-1111', 'Av. Paulista, 1000 - Bela Vista', 1),
(2, 'Rodrigo Souza', '222.333.444-55', 'Gerente', '(11) 97777-2222', 'Rua Augusta, 450 - Consolação', 2),
(3, 'Ana Paula Lima', '333.444.555-66', 'Caixa', '(11) 96666-3333', 'Rua Pamplona, 320 - Jardim Paulista', 3),
(4, 'Sebastião Silva (Tião)', '444.555.666-77', 'Mestre Açougueiro', '(11) 95555-4444', 'Rua Bela Cintra, 890 - Consolação', NULL);

-- Clientes recorrentes com limite de crédito
INSERT INTO clientes (id, nome, cpf, rg, telefone, whatsapp, endereco, cidade, estado, cep, data_nascimento, limite_credito, observacoes) VALUES
(1, 'João da Silva Santos', '455.123.890-50', '23.456.789-1', '(11) 99912-3456', '(11) 99912-3456', 'Rua Bela Vista, 120', 'São Paulo', 'SP', '01311-000', '1980-05-15', 500.00, 'Cliente VIP. Paga sempre em dia. Autorizado a comprar no Fiado.'),
(2, 'Maria Oliveira Souza', '389.456.123-04', '34.567.890-2', '(11) 98812-7890', '(11) 98812-7890', 'Av. Brigadeiro Luis Antônio, 1450', 'São Paulo', 'SP', '01317-001', '1992-11-23', 300.00, 'Cliente residencial.'),
(3, 'Carlos Henrique Ferreira', '213.789.456-11', '12.345.678-X', '(11) 97712-4567', '(11) 97712-4567', 'Rua Conselheiro Ramalho, 200', 'São Paulo', 'SP', '01325-000', '1975-02-08', 1000.00, 'Dono do Restaurante Sabor do Centro. Compra grandes volumes de coxão mole e acém.');

-- Produtos iniciais (Carnes e acompanhamentos do Açougue)
-- Preços condizentes com o mercado (Ex: Picanha R$ 89.90/kg, Alcatra R$ 49.90/kg)
INSERT INTO produtos (id, codigo_interno, codigo_barras, nome, descricao, categoria_id, fornecedor_id, marca, peso, unidade, preco_custo, preco_venda, estoque, estoque_minimo, data_validade, ativo) VALUES
-- Carnes Bovinas (Categoria 1)
(1, 'BOV001', '7891000000018', 'Picanha Premium Friboi', 'Picanha bovina resfriada em peça a vácuo', 1, 1, 'Friboi Maturatta', 1.250, 'KG', 48.50, 89.90, 45.300, 10.000, '2026-08-15', 1),
(2, 'BOV002', '7891000000025', 'Alcatra com Maminha peça', 'Alcatra inteira resfriada de primeira', 1, 1, 'Friboi', 3.500, 'KG', 29.80, 49.90, 80.000, 20.000, '2026-08-10', 1),
(3, 'BOV003', '7891000000032', 'Contra Filé Grill', 'Peça de contra filé fatiada no ponto de grelha', 1, 1, 'Friboi Maturatta', 1.800, 'KG', 32.40, 56.90, 62.150, 15.000, '2026-08-12', 1),
(4, 'BOV004', '7891000000049', 'Acém Moído Especial', 'Acém moído na hora, limpo e sem gordura excessiva', 1, 1, 'Friboi', 1.000, 'KG', 18.20, 29.90, 120.000, 25.000, '2026-07-08', 1),
(5, 'BOV005', '7891000000056', 'Costela Ripa Especial', 'Costela bovina de ripa, ideal para assar e churrasco lento', 1, 1, 'Friboi', 2.500, 'KG', 15.90, 27.90, 150.000, 30.000, '2026-07-09', 1),
-- Carnes Suínas (Categoria 2)
(6, 'SUI001', '7892000000017', 'Costelinha Suína Aurora', 'Costelinha de porco resfriada, excelente para assar', 2, 2, 'Aurora', 1.500, 'KG', 16.50, 29.90, 54.000, 15.000, '2026-08-20', 1),
(7, 'SUI002', '7892000000024', 'Lombo Suína em Peça', 'Lombo de porco limpo resfriado', 2, 2, 'Aurora', 2.000, 'KG', 14.80, 24.90, 35.000, 10.000, '2026-08-25', 1),
-- Frango (Categoria 3)
(8, 'FRA001', '7893000000016', 'Filé de Peito de Frango', 'Filé de peito de frango resfriado em bandeja', 3, 2, 'Aurora', 1.000, 'KG', 11.20, 18.90, 110.000, 20.000, '2026-07-07', 1),
(9, 'FRA002', '7893000000023', 'Coxa e Sobrecoxa de Frango', 'Coxa e sobrecoxa congeladas pacote', 3, 2, 'Aurora', 1.000, 'PCT', 8.50, 14.90, 85.000, 15.000, '2026-10-15', 1),
-- Linguiças (Categoria 5)
(10, 'LIN001', '7895000000014', 'Linguiça Toscana Sadia', 'Linguiça toscana tradicional de pernil para churrasco', 5, 2, 'Sadia', 1.000, 'KG', 12.40, 22.90, 95.000, 20.000, '2026-07-15', 1),
(11, 'LIN002', '7895000000021', 'Linguiça Cuiabana Premium', 'Linguiça bovina artesanal recheada com queijo coalho e temperos', 5, 2, 'Artesanal Premium', 1.000, 'KG', 22.00, 39.90, 22.500, 8.000, '2026-07-08', 1),
-- Bebidas (Categoria 7)
(12, 'BEB001', '7894900010015', 'Cerveja Heineken Lata 350ml', 'Cerveja puro malte Heineken lata', 7, 4, 'Heineken', 0.350, 'UNID', 3.80, 5.90, 240.000, 48.000, '2026-12-30', 1),
(13, 'BEB002', '7894900701104', 'Refrigerante Coca-Cola 2L', 'Refrigerante Coca-Cola garrafa 2 litros', 7, 4, 'Coca-Cola', 2.000, 'UNID', 6.20, 9.90, 120.000, 24.000, '2026-11-20', 1),
-- Carvão (Categoria 8)
(14, 'CAR001', '7898000005011', 'Carvão Vegetal São José 5kg', 'Saco de carvão vegetal de eucalipto premium', 8, 3, 'São José', 5.000, 'UNID', 12.00, 21.90, 68.000, 15.000, NULL, 1),
-- Temperos (Categoria 6)
(15, 'TEM001', '7896000001012', 'Sal Grosso para Churrasco', 'Sal grosso Iodado tradicional para temperar churrasco', 6, NULL, 'Churrasco Bom', 1.000, 'PCT', 2.10, 4.90, 50.000, 10.000, '2027-06-01', 1);

-- Caixa Diário (Sessão inicial para demonstração)
INSERT INTO caixa (id, data_abertura, saldo_inicial, status, usuario_id, observacoes) VALUES
(1, '2026-07-04 07:00:00', 250.00, 'Aberto', 3, 'Caixa aberto no turno da manhã por Ana.');

-- Vendas iniciais de exemplo (para popular os gráficos do dashboard retroativamente)
INSERT INTO vendas (id, codigo_venda, caixa_id, data_venda, subtotal, desconto_tipo, desconto_valor, acrescimo, total, status, cliente_id, funcionario_id) VALUES
(1, 'VND-20260704-001', 1, '2026-07-04 07:45:00', 112.38, 'VALOR', 12.38, 0.00, 100.00, 'CONCLUIDA', 1, 3),
(2, 'VND-20260704-002', 1, '2026-07-04 08:15:00', 44.80, 'NENHUM', 0.00, 0.00, 44.80, 'CONCLUIDA', 2, 3),
(3, 'VND-20260704-003', 1, '2026-07-04 08:30:00', 261.60, 'PORCENTAGEM', 5.00, 0.00, 248.52, 'CONCLUIDA', 3, 3);

-- Itens das vendas iniciais
INSERT INTO itens_venda (id, venda_id, produto_id, nome_produto, quantidade, preco_venda, total) VALUES
-- Venda 1 (João)
(1, 1, 1, 'Picanha Premium Friboi', 1.000, 89.90, 89.90),
(2, 1, 10, 'Linguiça Toscana Sadia', 0.982, 22.90, 22.48),
-- Venda 2 (Maria)
(3, 2, 8, 'Filé de Peito de Frango', 1.500, 18.90, 28.35),
(4, 2, 12, 'Cerveja Heineken Lata 350ml', 4.000, 5.90, 23.60),
-- Venda 3 (Carlos - Restaurante)
(5, 3, 2, 'Alcatra com Maminha peça', 4.500, 49.90, 224.55),
(6, 3, 15, 'Sal Grosso para Churrasco', 2.000, 4.90, 9.80),
(7, 3, 14, 'Carvão Vegetal São José 5kg', 1.000, 21.90, 21.90);

-- Pagamentos efetuados nas vendas iniciais
INSERT INTO pagamentos (venda_id, tipo_pagamento, valor_pago, valor_recebido, troco) VALUES
(1, 'PIX', 100.00, 100.00, 0.00),
(2, 'CARTAO_DEBITO', 44.80, 44.80, 0.00),
(3, 'FIADO', 248.52, 0.00, 0.00); -- Fiado cria uma conta a receber automaticamente

-- Criação correspondente de Conta a Receber devido ao Fiado do Cliente 3 (Carlos)
INSERT INTO contas_receber (id, descricao, cliente_id, venda_id, valor, data_vencimento, status) VALUES
(1, 'Venda Fiada no PDV - Cupom VND-20260704-003', 3, 3, 248.52, '2026-08-04', 'PENDENTE');

-- Histórico de movimentações de estoque inicial
INSERT INTO estoque (produto_id, quantidade, tipo_movimentacao, motivo, usuario_id, data_movimentacao) VALUES
(1, 1.000, 'SAIDA', 'Venda PDV - VND-20260704-001', 3, '2026-07-04 07:45:00'),
(10, 0.982, 'SAIDA', 'Venda PDV - VND-20260704-001', 3, '2026-07-04 07:45:00'),
(8, 1.500, 'SAIDA', 'Venda PDV - VND-20260704-002', 3, '2026-07-04 08:15:00'),
(12, 4.000, 'SAIDA', 'Venda PDV - VND-20260704-002', 3, '2026-07-04 08:15:00'),
(2, 4.500, 'SAIDA', 'Venda PDV - VND-20260704-003', 3, '2026-07-04 08:30:00'),
(15, 2.000, 'SAIDA', 'Venda PDV - VND-20260704-003', 3, '2026-07-04 08:30:00'),
(14, 1.000, 'SAIDA', 'Venda PDV - VND-20260704-003', 3, '2026-07-04 08:30:00');

-- Contas a pagar iniciais para visualização no dashboard
INSERT INTO contas_pagar (id, descricao, fornecedor_id, valor, data_vencimento, status, categoria) VALUES
(1, 'Compra de Carcaças de Gado Inteiras', 1, 4500.00, '2026-07-10', 'PENDENTE', 'Fornecedores'),
(2, 'Conta de Energia Elétrica (Câmaras Frias)', NULL, 850.00, '2026-07-15', 'PENDENTE', 'Utilidades'),
(3, 'Aluguel do Galpão Comercial', NULL, 3000.00, '2026-07-20', 'PENDENTE', 'Infraestrutura'),
(4, 'Compra de Salsicharia e Linguiças', 2, 1500.00, '2026-07-03', 'ATRASADO', 'Fornecedores');

-- Movimentações financeiras gerais
INSERT INTO movimentacoes (tipo, descricao, valor, data_movimentacao, categoria, caixa_id, usuario_id) VALUES
(1, 'Abertura de Caixa Inicial', 250.00, '2026-07-04 07:00:00', 'Fundo de Caixa', 1, 3),
(1, 'Venda à Vista PDV - Cupom VND-20260704-001', 100.00, '2026-07-04 07:45:00', 'Venda Balcão', 1, 3),
(1, 'Venda à Vista PDV - Cupom VND-20260704-002', 44.80, '2026-07-04 08:15:00', 'Venda Balcão', 1, 3);

-- Logs de auditoria inicial
INSERT INTO logs (usuario_id, usuario_nome, acao, detalhes) VALUES
(1, 'Marcos Goiano', 'LOGIN_SISTEMA', 'Administrador Marcos Goiano iniciou sessão no sistema.'),
(3, 'Ana Paula Lima', 'ABERTURA_CAIXA', 'Abertura de caixa com R$ 250,00.'),
(3, 'Ana Paula Lima', 'VENDA_PDV', 'Venda realizada: Código VND-20260704-001. Total: R$ 100,00.');

SET FOREIGN_KEY_CHECKS = 1;
