import React, { useState, useEffect, useRef } from 'react';
import { Order, GameType, OrderStatus } from '../types';
import { GAME_VARIANTS, getGameShortCode, getPrintDimensions } from '../utils/deckBuilder';
import { dbService } from '../services/database';
import CardPreview from './CardPreview';
import { Package, Download, Printer, User, Search, Trash2, ArrowLeft, Image as ImageIcon, RefreshCw, Lock, LogIn, CheckCircle, Clock, AlertTriangle, XCircle, RotateCcw, FileArchive, Loader2 } from 'lucide-react';
import JSZip from 'jszip';
import * as FileSaver from 'file-saver';
import * as htmlToImage from 'html-to-image';

const AdminDashboard: React.FC = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('new');
  
  const [printMode, setPrintMode] = useState(false);
  const [showCutMarks, setShowCutMarks] = useState(true);
  const [viewSide, setViewSide] = useState<'face' | 'back'>('face');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);

  // Check session storage for existing auth
  useEffect(() => {
    const isAuth = sessionStorage.getItem('mycards-admin-auth') === 'true';
    if (isAuth) {
      setIsAuthenticated(true);
      loadOrders();
    }
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = orders;

    // 1. Filter by Tab
    if (activeTab === 'deleted') {
        result = result.filter(o => o.status === 'deleted');
    } else if (activeTab !== 'all') {
        result = result.filter(o => o.status === activeTab);
    } else {
        // 'all' shows everything except deleted
        result = result.filter(o => o.status !== 'deleted');
    }

    // 2. Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(o => 
            o.id.toLowerCase().includes(q) ||
            o.customer.lastName.toLowerCase().includes(q) ||
            o.customer.email.toLowerCase().includes(q)
        );
    }

    // Sort by date desc
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredOrders(result);
  }, [orders, activeTab, searchQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
      let deletedAt = null;
      if (newStatus === 'deleted') {
          deletedAt = new Date().toISOString();
      }

      const success = await dbService.updateOrder(orderId, newStatus, deletedAt);
      if (success) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, deletedAt } : o));
          if (selectedOrder?.id === orderId) {
              setSelectedOrder(prev => prev ? { ...prev, status: newStatus, deletedAt } : null);
          }
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

  // --- EXPORT LOGIC ---
  const handleExportZip = async (order: Order) => {
    if (isExporting || !exportRef.current) return;
    setIsExporting(true);
    
    try {
        const zip = new JSZip();
        
        // Naming Convention: MC[ID_NUM]_[LASTNAME]_[GAME]_[COUNT]ks
        // ID extraction: ORD-123456 -> 123456
        const idNum = order.id.replace('ORD-', '');
        const lastName = order.customer.lastName || 'Zakaznik';
        const gameShort = getGameShortCode(order.gameType);
        // Assuming 1 pack per order for now as structure doesn't hold qty, defaulting to 1ks
        const fileNameBase = `MC${idNum}_${lastName}_${gameShort}_1ks`;
        
        // Calculate Dimensions for 300 DPI
        const dims = getPrintDimensions(order.gameType);
        
        // We will render to a hidden container that has exact pixel dimensions
        // to ensure high resolution capture.
        
        // 1. Generate Faces
        for (let i = 0; i < order.deck.length; i++) {
            const card = order.deck[i];
            const indexStr = (i + 1).toString().padStart(3, '0'); // 001, 002...
            const fileName = `${indexStr}_${card.suit}_${card.rank}.png`;
            
            setExportProgress(`Generuji kartu ${i + 1} / ${order.deck.length}...`);
            
            // Wait for React to render the specific card in the hidden container
            await new Promise<void>(resolve => {
                // We use a specific render function or state to update the hidden view
                setExportingCard(card);
                setExportingSide('face');
                // Give it a moment to render image and load assets
                setTimeout(resolve, 300); 
            });

            if (exportRef.current) {
                try {
                    const blob = await htmlToImage.toBlob(exportRef.current, {
                        width: dims.width,
                        height: dims.height,
                        pixelRatio: 1, // We set container to exact pixels, so ratio 1
                        cacheBust: true, // Helps with CORS caching
                        backgroundColor: 'white', // Ensure white background
                        style: { transform: 'none' } // reset any potential transforms
                    });
                    if (blob) {
                        zip.file(fileName, blob);
                    } else {
                        console.error(`Failed to generate blob for card ${card.id}`);
                    }
                } catch (err) {
                    console.error(`Error capturing card ${card.id}`, err);
                }
            }
        }

        // 2. Generate Back
        setExportProgress("Generuji zadní stranu...");
        setExportingCard(order.deck[0]); // Just need any card for context if needed, but primarily back config
        setExportingSide('back');
        await new Promise(r => setTimeout(r, 300));

        if (exportRef.current) {
            try {
                const blob = await htmlToImage.toBlob(exportRef.current, {
                    width: dims.width,
                    height: dims.height,
                    pixelRatio: 1,
                    cacheBust: true,
                    backgroundColor: 'white'
                });
                if (blob) {
                    zip.file(`000_Back.png`, blob);
                }
            } catch (err) {
                console.error("Error capturing back side", err);
            }
        }

        // 3. Save
        setExportProgress("Komprimuji ZIP...");
        const content = await zip.generateAsync({ type: "blob" });
        
        // Robust Save Logic
        // Determine the save function from FileSaver import which might be varied in ESM/CommonJS/Bundled environments
        const saveFn = (FileSaver as any).saveAs || (FileSaver as any).default || FileSaver;
        
        if (typeof saveFn === 'function') {
            saveFn(content, `${fileNameBase}.zip`);
        } else {
             // Fallback to native anchor tag
             const url = URL.createObjectURL(content);
             const a = document.createElement('a');
             a.href = url;
             a.download = `${fileNameBase}.zip`;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             URL.revokeObjectURL(url);
        }

    } catch (e: any) {
        console.error("Export failed", e);
        alert(`Export selhal: ${e.message || 'Neznámá chyba'}. Zkontrolujte konzoli.`);
    } finally {
        setIsExporting(false);
        setExportProgress('');
        setExportingCard(null); // Clear hidden view
    }
  };

  // Hidden Render State
  const [exportingCard, setExportingCard] = useState<any>(null); // CardConfig
  const [exportingSide, setExportingSide] = useState<'face' | 'back'>('face');

  // --- HELPERS ---

  const getStatusLabel = (status: OrderStatus) => {
      switch(status) {
          case 'new': return 'Nové';
          case 'processing': return 'Pracuje se na tom';
          case 'issue': return 'Něco chybí';
          case 'done': return 'HOTOVO';
          case 'cancelled': return 'Storno';
          case 'deleted': return 'Vymazané';
          default: return status;
      }
  };

  const getStatusColor = (status: OrderStatus) => {
      switch(status) {
          case 'new': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
          case 'processing': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
          case 'issue': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
          case 'done': return 'bg-green-500/20 text-green-300 border-green-500/50';
          case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/50';
          case 'deleted': return 'bg-gray-700 text-gray-400 border-gray-600';
          default: return 'bg-slate-700 text-slate-300';
      }
  };

  const getDisplayId = (order: Order) => {
      const date = new Date(order.date);
      const year = date.getFullYear();
      const numPart = order.id.replace('ORD-', '');
      return `${year} / ${numPart}`;
  };

  const getDaysUntilDelete = (deletedAt?: string | null) => {
      if (!deletedAt) return 8;
      const delDate = new Date(deletedAt);
      const purgeDate = new Date(delDate.getTime() + (8 * 24 * 60 * 60 * 1000));
      const now = new Date();
      const diffTime = purgeDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
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

  // --- HIDDEN EXPORT CONTAINER ---
  // This is rendered outside the main flow but kept in DOM to allow html-to-image to capture it.
  const exportDimensions = selectedOrder ? getPrintDimensions(selectedOrder.gameType) : { width: 0, height: 0 };
  
  const ExportContainer = () => {
      if (!isExporting || !exportingCard || !selectedOrder) return null;

      // We explicitly render this in a div with fixed pixel width/height corresponding to 300 DPI
      return (
          <div style={{ position: 'absolute', top: -10000, left: -10000, overflow: 'hidden' }}>
              <div 
                  ref={exportRef}
                  style={{ 
                      width: `${exportDimensions.width}px`, 
                      height: `${exportDimensions.height}px`,
                      backgroundColor: 'white' // Ensure non-transparent background for print
                  }}
              >
                  <CardPreview 
                      card={exportingCard} 
                      backConfig={selectedOrder.backConfig}
                      side={exportingSide}
                      printMode={true} // Removes borders/shadows/rounded corners
                      className="w-full h-full"
                  />
              </div>
          </div>
      );
  };

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
              <h1 className="text-xl font-bold">Objednávka {getDisplayId(selectedOrder)} - {viewSide === 'face' ? 'LÍCE' : 'RUBY'}</h1>
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
  const tabs: { id: OrderStatus | 'all', label: string, icon: any }[] = [
      { id: 'all', label: 'Vše', icon: Package },
      { id: 'new', label: 'Nové', icon: CheckCircle },
      { id: 'processing', label: 'Pracuje se', icon: Clock },
      { id: 'issue', label: 'Chybí info', icon: AlertTriangle },
      { id: 'done', label: 'HOTOVO', icon: CheckCircle },
      { id: 'cancelled', label: 'Storno', icon: XCircle },
      { id: 'deleted', label: 'Vymazané', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col relative">
      <ExportContainer />

      {/* Export Overlay */}
      {isExporting && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <Loader2 size={48} className="text-gold-500 animate-spin mb-4"/>
              <h2 className="text-2xl font-bold text-white mb-2">Exportuji tisková data</h2>
              <p className="text-gold-400 font-mono text-sm">{exportProgress}</p>
              <p className="text-gray-500 text-xs mt-4">Prosím nezavírejte okno, generování 300 DPI obrázků může chvíli trvat.</p>
          </div>
      )}

      {/* Top Bar */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-40 shadow-md">
         <div className="max-w-[1600px] mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Package className="text-gold-500"/> Administrace
            </h1>
            
            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-slate-700 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <tab.icon size={14} className={activeTab === tab.id ? 'text-gold-500' : ''}/>
                        {tab.label}
                        {/* Counter badge (approx) */}
                        <span className="text-[10px] bg-slate-800 px-1.5 rounded-full ml-1 opacity-50">
                            {tab.id === 'all' 
                              ? orders.filter(o => o.status !== 'deleted').length
                              : orders.filter(o => o.status === tab.id).length
                            }
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <a href="/" className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs flex items-center gap-2 transition-colors">
                    <ArrowLeft size={14}/> Web
                </a>
                <button onClick={() => { sessionStorage.removeItem('mycards-admin-auth'); setIsAuthenticated(false); }} className="px-3 py-1.5 bg-red-900/30 text-red-300 hover:bg-red-900/50 rounded text-xs flex items-center gap-2 transition-colors">
                    <Lock size={14}/> Odhlásit
                </button>
            </div>
         </div>
      </header>

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-8 grid grid-cols-12 gap-6 h-[calc(100vh-80px)]">
          
          {/* Left Panel: List */}
          <div className="col-span-12 lg:col-span-4 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
             <div className="p-4 border-b border-slate-700 bg-slate-800/50 sticky top-0">
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                   <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Hledat (ID, Jméno, Email)..." 
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 pl-9 text-sm focus:border-gold-500 outline-none placeholder:text-slate-600" 
                   />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                    <span>Celkem: {filteredOrders.length}</span>
                    <button onClick={loadOrders} className="flex items-center gap-1 hover:text-gold-500"><RefreshCw size={10}/> Obnovit</button>
                </div>
             </div>
             
             <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12 text-slate-500 gap-2">
                        <RefreshCw className="animate-spin"/> Načítám...
                    </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center text-slate-500 py-12 flex flex-col items-center">
                      <Package size={32} className="opacity-20 mb-2"/>
                      Žádné objednávky v této sekci
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <div 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3 rounded-lg cursor-pointer transition-all border relative ${selectedOrder?.id === order.id ? 'bg-gold-500/10 border-gold-500' : 'bg-slate-900/50 border-transparent hover:bg-slate-700 hover:border-slate-600'}`}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white text-sm">{getDisplayId(order)}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                             {getStatusLabel(order.status)}
                          </span>
                       </div>
                       <div className="text-sm text-slate-300 mb-0.5">{order.customer.lastName} {order.customer.firstName}</div>
                       <div className="flex justify-between items-end">
                           <div className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString('cs-CZ')}</div>
                           <div className="text-xs font-bold text-gold-400">{order.totalPrice} Kč</div>
                       </div>
                       {order.status === 'deleted' && (
                           <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
                               <span className="text-red-500 text-xs font-bold bg-black/80 px-2 py-1 rounded">Smazání za {getDaysUntilDelete(order.deletedAt)} dní</span>
                           </div>
                       )}
                    </div>
                  ))
                )}
             </div>
          </div>

          {/* Right Panel: Detail */}
          <div className="col-span-12 lg:col-span-8 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden h-full">
             {selectedOrder ? (
               <div className="flex flex-col h-full">
                  {/* Detail Header */}
                  <div className="p-6 border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-start">
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-white">{getDisplayId(selectedOrder)}</h2>
                            {selectedOrder.status === 'deleted' ? (
                                <span className="bg-red-900/50 text-red-300 border border-red-500/30 px-3 py-1 rounded text-xs flex items-center gap-1">
                                    <Trash2 size={12}/> V KOŠI (Smazání za {getDaysUntilDelete(selectedOrder.deletedAt)} dní)
                                </span>
                            ) : (
                                <span className={`px-3 py-1 rounded text-xs border ${getStatusColor(selectedOrder.status)}`}>
                                    {getStatusLabel(selectedOrder.status)}
                                </span>
                            )}
                        </div>
                        <p className="text-slate-400 text-xs">Vytvořeno: {new Date(selectedOrder.date).toLocaleString('cs-CZ')}</p>
                     </div>
                     
                     <div className="flex flex-col items-end gap-2">
                         {/* Status Controls */}
                         {selectedOrder.status !== 'deleted' && (
                             <div className="flex gap-1 bg-slate-900 p-1 rounded border border-slate-700 mb-2">
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'new')} title="Nové" className={`p-1.5 rounded hover:bg-slate-700 ${selectedOrder.status === 'new' ? 'text-blue-400' : 'text-slate-500'}`}><CheckCircle size={16}/></button>
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'processing')} title="Pracuje se" className={`p-1.5 rounded hover:bg-slate-700 ${selectedOrder.status === 'processing' ? 'text-yellow-400' : 'text-slate-500'}`}><Clock size={16}/></button>
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'issue')} title="Chybí info" className={`p-1.5 rounded hover:bg-slate-700 ${selectedOrder.status === 'issue' ? 'text-orange-400' : 'text-slate-500'}`}><AlertTriangle size={16}/></button>
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'done')} title="Hotovo" className={`p-1.5 rounded hover:bg-slate-700 ${selectedOrder.status === 'done' ? 'text-green-400' : 'text-slate-500'}`}><CheckCircle size={16}/></button>
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')} title="Storno" className={`p-1.5 rounded hover:bg-slate-700 ${selectedOrder.status === 'cancelled' ? 'text-red-400' : 'text-slate-500'}`}><XCircle size={16}/></button>
                             </div>
                         )}

                         <div className="flex gap-2">
                            {selectedOrder.status === 'deleted' ? (
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'new')} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs flex items-center gap-2">
                                    <RotateCcw size={14}/> Obnovit
                                </button>
                            ) : (
                                <button onClick={() => handleStatusChange(selectedOrder.id, 'deleted')} className="bg-red-900/50 hover:bg-red-900 text-red-300 border border-red-900 px-3 py-1.5 rounded text-xs flex items-center gap-2">
                                    <Trash2 size={14}/> Do koše
                                </button>
                            )}
                            
                            {/* EXPORT BUTTON */}
                            <button 
                                onClick={() => handleExportZip(selectedOrder)} 
                                disabled={isExporting}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
                            >
                                {isExporting ? <RefreshCw className="animate-spin" size={14}/> : <FileArchive size={14}/>}
                                Export ZIP
                            </button>

                            <button onClick={() => downloadOrderJson(selectedOrder)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded text-xs flex items-center gap-2">
                                <Download size={14}/> JSON
                            </button>
                            <button onClick={() => setPrintMode(true)} className="bg-gold-600 hover:bg-gold-500 text-black font-bold px-3 py-1.5 rounded text-xs flex items-center gap-2 shadow-lg shadow-gold-600/20">
                                <Printer size={14}/> Tisk
                            </button>
                         </div>
                     </div>
                  </div>

                  {/* Detail Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {/* Customer Info */}
                      <div className="grid grid-cols-2 gap-6">
                         <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
                            <h3 className="text-gold-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2"><User size={14}/> Zákazník</h3>
                            <p className="font-bold text-lg text-white">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                            <div className="space-y-1 mt-2 text-sm text-slate-300">
                                <p>{selectedOrder.customer.email}</p>
                                <p>{selectedOrder.customer.phone}</p>
                            </div>
                         </div>
                         <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700">
                            <h3 className="text-gold-500 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2"><Package size={14}/> Doručení</h3>
                            <p className="text-white">{selectedOrder.customer.street}</p>
                            <p className="text-white">{selectedOrder.customer.city}, {selectedOrder.customer.zip}</p>
                            <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center text-sm">
                               <span className="text-slate-400">Metoda:</span>
                               <span className="font-bold text-white uppercase">{selectedOrder.customer.deliveryMethod}</span>
                            </div>
                         </div>
                      </div>

                      {/* Back Design */}
                      <div className="bg-slate-900/30 rounded-xl border border-slate-700 p-6">
                         <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <ImageIcon size={16} className="text-gold-500"/> Zadní Strana (Rub)
                         </h3>
                         <div className="flex gap-8 items-center">
                            <div className="w-32 shadow-lg">
                               <CardPreview 
                                    backConfig={selectedOrder.backConfig} 
                                    side='back'
                                    card={selectedOrder.deck[0]} 
                                    className="pointer-events-none" 
                               />
                            </div>
                            <div>
                                 <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Vlastní text</p>
                                 <p className="text-white font-serif italic text-lg border-l-2 border-gold-500 pl-4">
                                     {selectedOrder.backConfig.customText || <span className="text-slate-600 not-italic">Bez textu</span>}
                                 </p>
                            </div>
                         </div>
                      </div>

                      {/* Deck Grid */}
                      <div>
                         <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                            <ImageIcon size={16} className="text-gold-500"/>
                            Karty ({selectedOrder.deck.length} ks)
                         </h3>
                         <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                            {selectedOrder.deck.map((card) => (
                               <div key={card.id} className="relative group">
                                  <CardPreview card={card} className="pointer-events-none shadow-sm" />
                                  <div className="mt-1 text-center">
                                     <span className="text-[10px] text-slate-500 block">{card.rank} {card.suit}</span>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                  </div>
               </div>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-600 flex-col gap-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
                      <Package size={32} className="opacity-20"/>
                  </div>
                  <p>Vyberte objednávku ze seznamu</p>
               </div>
             )}
          </div>

      </div>
    </div>
  );
};

export default AdminDashboard;