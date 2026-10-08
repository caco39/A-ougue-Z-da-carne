'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, User, CreditCard, 
  Check, Ticket, CircleDot, AlertCircle, ShoppingBag, Coins,
  Maximize, Minimize, Barcode, Scan, Zap, CheckCircle2
} from "lucide-react";
import { Product, Customer, db } from "../lib/db";

// Web Audio API beep sound generator for retail scanner feedback
const playScannerBeep = (type: 'success' | 'error' = 'success') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 - clean positive chime
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz for unknown barcode
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // AudioContext blocked or not supported - silent fallback
  }
};

export default function PdvView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
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

  // Barcode input ref for automatic focus
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    const [prods, custs] = await Promise.all([
      db.getProducts(),
      db.getCustomers()
    ]);
    setProducts(prods);
    setCustomers(custs);
  }, []);

  useEffect(() => {
    loadData();

    // Auto focus barcode input on mount
    const timer = setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 150);

    // Reload products if window regains focus (e.g. edited in another tab)
    const handleWindowFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadData]);

  // Robust barcode finder supporting exact, case-insensitive, digits-only, and leading-zero tolerance
  const findProductByBarcode = useCallback((rawCode: string, list: Product[]): Product | undefined => {
    if (!rawCode) return undefined;
    const code = rawCode.trim();
    const digitsOnly = code.replace(/\D/g, "");

    return list.find(p => {
      const pCode = String(p.codigo_barras || "").trim();
      const pDigits = pCode.replace(/\D/g, "");

      // 1. Exact match
      if (pCode === code) return true;
      // 2. Case-insensitive match
      if (pCode.toLowerCase() === code.toLowerCase()) return true;
      // 3. ID match
      if (p.id === code) return true;
      // 4. Digits-only match (ignores any formatting spaces/dots/dashes)
      if (digitsOnly.length > 0 && pDigits.length > 0 && pDigits === digitsOnly) return true;
      // 5. Leading-zeros tolerance (e.g. 12-digit UPC vs 13-digit EAN-13, like 07894900027013 vs 7894900027013)
      if (digitsOnly.length >= 6 && pDigits.length >= 6) {
        if (digitsOnly.replace(/^0+/, "") === pDigits.replace(/^0+/, "")) return true;
      }
      return false;
    });
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.codigo_barras.includes(searchQuery);
    const matchesCategory = selectedCategory === "Todos" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["Todos", "Cervejas", "Destilados", "Vinhos & Espumantes", "Refrigerantes & Sucos", "Águas & Energéticos", "Petiscos & Diversos"];

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4500);
  };

  // Cart operations
  const addToCart = useCallback((product: Product, defaultQty = 1) => {
    const stock = Number(product.estoque ?? 9999);
    if (stock <= 0) {
      playScannerBeep('error');
      triggerError(`Produto "${product.nome}" sem estoque no momento!`);
      return false;
    }

    const existingIndex = cart.findIndex(item => item.product.id === product.id);
    const existingQty = existingIndex !== -1 ? cart[existingIndex].quantity : 0;
    const additionalQty = product.unidade === "kg" ? 0.5 : 1;
    const finalQty = existingQty + (defaultQty > 1 ? defaultQty : additionalQty);

    if (finalQty > stock) {
      playScannerBeep('error');
      triggerError(`Estoque máximo atingido para ${product.nome} (${stock} ${product.unidade})!`);
      return false;
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
    return true;
  }, [cart]);

  // Main barcode processor
  const processBarcode = useCallback((codeToProcess: string) => {
    const code = codeToProcess.trim();
    if (!code) return;

    const found = findProductByBarcode(code, products);
    if (found) {
      const added = addToCart(found);
      if (added) {
        playScannerBeep('success');
        setSuccessMsg(`✓ Bipado: ${found.nome} (${found.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})`);
        setTimeout(() => setSuccessMsg(""), 3500);
      }
      setBarcodeInput("");
    } else {
      playScannerBeep('error');
      triggerError(`Produto com código "${code}" não encontrado no cadastro!`);
      setBarcodeInput("");
    }

    // Always restore focus to scanner input
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  }, [products, findProductByBarcode, addToCart]);

  // Global key listener to catch barcode scanner input ANYWHERE on the screen
  useEffect(() => {
    let scanBuffer = "";
    let lastCharTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (showReceipt) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const isOtherInput = activeEl && 
        (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT") &&
        activeEl !== barcodeInputRef.current;

      // Handle Enter (which all barcode scanners send upon completing a scan)
      if (e.key === "Enter") {
        const now = Date.now();
        const isRapidScan = (now - lastCharTime) < 120 && scanBuffer.length >= 3;

        // If not typing in another input, or if it was a fast barcode scan burst
        if (!isOtherInput || isRapidScan) {
          const finalCode = (scanBuffer.length >= 3 ? scanBuffer : barcodeInput).trim();
          if (finalCode) {
            e.preventDefault();
            processBarcode(finalCode);
            scanBuffer = "";
            setBarcodeInput("");
            return;
          }
        }
        scanBuffer = "";
        return;
      }

      // Collect single printable characters
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const now = Date.now();
        const elapsed = now - lastCharTime;
        lastCharTime = now;

        // Scanners transmit characters very rapidly (interval < 50-80ms)
        if (elapsed > 180) {
          scanBuffer = e.key;
        } else {
          scanBuffer += e.key;
        }

        // If user isn't actively inside another input, auto-focus scanner input
        if (!isOtherInput && document.activeElement !== barcodeInputRef.current) {
          barcodeInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [products, barcodeInput, showReceipt, processBarcode]);

  // Form submit for barcode input
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    processBarcode(barcodeInput);
  };

  // Search input keydown handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      // 1. Try finding by barcode
      const foundByBarcode = findProductByBarcode(query, products);
      if (foundByBarcode) {
        const added = addToCart(foundByBarcode);
        if (added) {
          playScannerBeep('success');
          setSuccessMsg(`✓ Bipado: ${foundByBarcode.nome}`);
          setTimeout(() => setSuccessMsg(""), 3500);
        }
        setSearchQuery("");
        return;
      }

      // 2. If exactly one item matches current search, add it
      if (filteredProducts.length === 1) {
        const added = addToCart(filteredProducts[0]);
        if (added) {
          playScannerBeep('success');
          setSuccessMsg(`✓ Adicionado: ${filteredProducts[0].nome}`);
          setTimeout(() => setSuccessMsg(""), 3500);
        }
        setSearchQuery("");
        return;
      }
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
      playScannerBeep('error');
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
            className="fixed top-6 right-6 z-50 bg-red-950/95 text-red-200 border border-red-700 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md"
          >
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </motion.div>
        )}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 right-6 z-50 bg-emerald-950/95 text-emerald-200 border border-emerald-700 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT: Product Grid & Category Filters (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Header and Scanner bar */}
        <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          {/* Status banner showing scanner is active */}
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 text-xs">
            <div 
              onClick={() => barcodeInputRef.current?.focus()}
              className="flex items-center space-x-2 text-emerald-700 font-semibold cursor-pointer select-none hover:text-emerald-800"
              title="Clique para focar o leitor a qualquer momento"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Barcode className="h-4 w-4 text-emerald-600" />
              <span>Leitor de Código de Barras Pronto</span>
              <span className="text-[10px] text-stone-400 font-normal hidden sm:inline">(bipagem automática habilitada)</span>
            </div>

            <button 
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center space-x-1 px-2.5 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 rounded-lg transition-all text-xs"
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Sair Tela Cheia" : "Tela Cheia"}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou código (Enter p/ add)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-stone-50 border border-stone-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 transition-all outline-none"
              />
            </div>
            
            {/* Direct Barcode Scanner Field */}
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2 shrink-0">
              <div className="relative">
                <Barcode className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <input 
                  ref={barcodeInputRef}
                  type="text" 
                  placeholder="Bipar código de barras..." 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="bg-stone-50 border border-stone-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono text-rose-700 font-bold placeholder-stone-400 w-48 sm:w-56 outline-none transition-all"
                />
              </div>
              <button 
                type="submit" 
                className="bg-rose-700 hover:bg-rose-800 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Bipar</span>
              </button>
            </form>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? "bg-rose-700 text-white border-rose-600 shadow-sm" 
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
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
              className={`group cursor-pointer bg-white p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-40 ${
                p.estoque <= 0 
                  ? "border-stone-100 opacity-40 hover:opacity-40" 
                  : "border-stone-200 hover:border-rose-300 hover:shadow-md"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  {p.categoria}
                </span>
                <h4 className="font-bold text-sm text-stone-800 line-clamp-2 mt-2 group-hover:text-stone-900">
                  {p.nome}
                </h4>
              </div>

              <div className="flex items-end justify-between mt-4">
                <div>
                  <p className="text-xs text-stone-400 font-mono">Código: {p.codigo_barras}</p>
                  <p className="text-xs font-semibold text-stone-600 mt-1">Estoque: {p.estoque} {p.unidade}</p>
                </div>
                <p className="font-bold text-rose-600 text-base">
                  {p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  <span className="text-[10px] font-normal text-stone-400">/{p.unidade}</span>
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
      <div className="lg:col-span-5 flex flex-col h-[740px] bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-lg">
        {/* Cart Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h3 className="font-bold text-stone-900 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-rose-500" />
            Carrinho de Vendas
          </h3>
          <span className="text-xs bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-100 font-semibold font-mono">
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
                className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200"
              >
                <div className="flex-1 pr-3">
                  <h5 className="font-semibold text-sm text-stone-800 line-clamp-1">{item.product.nome}</h5>
                  <p className="text-xs text-rose-600 font-mono mt-0.5">
                    {item.product.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/{item.product.unidade}
                  </p>
                </div>

                <div className="flex items-center space-x-3.5">
                  <div className="flex items-center bg-white border border-stone-200 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateQuantity(item.product.id, "dec")}
                      className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3.5 text-xs font-bold text-stone-800 font-mono w-14 text-center">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, "inc")}
                      className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-sm font-bold text-stone-800 font-mono w-20 text-right">
                    {item.subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>

                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-stone-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Client Selector & Payments panel */}
        <div className="p-5 border-t border-stone-200 bg-stone-50/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Customer select */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center">
                <User className="h-3 w-3 mr-1" /> Cliente
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs bg-white border border-stone-200 hover:border-stone-300 rounded-lg p-2 text-stone-800 outline-none"
              >
                <option value="">Cliente Balcão (Nenhum)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.cpf})</option>
                ))}
              </select>
            </div>

            {/* Discount field */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center">
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
                className="w-full text-xs bg-white border border-stone-200 hover:border-stone-300 rounded-lg p-2 font-mono text-stone-800 outline-none"
              />
            </div>
          </div>

          {/* Payment options */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5 flex items-center">
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
                      ? "bg-rose-50 text-rose-700 border-rose-200" 
                      : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50 hover:text-stone-800"
                  }`}
                >
                  {method === "Cartão de Crédito" ? "C. Crédito" : method === "Cartão de Débito" ? "C. Débito" : method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="p-5 bg-stone-50 border-t border-stone-200 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-stone-500 font-medium">
              <span>Subtotal</span>
              <span className="font-mono">{cartSubtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs text-rose-600 font-medium">
                <span>Desconto</span>
                <span className="font-mono">-{discount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-1">
              <span className="font-bold text-stone-700 text-sm">Valor Total</span>
              <span className="font-bold text-stone-900 text-2xl font-mono">
                {cartTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center transition-all ${
              cart.length === 0 
                ? "bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none" 
                : "bg-rose-700 hover:bg-rose-800 text-white"
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
              <h4 className="font-black text-sm uppercase">Distribuidora Dona Bodega</h4>
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
