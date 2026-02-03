/* =========================
   SKIFProtect – UI Script
   Только UI / Events / UX
   ========================= */

document.addEventListener('DOMContentLoaded', () => {

    /* ========= ELEMENTS ========= */
    const inputEditor   = document.getElementById('inputCode');
    const outputEditor  = document.getElementById('outputCode');

    const btnObfuscate  = document.getElementById('btnObfuscate');
    const btnCopy       = document.getElementById('btnCopy');
    const btnClear      = document.getElementById('btnClear');
    const btnReset      = document.getElementById('btnReset');

    const toast         = document.getElementById('toast');

    if (!inputEditor || !outputEditor || !btnObfuscate) {
        console.error('[SKIFProtect UI] Critical elements not found');
        return;
    }

    /* ========= TOAST ========= */
    function showToast(message, isError = false) {
        toast.innerHTML = message;
        toast.style.background = isError ? '#7f1d1d' : '';
        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 2500);
    }

    /* ========= AUTO RESIZE ========= */
    function autoResize(el) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }

    inputEditor.addEventListener('input', () => autoResize(inputEditor));
    outputEditor.addEventListener('input', () => autoResize(outputEditor));

    /* ========= COLLECT OPTIONS ========= */
function collectOptions() {
    const domainInput = document.getElementById('optDomain')?.value || '';
    const domains = domainInput
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);
    
    // Убираем дубликаты
    const uniqueDomains = [...new Set(domains)];

    return {
        preset: document.getElementById('optPreset')?.value || 'default',
        target: document.getElementById('optTarget')?.value || 'browser',

        compact: !!document.getElementById('optCompact')?.checked,
        simplify: !!document.getElementById('optSimplify')?.checked,

        controlFlowFlattening: !!document.getElementById('optControlFlow')?.checked,
        deadCodeInjection: !!document.getElementById('optDeadCode')?.checked,
        numbersToExpressions: !!document.getElementById('optNumbers')?.checked,
        unicodeEscapeSequence: !!document.getElementById('optUnicode')?.checked,

        selfDefending: !!document.getElementById('optSelfDefending')?.checked,
        debugProtection: !!document.getElementById('optDebug')?.checked,
        disableConsoleOutput: !!document.getElementById('optConsole')?.checked,

        domainLock: uniqueDomains, // массив строк, даже пустой []

        stringArray: !!document.getElementById('optStrArray')?.checked,
        splitStrings: !!document.getElementById('optSplit')?.checked
    };
}


    /* ========= OBFUSCATE ========= */
    btnObfuscate.addEventListener('click', async () => {
        const code = inputEditor.value.trim();

        if (!code) {
            showToast('Введите код для обфускации', true);
            return;
        }

        if (!window.SKIFProtect || typeof window.SKIFProtect.obfuscate !== 'function') {
            console.error('[SKIFProtect UI] API not found');
            showToast('SKIFProtect API не загружено', true);
            return;
        }

        btnObfuscate.disabled = true;
        btnObfuscate.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Обработка...';

        outputEditor.value = '';

        try {
            const options = collectOptions();
            const result = await window.SKIFProtect.obfuscate(code, options);

            outputEditor.value = result;
            autoResize(outputEditor);
            showToast('Код успешно защищён');
        } catch (err) {
            console.error(err);
            outputEditor.value = 'Ошибка обфускации:\n' + err.message;
            showToast('Ошибка обфускации', true);
        } finally {
            btnObfuscate.disabled = false;
            btnObfuscate.innerHTML =
                '<i class="fa-solid fa-shield-virus"></i> ОБФУСЦИРОВАТЬ';
        }
    });

    /* ========= COPY ========= */
    btnCopy?.addEventListener('click', async () => {
        if (!outputEditor.value) {
            showToast('Нечего копировать', true);
            return;
        }

        await navigator.clipboard.writeText(outputEditor.value);
        showToast('Результат скопирован');
    });

    /* ========= CLEAR ========= */
    btnClear?.addEventListener('click', () => {
        inputEditor.value = '';
        outputEditor.value = '';
        autoResize(inputEditor);
        showToast('Поле очищено');
    });

    /* ========= RESET ========= */
    btnReset?.addEventListener('click', () => {
        document.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
        document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
        document.querySelectorAll('input[type="text"]').forEach(i => i.value = '');

        showToast('Настройки сброшены');
    });

});
