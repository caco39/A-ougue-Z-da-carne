'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard, 
  Check, Ticket, CircleDot, AlertCircle, ShoppingBag, Coins
} from "lucide-react";
import { Product, Customer, db } from "../lib/db";

export default function PdvView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  // Cart state
  interface CartItem {
    product: Product;
    quantity: number;
    subtotal: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"Dinheiro" | "Cartão de Crédito" | "Cartão de Débito" | "Pix">("Pix");

  // Scanner state
  const [barcodeInput, setBarcodeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [prods, custs] = await Promise.all([
        db.getProducts(),
        db.getCustomers()
      ]);
      setProducts(prods);
      setCustomers(custs);
    }
    loadData();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.codigo_barras.includes(searchQuery);
    const matchesCategory = selectedCategory === "Todos" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["Todos", "Carnes Bovinas", "Carnes Suínas", "Aves", "Linguiças & Embutidos", "Bebidas & Outros"];

  // Cart operations
  const addToCart = (product: Product, defaultQty = 1) => {
    if (product.estoque <= 0) {
      triggerError(`Produto ${product.nome} sem estoque!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const existingQty = existingIndex !== -1 ? cart[existingIndex].quantity : 0;
    const additionalQty = product.unidade === "kg" ? 0.5 : 1;
    const finalQty = existingQty + (defaultQty > 1 ? defaultQty : additionalQty);

    if (finalQty > product.estoque) {
      triggerError(`Estoque máximo atingido para ${product.nome}!`);
      return;
    }

    if (existingIndex !== -1) {
      const updated = [...cart];
      updated[existingIndex].quantity = finalQty;
      updated[existingIndex].subtotal = finalQty * product.preco;
      setCart(updated);
    } else {
      setCart([...cart, {
        product,
        quantity: defaultQty > 1 ? defaultQty : additionalQty,
        subtotal: (defaultQty > 1 ? defaultQty : additionalQty) * product.preco
      }]);
    }
  };

  const updateQuantity = (productId: string, action: "inc" | "dec") => {
    const existingIndex = cart.findIndex(item => item.product.id === productId);
    if (existingIndex === -1) return;

    const item = cart[existingIndex];
    const step = item.product.unidade === "kg" ? 0.5 : 1;
    let newQty = action === "inc" ? item.quantity + step : item.quantity - step;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > item.product.estoque) {
      triggerError(`Estoque insuficiente!`);
      return;
    }

    const updated = [...cart];
    updated[existingIndex].quantity = newQty;
    updated[existingIndex].subtotal = newQty * item.product.preco;
    setCart(updated);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // Barcode quick addition
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const found = products.find(p => p.codigo_barras === barcodeInput || p.id === barcodeInput);
    if (found) {
      addToCart(found);
      setBarcodeInput("");
      setSuccessMsg(`Adicionado: ${found.nome}`);
      setTimeout(() => setSuccessMsg(""), 2000);
    } else {
      triggerError(`Produto com código "${barcodeInput}" não encontrado!`);
    }
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartTotal = Math.max(0, cartSubtotal - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      triggerError("O carrinho está vazio!");
      return;
    }

    const client = customers.find(c => c.id === selectedCustomerId);

    const saleData = {
      cliente_id: selectedCustomerId || null,
      cliente_nome: client?.nome || undefined,
      total: cartTotal,
      forma_pagamento: paymentMethod,
      desconto: discount,
      itens: [] // added inside database wrapper
    };

    const saleItems = cart.map(item => ({
      produto_id: item.product.id,
      produto_nome: item.product.nome,
      quantidade: item.product.unidade === "kg" ? parseFloat(item.quantity.toFixed(3)) : item.quantity,
      preco_unitario: item.product.preco,
      subtotal: parseFloat(item.subtotal.toFixed(2))
    }));

    try {
      const completed = await db.addSale(saleData, saleItems);
      setLastCompletedSale(completed);
      setShowReceipt(true);
      
      // Clean cart
      setCart([]);
      setDiscount(0);
      setSelectedCustomerId("");
      
      // Refresh local product inventory stocks
      const refreshedProducts = await db.getProducts();
      setProducts(refreshedProducts);
    } catch (err) {
      triggerError("Falha ao registrar a venda.");
    }
  };

  return (
    <div id="pdv-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Messages */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-red-950/90 text-red-300 border border-red-900 px-4 py-3 rounded-xl shadow-2xl flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-rose-950/95 text-rose-300 border border-rose-900 px-4 py-3 rounded-xl shadow-2xl flex items-center"
          >
            <Check className="h-5 w-5 mr-2" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: Product Grid & Category Filters (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Header and Scanner bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 p-5 rounded-2xl border border-stone-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou código..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl pl-10 pr-4 py-2 text-sm text-stone-300 placeholder-stone-600 transition-all"
            />
          </div>
          
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Código de Barras..." 
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="bg-stone-950 border border-stone-800 focus:border-rose-950 focus:ring-1 focus:ring-rose-950 rounded-xl px-3 py-2 text-sm font-mono text-rose-400 placeholder-stone-600 w-44"
            />
            <button 
              type="submit" 
              className="bg-rose-900 hover:bg-rose-850 border border-rose-800/40 text-stone-100 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? "bg-rose-900 text-stone-100 border-rose-800" 
                  : "bg-stone-900 text-stone-400 border-stone-850 hover:bg-stone-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[580px] overflow-y-auto pr-1">
          {filteredProducts.map((p) => (
            <motion.div
              whileTap={{ scale: 0.98 }}
              key={p.id}
              onClick={() => addToCart(p)}
              className={`group cursor-pointer bg-stone-900 p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-40 ${
                p.estoque <= 0 
                  ? "border-stone-850 opacity-40 hover:opacity-40" 
                  : "border-stone-800 hover:border-rose-900/40 hover:shadow-lg"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-rose-400 bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-900/10">
                  {p.categoria}
                </span>
                <h4 className="font-semibold text-sm text-stone-200 line-clamp-2 mt-2 group-hover:text-stone-100">
                  {p.nome}
                </h4>
              </div>

              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-xs text-stone-500 font-mono">Código: {p.codigo_barras}</p>
                  <p className="text-xs font-semibold text-stone-400 mt-1">Estoque: {p.estoque} {p.unidade}</p>
                </div>
                <p className="font-bold text-rose-400 text-base">
                  {p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  <span className="text-[10px] font-normal text-stone-500">/{p.unidade}</span>
                </p>
              </div>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-20 text-stone-500 text-sm">
              Nenhum produto encontrado nesta categoria.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart, Customer & Checkout panel (5 cols) */}
      <div className="lg:col-span-5 flex flex-col h-[740px] bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden shadow-xl">
        {/* Cart Header */}
        <div className="p-5 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <h3 className="font-bold text-stone-100 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-rose-500" />
            Carrinho de Vendas
          </h3>
          <span className="text-xs bg-rose-950/40 text-rose-400 px-3 py-1 rounded-full border border-rose-900/20 font-semibold font-mono">
            {cart.reduce((sum, item) => sum + (item.product.unidade === "kg" ? 1 : item.quantity), 0)} Itens
          </span>
        </div>

        {/* Cart list (flex-1) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-600 text-sm space-y-3">
              <ShoppingBag className="h-12 w-12 text-stone-800" />
              <span>O carrinho está vazio</span>
              <p className="text-xs text-stone-700 text-center max-w-xs">Insira um código de barras ou selecione produtos à esquerda para começar a vender.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id} 
                className="flex items-center justify-between p-3.5 bg-stone-950 rounded-xl border border-stone-850"
              >
                <div className="flex-1 pr-3">
                  <h5 className="font-semibold text-sm text-stone-200 line-clamp-1">{item.product.nome}</h5>
                  <p className="text-xs text-rose-400 font-mono mt-0.5">
                    {item.product.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/{item.product.unidade}
                  </p>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateQuantity(item.product.id, "dec")}
                      className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3.5 text-xs font-bold text-stone-200 font-mono w-14 text-center">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, "inc")}
                      className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-sm font-bold text-stone-200 font-mono w-20 text-right">
                    {item.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>

                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-stone-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Client Selector & Payments panel */}
        <div className="p-5 border-t border-stone-800 bg-stone-950/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Customer select */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
                <User className="h-3 w-3 mr-1" /> Cliente
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs bg-stone-950 border border-stone-850 hover:border-stone-800 rounded-lg p-2 text-stone-300"
              >
                <option value="">Cliente Balcão (Nenhum)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.cpf})</option>
                ))}
              </select>
            </div>

            {/* Discount field */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
                <Ticket className="h-3 w-3 mr-1" /> Desconto (R$)
              </label>
              <input 
                type="number" 
                placeholder="R$ 0,00"
                min="0"
                max={cartSubtotal}
                step="0.01"
                value={discount || ""}
                onChange={(e) => setDiscount(Math.min(cartSubtotal, parseFloat(e.target.value) || 0))}
                className="w-full text-xs bg-stone-950 border border-stone-850 hover:border-stone-800 rounded-lg p-2 font-mono text-stone-200"
              />
            </div>
          </div>

          {/* Payment options */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center">
              <CreditCard className="h-3 w-3 mr-1" /> Forma de Pagamento
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(["Dinheiro", "Pix", "Cartão de Crédito", "Cartão de Débito"] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  type="button"
                  className={`py-2 text-[10px] font-bold rounded-lg border transition-all text-center ${
                    paymentMethod === method 
                      ? "bg-rose-950 text-rose-300 border-rose-900" 
                      : "bg-stone-950 text-stone-500 border-stone-850 hover:border-stone-800 hover:text-stone-400"
                  }`}
                >
                  {method === "Cartão de Crédito" ? "C. Crédito" : method === "Cartão de Débito" ? "C. Débito" : method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="p-5 bg-stone-950 border-t border-stone-800 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-stone-500 font-medium">
              <span>Subtotal</span>
              <span className="font-mono">{cartSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-rose-400 font-medium">
                <span>Desconto</span>
                <span className="font-mono">-{discount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-1">
              <span className="font-bold text-stone-300 text-sm">Valor Total</span>
              <span className="font-bold text-stone-100 text-2xl font-mono">
                {cartTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-900/10 flex items-center justify-center transition-all ${
              cart.length === 0 
                ? "bg-stone-850 text-stone-600 border border-stone-800 cursor-not-allowed" 
                : "bg-rose-900 hover:bg-rose-850 border border-rose-800 text-stone-100"
            }`}
          >
            <Coins className="h-4.5 w-4.5 mr-2" />
            Finalizar Venda
          </button>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceipt && lastCompletedSale && (
        <div id="receipt-modal" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white text-stone-900 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden font-mono text-xs space-y-4"
          >
            <div className="text-center space-y-1 border-b border-dashed border-stone-300 pb-4">
              <h4 className="font-black text-sm uppercase">Açougue Gourmet</h4>
              <p className="text-[10px] text-stone-500">Rua das Américas, 452 - Centro</p>
              <p className="text-[10px] text-stone-500">CNPJ: 12.345.678/0001-99</p>
            </div>

            <div className="space-y-1 border-b border-dashed border-stone-300 pb-4">
              <p>VENDA: {lastCompletedSale.id}</p>
              <p>DATA: {new Date(lastCompletedSale.data_venda).toLocaleString("pt-BR")}</p>
              <p>CLIENTE: {lastCompletedSale.cliente_nome || "CONSUMIDOR FINAL"}</p>
            </div>

            <div className="border-b border-dashed border-stone-300 pb-4 space-y-2">
              <div className="grid grid-cols-12 font-bold uppercase text-[10px] text-stone-500">
                <span className="col-span-6">PRODUTO</span>
                <span className="col-span-2 text-center">QTD</span>
                <span className="col-span-4 text-right">TOTAL</span>
              </div>
              <div className="space-y-1">
                {lastCompletedSale.itens.map((it: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-[10px]">
                    <span className="col-span-6 line-clamp-1">{it.produto_nome}</span>
                    <span className="col-span-2 text-center">{it.quantidade}</span>
                    <span className="col-span-4 text-right">{it.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1 border-b border-dashed border-stone-300 pb-4 font-bold">
              {lastCompletedSale.desconto > 0 && (
                <div className="flex justify-between">
                  <span>DESCONTO:</span>
                  <span>{lastCompletedSale.desconto.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>TOTAL:</span>
                <span>{lastCompletedSale.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div className="flex justify-between text-[10px] font-normal text-stone-500 mt-1">
                <span>PAGAMENTO:</span>
                <span>{lastCompletedSale.forma_pagamento}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="font-bold uppercase text-[10px]">Obrigado pela preferência!</p>
              <p className="text-[9px] text-stone-400 mt-0.5">Volte Sempre!</p>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="w-full mt-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-sans font-bold text-xs tracking-wide uppercase transition-all"
            >
              Fechar Cupom
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
