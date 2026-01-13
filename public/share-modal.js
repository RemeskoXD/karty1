/**
 * Safe Share Modal Script - Defensive Version
 */
(function() {
    function initShareModal() {
        const modalId = 'share-modal';
        const modal = document.getElementById(modalId);

        // Pokud modal neexistuje, nic neděláme a končíme.
        if (!modal) return;

        function openModal() {
            modal.style.display = 'flex';
        }

        function closeModal() {
            modal.style.display = 'none';
        }

        // 1. Otevírací tlačítka
        const triggerBtns = document.querySelectorAll('[data-trigger="share-modal"], #open-share-btn');
        if (triggerBtns.length > 0) {
            triggerBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    openModal();
                });
            });
        }

        // 2. Zavírací tlačítko
        const closeBtn = modal.querySelector('.close-modal, #close-share-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                closeModal();
            });
        }

        // 3. Kliknutí mimo (pozadí)
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });

        // 4. Klávesa ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.style.display !== 'none') {
                closeModal();
            }
        });
    }

    // Spustíme až když je DOM připraven
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShareModal);
    } else {
        initShareModal();
    }
})();