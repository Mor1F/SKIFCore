/* =========================
   SKIFProtect – Obfuscation API
   ========================= */

/**
 * Требования:
 * - JavaScriptObfuscator должен быть подключён глобально
 *   (через <script src="javascript-obfuscator.browser.js"></script>)
 */

(function () {

    if (typeof JavaScriptObfuscator === 'undefined') {
        console.error('[SKIFProtect] JavaScriptObfuscator не найден');
        return;
    }

    /* ========= PRESETS ========= */
    const PRESETS = {
        low: {
            compact: true,
            controlFlowFlattening: false,
            deadCodeInjection: false,
            stringArray: true,
            stringArrayThreshold: 0.5
        },

        medium: {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.5,
            deadCodeInjection: false,
            stringArray: true,
            stringArrayThreshold: 0.75,
            identifierNamesGenerator: 'hexadecimal'
        },

        high: {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            stringArray: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 1,
            identifierNamesGenerator: 'hexadecimal',
            renameGlobals: false
        }
    };

    /* ========= CORE ========= */
    function obfuscate(code, userOptions = {}) {
        return new Promise((resolve, reject) => {
            try {
                let options = {};

                /* === preset === */
                if (userOptions.preset && PRESETS[userOptions.preset]) {
                    options = { ...PRESETS[userOptions.preset] };
                }

                /* === manual overrides === */
                Object.keys(userOptions).forEach(key => {
                    if (key !== 'preset') {
                        options[key] = normalizeValue(userOptions[key]);
                    }
                });

                const result = JavaScriptObfuscator.obfuscate(code, options);

                resolve(result.getObfuscatedCode());

            } catch (err) {
                reject(err);
            }
        });
    }

    /* ========= HELPERS ========= */
    function normalizeValue(value) {
        if (value === 'true') return true;
        if (value === 'false') return false;

        if (!isNaN(value) && value !== '') {
            return Number(value);
        }

        return value;
    }

    /* ========= PUBLIC API ========= */
    window.SKIFProtect = {
        version: '1.0.0',
        presets: Object.keys(PRESETS),
        obfuscate
    };

})();
