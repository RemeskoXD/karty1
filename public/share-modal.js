/**
 * Safe Share Modal Script
 * Tento skript obsahuje kontrolu existence prvků, aby nedocházelo k chybám,
 * pokud se skript načte na stránce, kde modální okno není (např. v administraci).
 */

(function() {
    // Spustíme až po načtení celého DOMu
    document.addEventListener('DOMContentLoaded', function() {
        
        // ID prvků, které hledáme
        const modalId = 'share-modal';
        const openBtnSelectors = ['[data-trigger="share-modal"]', '#open-share-btn'];
        const closeBtnSelector = '.close-modal, #close-share-btn';

        const modal = document.getElementById(modalId);

        // --- HLAVNÍ BEZPEČNOSTNÍ POJISTKA ---
        // Pokud na této stránce neexistuje element modálního okna, skript okamžitě skončí.
        // Tím se zabrání chybě "Cannot read properties of null".
        if (!modal) {
            // console.log('Share modal element not found on this page - skipping initialization.');
            return;
        }

        // Funkce pro otevření
        function openModal() {
            if (modal) modal.style.display = 'flex'; // nebo 'block' podle CSS
        }

        // Funkce pro zavření
        function closeModal() {
            if (modal) modal.style.display = 'none';
        }

        // Připojení event listenerů na otevírací tlačítka (může jich být víc)
        openBtnSelectors.forEach(selector => {
            const btns = document.querySelectorAll(selector);
            btns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    openModal();
                });
            });
        });

        // Připojení event listeneru na zavírací tlačítko
        const closeBtn = modal.querySelector(closeBtnSelector);
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeModal();
            });
        }

        // Zavření kliknutím mimo obsah okna (na pozadí)
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Zavření klávesou ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    });
})();