// js/lock.js — Toegangsbeveiliging (URL-code + pincode via presenter)
(function() {
    const UNLOCK_KEY = 'biljartAppUnlocked';
    const URL_CODE = 'OPENSESAME';   // ⚙️ pas aan: de geheime URL-parameter
    const PIN_CODE = '7931';           // ⚙️ pas aan: de pincode voor het vangnet

    // 1. Al ontgrendeld op dit toestel? Niets doen.
    if (localStorage.getItem(UNLOCK_KEY) === 'yes') return;

    // 2. Geopend met de juiste URL-code? Ontgrendel permanent.
    const params = new URLSearchParams(window.location.search);
    if (params.get('code') === URL_CODE) {
        localStorage.setItem(UNLOCK_KEY, 'yes');
        return;
    }

    // 3. Anders: slotscherm tonen zodra de pagina geladen is.
    let pinInput = '';
    let digitIndex = 0;

    function renderDigits() {
        const container = document.getElementById('lockDigits');
        if (!container) return;
        container.innerHTML = '';
        for (let d = 0; d <= 9; d++) {
            const btn = document.createElement('button');
            btn.textContent = d;
            btn.style.cssText = 'width:60px;height:60px;font-size:1.6rem;font-weight:900;border-radius:12px;border:3px solid ' +
                (d === digitIndex ? '#00d2d3' : '#34495e') + ';background:' +
                (d === digitIndex ? '#00d2d3' : '#2c3e50') + ';color:' +
                (d === digitIndex ? '#1a1a2e' : '#fff') + ';cursor:pointer;';
            btn.onclick = () => { digitIndex = d; addDigit(); };
            container.appendChild(btn);
        }
        const disp = document.getElementById('lockPinDisplay');
        if (disp) disp.textContent = '●'.repeat(pinInput.length) + '_'.repeat(Math.max(0, PIN_CODE.length - pinInput.length));
    }

    function addDigit() {
        pinInput += String(digitIndex);
        document.getElementById('lockError').textContent = '';
        if (pinInput.length >= PIN_CODE.length) {
            if (pinInput === PIN_CODE) {
                localStorage.setItem(UNLOCK_KEY, 'yes');
                document.getElementById('lockScreen').style.display = 'none';
                window.location.reload(); // schone start met ontgrendelde app
            } else {
                pinInput = '';
                document.getElementById('lockError').textContent = '❌ Foute code, probeer opnieuw';
            }
        }
        renderDigits();
    }

    function onLockKeydown(e) {
        const lock = document.getElementById('lockScreen');
        if (!lock || lock.style.display === 'none') return;
        if (e.key === 'PageUp' || e.key === 'ArrowUp') {
            e.preventDefault(); e.stopImmediatePropagation();
            digitIndex = (digitIndex + 1) % 10; renderDigits();
        } else if (e.key === 'PageDown' || e.key === 'ArrowDown') {
            e.preventDefault(); e.stopImmediatePropagation();
            digitIndex = (digitIndex - 1 + 10) % 10; renderDigits();
        } else if (e.key === 'Tab') {
            e.preventDefault(); e.stopImmediatePropagation();
            addDigit();
        } else if (e.key >= '0' && e.key <= '9') {
            e.preventDefault(); e.stopImmediatePropagation();
            digitIndex = parseInt(e.key); addDigit();
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        const lock = document.getElementById('lockScreen');
        if (lock) { lock.style.display = 'flex'; renderDigits(); }
        // capture-fase: onderschept toetsen vóór de presenter-controls van de app
        document.addEventListener('keydown', onLockKeydown, true);
    });
})();
