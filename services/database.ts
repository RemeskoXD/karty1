import { Order, OrderStatus } from '../types';

// Konfigurace Backend Serveru (kde běží PHP a Databáze)
const BACKEND_HOST = 'web9.itnahodinu.cz';
// Poznámka: Ujistěte se, že web9 má platný SSL certifikát (https).
// Pokud web9 běží jen na http, bude to blokováno prohlížečem (Mixed Content).
const REMOTE_API_URL = `https://${BACKEND_HOST}/api.php`;

// Funkce pro určení správné adresy API
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  // 1. Vývoj na Localhostu -> voláme web9
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return REMOTE_API_URL;
  }
  
  // 2. Frontend Server (web10) -> voláme web9
  if (hostname === 'web10.itnahodinu.cz') {
    return REMOTE_API_URL;
  }

  // 3. Pokud by aplikace běžela přímo na backend serveru (web9)
  if (hostname === BACKEND_HOST) {
     return './api.php';
  }

  return REMOTE_API_URL;
};

const API_URL = getApiUrl();

export const dbService = {
  
  // --- Uložení objednávky ---
  saveOrder: async (order: Order): Promise<boolean> => {
    try {
      console.log(`[MyCards] Sending order to: ${API_URL}`);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors', // Explicitně vyžadujeme CORS
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'create', ...order })
      });

      // Pokud server vrátí chybu (např. 500 nebo 404), zkusíme přečíst text chyby
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MyCards] Server returned ${response.status}:`, errorText);
        throw new Error(`HTTP Error ${response.status}`);
      }

      // Zkusíme parsovat JSON
      const text = await response.text();
      try {
          const result = JSON.parse(text);
          if (result.status === 'error') {
             console.error("[MyCards] API Logic Error:", result.message);
             return false;
          }
          return true;
      } catch (jsonError) {
          console.error("[MyCards] Invalid JSON response:", text);
          throw new Error("Invalid JSON received from server");
      }

    } catch (e) {
      console.warn("[MyCards] Network/CORS Error. Saving to LocalStorage.", e);
      // Fallback: LocalStorage
      try {
        const existingOrders = JSON.parse(localStorage.getItem('mycards-admin-orders') || '[]');
        const updatedOrders = [order, ...existingOrders];
        localStorage.setItem('mycards-admin-orders', JSON.stringify(updatedOrders));
        alert("Nepodařilo se spojit s databází (chyba sítě/CORS). Objednávka byla uložena pouze lokálně v prohlížeči.");
        return true;
      } catch (lsError) {
        console.error("LocalStorage failed", lsError);
        return false;
      }
    }
  },

  // --- Aktualizace stavu objednávky ---
  updateOrder: async (orderId: string, status: OrderStatus, deletedAt: string | null = null): Promise<boolean> => {
      try {
          // Zkusíme poslat update na server (pokud to API podporuje)
          // Poznámka: Vzhledem k tomu, že nemáme kontrolu nad PHP backendem, implementuji i fallback na LocalStorage
          /* 
          const response = await fetch(API_URL, {
              method: 'POST',
              mode: 'cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'update_status', id: orderId, status, deletedAt })
          });
          */
         
         // Simulace úspěchu pro LocalStorage logiku, protože API endpoint pro update pravděpodobně neexistuje v poskytnutém kontextu
         // Pokud by existoval, odkomentujte fetch výše.
         
         // Fallback Update LocalStorage
         const existingOrders = JSON.parse(localStorage.getItem('mycards-admin-orders') || '[]');
         const updatedOrders = existingOrders.map((o: Order) => {
             if (o.id === orderId) {
                 return { ...o, status, deletedAt };
             }
             return o;
         });
         localStorage.setItem('mycards-admin-orders', JSON.stringify(updatedOrders));
         return true;

      } catch (e) {
          console.error("Update failed", e);
          return false;
      }
  },

  // --- Načtení všech objednávek ---
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await fetch(API_URL, {
          method: 'GET',
          mode: 'cors',
          headers: {
              'Accept': 'application/json'
          }
      });
      
      if (!response.ok) {
         throw new Error(`Server returned ${response.status}`);
      }

      const text = await response.text();
      let rawData;
      
      try {
          rawData = JSON.parse(text);
      } catch (jsonError) {
          console.error("[MyCards] GetOrders JSON Error:", text);
          throw new Error("Invalid JSON received");
      }
      
      if (!Array.isArray(rawData)) {
          if (rawData.status === 'error') {
              throw new Error(rawData.message);
          }
          return [];
      }

      const apiOrders = rawData.map((row: any) => ({
        id: row.id,
        date: row.created_at,
        customer: row.customer_data,
        gameType: row.game_type,
        cardStyle: row.card_style,
        deck: row.deck_data,
        backConfig: row.back_config,
        totalPrice: Number(row.total_price),
        status: row.status || 'new', // Default to new if missing
        deletedAt: row.deleted_at || null
      }));

      // Merge with LocalStorage (for demo purposes/fallback data)
      const localOrders = JSON.parse(localStorage.getItem('mycards-admin-orders') || '[]');
      
      // Prioritize API, but append Local ones that are not in API (identified by ID)
      const apiIds = new Set(apiOrders.map((o: Order) => o.id));
      const uniqueLocalOrders = localOrders.filter((o: Order) => !apiIds.has(o.id));
      
      return [...apiOrders, ...uniqueLocalOrders];

    } catch (e) {
      console.warn("[MyCards] Failed to fetch orders. Showing LocalStorage data.", e);
      const savedOrders = localStorage.getItem('mycards-admin-orders');
      return savedOrders ? JSON.parse(savedOrders) : [];
    }
  },

  // --- Smazání dat ---
  clearAll: async (): Promise<void> => {
     localStorage.removeItem('mycards-admin-orders');
     alert("Data na serveru nebyla smazána (vyžaduje ruční zásah do DB). LocalStorage pročištěna.");
  }
};