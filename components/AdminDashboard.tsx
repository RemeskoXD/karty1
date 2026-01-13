import React, { useState, useEffect } from 'react';
import { Order, GameType } from '../types';
import { GAME_VARIANTS } from '../utils/deckBuilder';
import { dbService } from '../services/database';
import CardPreview from './CardPreview';
import { Package, Download, Printer, User, Search, Trash2, ArrowLeft, Image as ImageIcon, RefreshCw, Lock, LogIn } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const [showCutMarks, setShowCutMarks] = useState(true);
  const [viewSide, setViewSide] = useState<'face' | 'back'>('face');
  const [isLoading, setIsLoading] = useState(false);

  // Check session storage for existing auth
  useEffect(() => {
    const isAuth = sessionStorage.getItem('mycards-admin-auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadOrders();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Jednoduché heslo - pro vyšší bezpečnost by mělo být řešeno na serveru
    if (password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('mycards-admin-auth', 'true');
      loadOrders();
    } else {
      setAuthError(true);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
        const data = await dbService.getOrders();
        setOrders(data);
    } catch (e) {
        console.error("Failed to load orders", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (confirm("Opravdu chcete smazat všechna data?")) {
      await dbService.clearAll();
      setOrders([]);
      setSelectedOrder(null);
      loadOrders();
    }
  };

  const downloadOrderJson = (order: Order) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(order, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `order-${order.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
           <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center border border-gold-500/30">
                 <Lock className="text-gold-500" size={32} />
              </div>
           </div>
           <h1 className="text-2xl font-bold text-white text-center mb-2">Administrace</h1>
           <p className="text-slate-400 text-center mb-8 text-sm">Pro přístup k objednávkám zadejte heslo.</p>
           
           <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
                  placeholder="Heslo"
                  className={`w-full bg-slate-900 border ${authError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white focus:border-gold-500 outline-none transition-colors`}
                  autoFocus
                />
                {authError && <p className="text-red-400 text-xs mt-2">Nesprávné heslo.</p>}
              </div>
              <button type="submit" className="w-full bg-gold-600 hover:bg-gold-500 text-navy-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all">
                 <LogIn size={20} /> Vstoupit
              </button>
           </form>
           
           <div className="mt-6 text-center">
             <a href="/" className="text-slate-500 hover:text-white text-xs flex items-center justify-center gap-1 transition-colors">
               <ArrowLeft size={12} /> Zpět na web
             </a>
           </div>
        </div>
      </div>
    );
  }

  // --- PRINT VIEW ---
  if (printMode && selectedOrder) {
    const dimensions = GAME_VARIANTS[selectedOrder.gameType].dimensions;
    const itemsToPrint = selectedOrder.deck;

    return (
      <div className="bg-white min-h-screen text-black print:p-0 font-sans">
        {/* Print Controls */}
        <div className="p-6 bg-gray-100 border-b border-gray-300 flex justify-between items-center print:hidden sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-4">
             <h2 className="font-bold text-lg">Tiskový Náhled</h2>
             
             {/* Side Toggles */}
             <div className="flex bg-white rounded border border-gray-300 overflow-hidden">
                <button 
                    onClick={() => setViewSide('face')} 
                    className={`px-3 py-1 text-sm ${viewSide === 'face' ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-gray-50'}`}
                >
                    Líce (Faces)
                </button>
                <div className="w-[1px] bg-gray-300"></div>
                <button 
                    onClick={() => setViewSide('back')} 
                    className={`px-3 py-1 text-sm ${viewSide === 'back' ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-gray-50'}`}
                >
                    Ruby (Backs)
                </button>
             </div>

             <div className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-gray-300 text-sm">
                <input 
                  type="checkbox" 
                  id="cutMarks" 
                  checked={showCutMarks} 
                  onChange={e => setShowCutMarks(e.target.checked)} 
                />
                <label htmlFor="cutMarks">Ořezové značky</label>
             </div>
             <span className="text-sm text-gray-500">
               {dimensions.width}mm x {dimensions.height}mm
             </span>
          </div>
          <div className="flex gap-4">
             <button onClick={() => setPrintMode(false)} className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded transition-colors">Zpět</button>
             <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold shadow-sm flex items-center gap-2">
                <Printer size={18}/> Vytisknout
             </button>
          </div>
        </div>
        
        {/* Printable Canvas */}
        <div className="p-8 print:p-0 mx-auto max-w-[210mm]">
           <div className="mb-4 print:mb-2 border-b-2 border-black pb-2">
              <h1 className="text-xl font-bold">Objednávka {selectedOrder.id} - {viewSide === 'face' ? 'LÍCE' : 'RUBY'}</h1>
              <p className="text-sm">Klient: {selectedOrder.customer.firstName} {selectedOrder.customer.lastName} | Hra: {GAME_VARIANTS[selectedOrder.gameType].name}</p>
           </div>

           <div className="flex flex-wrap content-start gap-0">
              {itemsToPrint.map((card, index) => (
                <div 
                   key={card.id + viewSide} 
                   className="relative break-inside-avoid"
                   style={{ 
                      width: `${dimensions.width}mm`, 
                      height: `${dimensions.height}mm`,
                      margin: showCutMarks ? '1mm' : '0',
                   }}
                >
                   {showCutMarks && (
                      <>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-400 -translate-x-px -translate-y-px pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-gray-400 translate-x-px -translate-y-px pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-gray-400 -translate-x-px translate-y-px pointer-events-none"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-400 translate-x-px translate-y-px pointer-events-none"></div>
                      </>
                   )}

                   <CardPreview 
                        card={card} 
                        backConfig={selectedOrder.backConfig} 
                        side={viewSide}
                        printMode={true} 
                   />
                   
                   <div className="absolute -bottom-3 left-0 w-full text-[6px] text-gray-400 text-center print:hidden">
                      #{index + 1} {viewSide === 'face' ? `${card.rank} ${card.suit}` : 'Back'}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-12 border-b border-slate-700 pb-6">
           <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <Package className="text-gold-500"/> Administrace Objednávek
           </h1>
           <div className="flex gap-4">
              <a href="/" className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-sm flex items-center gap-2"><ArrowLeft size={16}/> Zpět do Obchodu</a>
              <button onClick={loadOrders} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-sm flex items-center gap-2"><RefreshCw size={16}/> Obnovit</button>
              <button onClick={() => { sessionStorage.removeItem('mycards-admin-auth'); setIsAuthenticated(false); }} className="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 text-sm flex items-center gap-2"><Lock size={16}/> Odhlásit</button>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* Sidebar - Order List */}
          <div className="col-span-12 lg:col-span-4 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 h-[80vh] flex flex-col">
             <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                   <input type="text" placeholder="Hledat objednávku..." className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-9 text-sm focus:border-gold-500 outline-none" />
                </div>
             </div>
             <div className="overflow-y-auto flex-1 p-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full text-slate-500 gap-2">
                        <RefreshCw className="animate-spin"/> Načítám...
                    </div>
                ) : orders.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">Žádné objednávky</div>
                ) : (
                  orders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 rounded-lg cursor-pointer mb-2 transition-all border ${selectedOrder?.id === order.id ? 'bg-gold-500/10 border-gold-500' : 'bg-slate-800 border-transparent hover:bg-slate-700 hover:border-slate-600'}`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-white">{order.customer.lastName} {order.customer.firstName}</span>
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">{order.status}</span>
                       </div>
                       <div className="text-xs text-slate-400 mb-1">ID: {order.id}</div>
                       <div className="text-xs text-slate-400">{new Date(order.date).toLocaleString('cs-CZ')}</div>
                       <div className="text-sm font-bold text-gold-400 mt-2">{order.totalPrice} Kč</div>
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Main Content - Detail */}
          <div className="col-span-12 lg:col-span-8">
             {selectedOrder ? (
               <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 h-[80vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8 border-b border-slate-700 pb-6">
                     <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Objednávka #{selectedOrder.id}</h2>
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                           <span>{new Date(selectedOrder.date).toLocaleString('cs-CZ')}</span>
                           <span>•</span>
                           <span className="text-gold-400 font-bold">{GAME_VARIANTS[selectedOrder.gameType].name}</span>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => downloadOrderJson(selectedOrder)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded flex items-center gap-2 text-sm transition-colors">
                           <Download size={16}/> JSON Data
                        </button>
                        <button onClick={() => setPrintMode(true)} className="bg-gold-600 hover:bg-gold-500 text-black font-bold px-4 py-2 rounded flex items-center gap-2 text-sm transition-colors shadow-lg shadow-gold-600/20">
                           <Printer size={16}/> Tiskový Náhled
                        </button>
                     </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                     <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-gold-500 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><User size={14}/> Zákazník</h3>
                        <p className="font-bold text-lg mb-1">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                        <p className="text-slate-400 text-sm mb-1">{selectedOrder.customer.email}</p>
                        <p className="text-slate-400 text-sm">{selectedOrder.customer.phone}</p>
                     </div>
                     <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-gold-500 font-bold uppercase tracking-wider text-xs mb-4 flex items-center gap-2"><Package size={14}/> Doručení</h3>
                        <p className="mb-1">{selectedOrder.customer.street}</p>
                        <p className="mb-1">{selectedOrder.customer.city}, {selectedOrder.customer.zip}</p>
                        <p className="text-slate-400 text-sm mt-2 pt-2 border-t border-slate-700">
                           Metoda: <span className="text-white uppercase">{selectedOrder.customer.deliveryMethod}</span>
                        </p>
                     </div>
                  </div>

                  {/* Back Design Preview */}
                  <div className="mb-8">
                     <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-gold-500"/> Design Zadní Strany (Rub)
                     </h3>
                     <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex gap-8 items-center">
                        <div className="w-32">
                           <CardPreview 
                                backConfig={selectedOrder.backConfig} 
                                side='back'
                                card={selectedOrder.deck[0]} // just for dimensions
                                className="pointer-events-none" 
                           />
                        </div>
                        <div>
                             <p className="text-gray-400 text-sm">Vlastní text:</p>
                             <p className="text-white font-bold text-lg">{selectedOrder.backConfig.customText || '-'}</p>
                        </div>
                     </div>
                  </div>

                  {/* Deck Preview Grid */}
                  <div>
                     <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-gold-500"/>
                        Podklady pro tisk ({selectedOrder.deck.length} karet)
                     </h3>
                     <div className="text-xs text-slate-400 mb-4 bg-slate-900/50 p-3 rounded border border-slate-700">
                        <strong className="text-gold-400">TIP:</strong> Pro tisk klikněte na tlačítko <strong>"Tiskový Náhled"</strong> vpravo nahoře.
                     </div>
                     <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                        {selectedOrder.deck.map((card) => (
                           <div key={card.id} className="relative group">
                              <CardPreview card={card} className="pointer-events-none" />
                              <div className="mt-1 text-center">
                                 <span className="text-[10px] text-slate-500 block">{card.rank} {card.suit}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                  
                   {/* Delete Action (Optional) */}
                   <div className="mt-12 pt-8 border-t border-slate-700 flex justify-end">
                      <button onClick={handleClearDatabase} className="text-red-900/50 hover:text-red-500 text-xs flex items-center gap-1 transition-colors">
                         <Trash2 size={12}/> Smazat všechna data (Nouzové)
                      </button>
                   </div>

               </div>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-4">
                  <Package size={64} className="opacity-20"/>
                  <p>Vyberte objednávku ze seznamu</p>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;