/**
 * Safe Share Modal Script - Defensive Version
 */
(function() {
    function initShareModal() {
        try {
            const modalId = 'share-modal';
            const modal = document.getElementById(modalId);

            if (!modal) return;

            function openModal() {
                if(modal) modal.style.display = 'flex';
            }

            function closeModal() {
                if(modal) modal.style.display = 'none';
            }

            // 1. Otevírací tlačítka
            const triggerBtns = document.querySelectorAll('[data-trigger="share-modal"], #open-share-btn');
            if (triggerBtns) {
                Array.from(triggerBtns).forEach(function(btn) {
                    if (btn) {
                        btn.addEventListener('click', function(e) {
                            e.preventDefault();
                            openModal();
                        });
                    }
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

            // 3. Kliknutí mimo
            window.addEventListener('click', function(event) {
                if (event.target === modal) {
                    closeModal();
                }
            });

            // 4. ESC
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && modal && modal.style.display !== 'none') {
                    closeModal();
                }
            });
        } catch(e) {
            console.warn("Share Modal script suppressed error:", e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShareModal);
    } else {
        initShareModal();
    }
})();