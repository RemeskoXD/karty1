import { Order } from '../types';

// Konfigurace Backend Serveru (kde běží PHP a Databáze)
const BACKEND_HOST = 'web9.itnahodinu.cz';
const REMOTE_API_URL = `https://${BACKEND_HOST}/api.php`;

// Funkce pro určení správné adresy API
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  // 1. Vývoj na Localhostu -> voláme web9
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log(`[MyCards] Dev Mode: Connecting to remote API at ${REMOTE_API_URL}`);
    return REMOTE_API_URL;
  }
  
  // 2. Frontend Server (web10) -> voláme web9
  // Toto je váš nový případ: Aplikace běží na web10, ale data jsou na web9
  if (hostname === 'web10.itnahodinu.cz') {
    console.log(`[MyCards] Frontend Mode (web10): Connecting to backend at ${REMOTE_API_URL}`);
    return REMOTE_API_URL;
  }

  // 3. Pokud by aplikace běžela přímo na backend serveru (web9), použijeme relativní cestu
  // To je nejrychlejší a nejbezpečnější, pokud jsou na stejném stroji
  if (hostname === BACKEND_HOST) {
     return './api.php';
  }

  // 4. Fallback pro jakoukoli jinou doménu -> voláme web9
  return REMOTE_API_URL;
};

const API_URL = getApiUrl();

export const dbService = {
  
  // --- Uložení objednávky ---
  saveOrder: async (order: Order): Promise<boolean> => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error (${response.status}):`, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'error') {
         console.error("API Error:", result.message);
         return false;
      }

      return true;
    } catch (e) {
      console.warn("Failed to save to server (CORS or Network Error). Falling back to LocalStorage.", e);
      // Fallback: LocalStorage
      try {
        const existingOrders = JSON.parse(localStorage.getItem('mycards-admin-orders') || '[]');
        const updatedOrders = [order, ...existingOrders];
        localStorage.setItem('mycards-admin-orders', JSON.stringify(updatedOrders));
        alert("Pozor: Spojení se serverem web9 selhalo (pravděpodobně CORS). Objednávka byla uložena pouze lokálně do prohlížeče.");
        return true;
      } catch (lsError) {
        console.error("LocalStorage failed", lsError);
        return false;
      }
    }
  },

  // --- Načtení všech objednávek ---
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await fetch(API_URL);
      
      if (!response.ok) {
         throw new Error('Server not reachable');
      }

      const rawData = await response.json();
      
      if (!Array.isArray(rawData)) {
          if (rawData.status === 'error') {
              throw new Error(rawData.message);
          }
          return [];
      }

      return rawData.map((row: any) => ({
        id: row.id,
        date: row.created_at,
        customer: row.customer_data,
        gameType: row.game_type,
        cardStyle: row.card_style,
        deck: row.deck_data,
        backConfig: row.back_config,
        totalPrice: Number(row.total_price),
        status: row.status
      }));

    } catch (e) {
      console.warn("Failed to fetch from API. Showing LocalStorage data instead.", e);
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