import { supabase } from "./supabase";

export interface Product {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  codigo_barras: string;
  categoria: string;
  imagem_url?: string;
  unidade: string; // 'kg' or 'un'
}

export interface Customer {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email?: string;
  pontos: number;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: "Pendente" | "Pago";
  categoria: string;
  observacoes?: string;
  criado_em?: string;
}

export interface SaleItem {
  id?: string;
  venda_id?: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  cliente_id?: string | null;
  cliente_nome?: string;
  total: number;
  forma_pagamento: "Dinheiro" | "Cartão de Crédito" | "Cartão de Débito" | "Pix";
  data_venda: string;
  desconto: number;
  itens: SaleItem[];
}

// Initial mockup data to populate local storage if not present
const INITIAL_PRODUCTS: Product[] = [
  { id: "p1", nome: "Picanha Angus Premium", preco: 89.90, estoque: 25.5, codigo_barras: "78910001", categoria: "Carnes Bovinas", unidade: "kg" },
  { id: "p2", nome: "Alcatra Maturada", preco: 54.90, estoque: 40.0, codigo_barras: "78910002", categoria: "Carnes Bovinas", unidade: "kg" },
  { id: "p3", nome: "Contra Filé Grill", preco: 62.90, estoque: 30.0, codigo_barras: "78910003", categoria: "Carnes Bovinas", unidade: "kg" },
  { id: "p4", nome: "Maminha Selecionada", preco: 48.90, estoque: 18.0, codigo_barras: "78910004", categoria: "Carnes Bovinas", unidade: "kg" },
  { id: "p5", nome: "Costela Minga", preco: 29.90, estoque: 55.0, codigo_barras: "78910005", categoria: "Carnes Bovinas", unidade: "kg" },
  { id: "p6", nome: "Costelinha de Porco", preco: 32.90, estoque: 35.0, codigo_barras: "78910006", categoria: "Carnes Suínas", unidade: "kg" },
  { id: "p7", nome: "Panceta Temperada", preco: 36.90, estoque: 15.0, codigo_barras: "78910007", categoria: "Carnes Suínas", unidade: "kg" },
  { id: "p8", nome: "Filé de Peito de Frango", preco: 21.90, estoque: 45.0, codigo_barras: "78910008", categoria: "Aves", unidade: "kg" },
  { id: "p9", nome: "Coxa e Sobrecoxa Desossada", preco: 18.90, estoque: 50.0, codigo_barras: "78910009", categoria: "Aves", unidade: "kg" },
  { id: "p10", nome: "Linguiça Toscana Caseira", preco: 24.90, estoque: 60.0, codigo_barras: "78910010", categoria: "Linguiças & Embutidos", unidade: "kg" },
  { id: "p11", nome: "Carvão Vegetal 5kg", preco: 19.90, estoque: 100, codigo_barras: "78910011", categoria: "Bebidas & Outros", unidade: "un" },
  { id: "p12", nome: "Cerveja Heineken LN 330ml", preco: 7.50, estoque: 240, codigo_barras: "78910012", categoria: "Bebidas & Outros", unidade: "un" }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: "c1", nome: "Carlos Henrique Silva", cpf: "123.456.789-00", telefone: "(11) 98765-4321", email: "carlos@email.com", pontos: 120 },
  { id: "c2", nome: "Ana Paula Medeiros", cpf: "987.654.321-11", telefone: "(11) 97654-3210", email: "ana@email.com", pontos: 85 },
  { id: "c3", nome: "Roberto de Souza", cpf: "456.789.123-22", telefone: "(11) 96543-2109", email: "roberto@email.com", pontos: 230 }
];

const INITIAL_CONTAS: ContaPagar[] = [
  { id: "d1", descricao: "Compra de Gado Angus - Frigorífico Sul", valor: 15000.00, data_vencimento: "2026-07-15", status: "Pendente", categoria: "Mercadoria", observacoes: "Lote de 200kg de Picanha e Alcatra", fornecedor_nome: "Frigorífico Sul Ltda" },
  { id: "d2", descricao: "Aluguel Comercial - Julho", valor: 3500.00, data_vencimento: "2026-07-10", status: "Pago", data_pagamento: "2026-07-09", categoria: "Infraestrutura", fornecedor_nome: "Imobiliária Central" },
  { id: "d3", descricao: "Energia Elétrica - Copel", valor: 1250.80, data_vencimento: "2026-07-18", status: "Pendente", categoria: "Utilidades", fornecedor_nome: "Copel Distribuidora" },
  { id: "d4", descricao: "Embalagens plásticas e bandejas", valor: 450.00, data_vencimento: "2026-07-25", status: "Pendente", categoria: "Insumos", fornecedor_nome: "Plásticos Embala+" }
];

const INITIAL_SALES: Sale[] = [
  {
    id: "s1",
    cliente_id: "c1",
    cliente_nome: "Carlos Henrique Silva",
    total: 194.75,
    forma_pagamento: "Pix",
    data_venda: "2026-07-09T15:30:00.000Z",
    desconto: 5.00,
    itens: [
      { produto_id: "p1", produto_nome: "Picanha Angus Premium", quantidade: 1.5, preco_unitario: 89.90, subtotal: 134.85 },
      { produto_id: "p10", produto_nome: "Linguiça Toscana Caseira", quantidade: 2.0, preco_unitario: 24.90, subtotal: 49.80 },
      { produto_id: "p12", produto_nome: "Cerveja Heineken LN 330ml", quantidade: 2, preco_unitario: 7.50, subtotal: 15.00 }
    ]
  }
];

export class DB {
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== "undefined";
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (!this.isBrowser) return;

    if (!localStorage.getItem("acougue_products")) {
      localStorage.setItem("acougue_products", JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem("acougue_customers")) {
      localStorage.setItem("acougue_customers", JSON.stringify(INITIAL_CUSTOMERS));
    }
    if (!localStorage.getItem("acougue_contas")) {
      localStorage.setItem("acougue_contas", JSON.stringify(INITIAL_CONTAS));
    }
    if (!localStorage.getItem("acougue_sales")) {
      localStorage.setItem("acougue_sales", JSON.stringify(INITIAL_SALES));
    }
  }

  // Fallback local operations
  private getLocal<T>(key: string): T[] {
    if (!this.isBrowser) return [];
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  }

  private saveLocal<T>(key: string, data: T[]) {
    if (!this.isBrowser) return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // AUTHENTICATION
  login(usernameInput: string, passwordInput: string): boolean {
    // Simple authenticaton used by page.tsx
    if ((usernameInput === "admin" && passwordInput === "admin") || 
        (usernameInput === "acougue" && passwordInput === "acougue123")) {
      if (this.isBrowser) {
        localStorage.setItem("acougue_session", "true");
        localStorage.setItem("acougue_user", usernameInput);
      }
      return true;
    }
    return false;
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem("acougue_session");
      localStorage.removeItem("acougue_user");
    }
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem("acougue_session") === "true";
  }

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase.from("produtos").select("*").order("nome");
      if (error) throw error;
      if (data && data.length > 0) {
        // Map fields if necessary
        return data as Product[];
      }
    } catch (err) {
      console.warn("Supabase products fetch failed, using localStorage fallback:", err);
    }
    return this.getLocal<Product>("acougue_products");
  }

  async addProduct(product: Omit<Product, "id">): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: "prod_" + Math.random().toString(36).substring(2, 9)
    };

    try {
      const { data, error } = await supabase.from("produtos").insert([product]).select();
      if (error) throw error;
      if (data && data[0]) {
        return data[0] as Product;
      }
    } catch (err) {
      console.warn("Supabase product add failed, saving to localStorage:", err);
    }

    const products = this.getLocal<Product>("acougue_products");
    products.push(newProduct);
    this.saveLocal("acougue_products", products);
    return newProduct;
  }

  async updateProduct(id: string, productUpdate: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase.from("produtos").update(productUpdate).eq("id", id).select();
      if (error) throw error;
      if (data && data[0]) {
        return data[0] as Product;
      }
    } catch (err) {
      console.warn("Supabase product update failed, saving to localStorage:", err);
    }

    const products = this.getLocal<Product>("acougue_products");
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...productUpdate };
      this.saveLocal("acougue_products", products);
      return products[index];
    }
    return null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase product delete failed, using localStorage fallback:", err);
    }

    const products = this.getLocal<Product>("acougue_products");
    const filtered = products.filter(p => p.id !== id);
    this.saveLocal("acougue_products", filtered);
    return true;
  }

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      if (data && data.length > 0) {
        return data as Customer[];
      }
    } catch (err) {
      console.warn("Supabase customers fetch failed, using localStorage fallback:", err);
    }
    return this.getLocal<Customer>("acougue_customers");
  }

  async addCustomer(customer: Omit<Customer, "id" | "pontos">): Promise<Customer> {
    const newCustomer: Customer = {
      ...customer,
      id: "cust_" + Math.random().toString(36).substring(2, 9),
      pontos: 0
    };

    try {
      const { data, error } = await supabase.from("clientes").insert([newCustomer]).select();
      if (error) throw error;
      if (data && data[0]) {
        return data[0] as Customer;
      }
    } catch (err) {
      console.warn("Supabase customer add failed, saving to localStorage:", err);
    }

    const customers = this.getLocal<Customer>("acougue_customers");
    customers.push(newCustomer);
    this.saveLocal("acougue_customers", customers);
    return newCustomer;
  }

  async updateCustomer(id: string, customerUpdate: Partial<Customer>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase.from("clientes").update(customerUpdate).eq("id", id).select();
      if (error) throw error;
      if (data && data[0]) {
        return data[0] as Customer;
      }
    } catch (err) {
      console.warn("Supabase customer update failed, saving to localStorage:", err);
    }

    const customers = this.getLocal<Customer>("acougue_customers");
    const index = customers.findIndex(c => c.id === id);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...customerUpdate };
      this.saveLocal("acougue_customers", customers);
      return customers[index];
    }
    return null;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase customer delete failed, using localStorage fallback:", err);
    }

    const customers = this.getLocal<Customer>("acougue_customers");
    const filtered = customers.filter(c => c.id !== id);
    this.saveLocal("acougue_customers", filtered);
    return true;
  }

  // ACCOUNTS PAYABLE (CONTAS A PAGAR)
  async getContasPagar(): Promise<ContaPagar[]> {
    try {
      const { data, error } = await supabase.from("contas_pagar").select("*").order("data_vencimento");
      if (error) throw error;
      if (data && data.length > 0) {
        return data as ContaPagar[];
      }
    } catch (err) {
      console.warn("Supabase accounts payable fetch failed, using localStorage fallback:", err);
    }
    return this.getLocal<ContaPagar>("acougue_contas");
  }

  async addContaPagar(conta: Omit<ContaPagar, "id" | "criado_em">): Promise<ContaPagar> {
    const newConta: ContaPagar = {
      ...conta,
      id: "cnt_" + Math.random().toString(36).substring(2, 9),
      criado_em: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from("contas_pagar").insert([newConta]).select();
      if (error) throw error;
      if (data && data[0]) {
        return data[0] as ContaPagar;
      }
    } catch (err) {
      console.warn("Supabase conta pagar add failed, saving to localStorage:", err);
    }

    const contas = this.getLocal<ContaPagar>("acougue_contas");
    contas.push(newConta);
    this.saveLocal("acougue_contas", contas);
    return newConta;
  }

  async updateContaPagar(id: string, update: Partial<ContaPagar>): Promise<ContaPagar | null> {
    try {
      const { data, error } = await supabase.from("contas_pagar").update(update).eq("id", id).select();
      if (error) throw error;
      if (data && data[0]) {
        return data[0] as ContaPagar;
      }
    } catch (err) {
      console.warn("Supabase conta pagar update failed, saving to localStorage:", err);
    }

    const contas = this.getLocal<ContaPagar>("acougue_contas");
    const index = contas.findIndex(c => c.id === id);
    if (index !== -1) {
      contas[index] = { ...contas[index], ...update };
      this.saveLocal("acougue_contas", contas);
      return contas[index];
    }
    return null;
  }

  async deleteContaPagar(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("contas_pagar").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn("Supabase conta pagar delete failed, using localStorage fallback:", err);
    }

    const contas = this.getLocal<ContaPagar>("acougue_contas");
    const filtered = contas.filter(c => c.id !== id);
    this.saveLocal("acougue_contas", filtered);
    return true;
  }

  // SALES
  async getSales(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase.from("vendas").select("*, itens:itens_venda(*)").order("data_venda", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) {
        return data as Sale[];
      }
    } catch (err) {
      console.warn("Supabase sales fetch failed, using localStorage fallback:", err);
    }
    return this.getLocal<Sale>("acougue_sales");
  }

  async addSale(sale: Omit<Sale, "id" | "data_venda">, items: Omit<SaleItem, "id">[]): Promise<Sale> {
    const saleId = "sale_" + Math.random().toString(36).substring(2, 9);
    const date = new Date().toISOString();

    const newSaleItem: SaleItem[] = items.map(it => ({
      ...it,
      venda_id: saleId,
      id: "sitem_" + Math.random().toString(36).substring(2, 9)
    }));

    const newSale: Sale = {
      ...sale,
      id: saleId,
      data_venda: date,
      itens: newSaleItem
    };

    // Update stocks locally
    const products = this.getLocal<Product>("acougue_products");
    items.forEach(item => {
      const prod = products.find(p => p.id === item.produto_id);
      if (prod) {
        prod.estoque = Math.max(0, prod.estoque - item.quantidade);
      }
    });
    this.saveLocal("acougue_products", products);

    // Update customer points locally if customer is selected
    if (sale.cliente_id) {
      const customers = this.getLocal<Customer>("acougue_customers");
      const customer = customers.find(c => c.id === sale.cliente_id);
      if (customer) {
        // 1 point for every 10 BRL spent
        customer.pontos += Math.floor(sale.total / 10);
      }
      this.saveLocal("acougue_customers", customers);
    }

    try {
      // 1. Insert venda
      const { error: saleError } = await supabase.from("vendas").insert([{
        id: saleId,
        cliente_id: sale.cliente_id,
        total: sale.total,
        forma_pagamento: sale.forma_pagamento,
        data_venda: date,
        desconto: sale.desconto
      }]);

      if (saleError) throw saleError;

      // 2. Insert items
      const { error: itemsError } = await supabase.from("itens_venda").insert(items.map(it => ({
        venda_id: saleId,
        produto_id: it.produto_id,
        quantidade: it.quantidade,
        preco_unitario: it.preco_unitario
      })));

      if (itemsError) throw itemsError;

      // 3. Update products stocks on Supabase
      for (const item of items) {
        const prod = products.find(p => p.id === item.produto_id);
        if (prod) {
          await supabase.from("produtos").update({ estoque: prod.estoque }).eq("id", item.produto_id);
        }
      }

      // 4. Update customer points on Supabase
      if (sale.cliente_id) {
        const customers = this.getLocal<Customer>("acougue_customers");
        const customer = customers.find(c => c.id === sale.cliente_id);
        if (customer) {
          await supabase.from("clientes").update({ pontos: customer.pontos }).eq("id", sale.cliente_id);
        }
      }

    } catch (err) {
      console.warn("Supabase sale insertion failed, using localStorage fallback:", err);
    }

    const sales = this.getLocal<Sale>("acougue_sales");
    sales.unshift(newSale);
    this.saveLocal("acougue_sales", sales);
    return newSale;
  }
}

export const db = new DB();
