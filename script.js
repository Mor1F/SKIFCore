document.addEventListener('DOMContentLoaded', () => {
    // Часы в хедере (если нужно будет)
    
    // === 3D TILT EFFECT ===
    const cards = document.querySelectorAll('.glass-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Для градиента (свет следует за мышкой)
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            // Математика наклона
            // Центр карточки
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Отклонение от центра
            const rotateX = ((y - centerY) / centerY) * -8; // -8 град макс наклон
            const rotateY = ((x - centerX) / centerX) * 8; 

            // Применяем трансформацию
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        // Сброс при уходе мыши
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });

    // === PARALLAX BACKGROUND ===
    document.addEventListener('mousemove', (e) => {
        const blobs = document.querySelectorAll('.blob');
        blobs.forEach((blob, index) => {
            const speed = (index + 1) * 20;
            const x = (window.innerWidth - e.pageX * speed) / 100;
            const y = (window.innerHeight - e.pageY * speed) / 100;
            blob.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
});

/* 
    SKIF PROTECT 2.2 (Aggressive Core)
    Integrates with SKIF Ecosystem
*/

(function() {
    'use strict';

    // === 1. СТИЛИ ===
    const style = document.createElement('style');
    style.innerHTML = `
        body {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }
        
        input, textarea, .selectable, .code-box, .code-wrapper {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }

        .skif-security-toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(220, 38, 38, 0.95);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: white;
            padding: 10px 24px;
            border-radius: 50px;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 10px 40px rgba(220, 38, 38, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.2);
            z-index: 2147483647; /* Максимальный Z-index */
            opacity: 0;
            transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
        }
        
        .skif-security-toast.active {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // === 2. UI ===
    const toast = document.createElement('div');
    toast.className = 'skif-security-toast';
    toast.innerHTML = `<span>SKIF Protect: Доступ запрещен</span>`;
    document.body.appendChild(toast);

    let toastTimer;
    const showSecurityAlert = () => {
        toast.classList.add('active');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('active');
        }, 2000);
    };

    // === 3. БЛОКИРОВКИ ===

    window.addEventListener('contextmenu', e => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);

    window.addEventListener('dragstart', e => {
        e.preventDefault();
    }, true);

    window.addEventListener('keydown', e => {
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.keyCode;
		
        if (key === 123) {
            triggerBlock(e);
            return false;
        }

        if (ctrl) {
            if (key === 85 || key === 83 || key === 80) {
                triggerBlock(e);
                return false;
            }

            if (shift && (key === 73 || key === 74 || key === 67)) {
                triggerBlock(e);
                return false;
            }
        }
    }, true);

    function triggerBlock(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showSecurityAlert();
    }

    // === 4. АНТИ-ДЕБАГГЕР (Защита от консоли) ===
    setInterval(function() {
        const before = new Date().getTime();
        debugger; 
        const after = new Date().getTime();
        if (after - before > 100) {
            document.body.innerHTML = 'SKIF SECURITY: Access Denied';
            window.location.href = "about:blank";
        }
    }, 1000);

})();