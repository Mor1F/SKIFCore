// --- LOGIC ---

function updateLengthVal() {
    const val = document.getElementById('length').value;
    document.getElementById('length-val').innerText = val;
    generatePassword(); // Авто-генерация при слайде
}

function generatePassword() {
    const length = parseInt(document.getElementById('length').value);
    
    // Checkboxes
    const useLower = document.getElementById('lowercase').checked;
    const useUpper = document.getElementById('uppercase').checked;
    const useNumbers = document.getElementById('numbers').checked;
    const useSpecial = document.getElementById('special').checked;
    const excludeAmbiguous = document.getElementById('ambiguous').checked;
    const keyword = document.getElementById('keyword').value.trim();

    // Charsets
    let lower = 'abcdefghijklmnopqrstuvwxyz';
    let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numbers = '0123456789';
    let special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    // Ambiguous filtering
    if (excludeAmbiguous) {
        lower = lower.replace(/[lo]/g, '');
        upper = upper.replace(/[IO]/g, '');
        numbers = numbers.replace(/[10]/g, '');
        special = special.replace(/[|:;.,]/g, ''); // Filter visually confusing symbols too
    }

    let pool = '';
    if (useLower) pool += lower;
    if (useUpper) pool += upper;
    if (useNumbers) pool += numbers;
    if (useSpecial) pool += special;

    if (!pool) {
        showToast('⚠️ Выберите хотя бы один тип!');
        return;
    }

    let password = keyword; // Start with keyword if present
    const remainingLength = length - password.length;

    if (remainingLength > 0) {
        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            password += pool[randomIndex];
        }
    } else {
        // If keyword is longer than length, truncate (optional, or just leave it)
        // password = password.substring(0, length); 
    }
    
    // Если нет ключевого слова, перемешаем, чтобы типы символов были везде
    // (Но если есть keyword, лучше оставить его в начале)
    if (!keyword) {
        // Simple shuffle for randomness
        password = password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    // Set Value
    const output = document.getElementById('password');
    output.value = password;
    
    // Animation trigger
    output.style.color = 'var(--accent)';
    setTimeout(() => output.style.color = 'var(--text-primary)', 200);

    checkStrength(password);
}

function checkStrength(password) {
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let width = 0;
    let color = '#EF4444'; // Red
    let label = 'Слабый';

    if (score < 3) {
        width = 30;
        color = '#EF4444';
        label = 'Слабый';
    } else if (score < 5) {
        width = 60;
        color = '#F59E0B'; // Orange/Yellow
        label = 'Средний';
    } else {
        width = 100;
        color = '#10B981'; // Green
        label = 'Надежный';
    }

    bar.style.width = width + '%';
    bar.style.backgroundColor = color;
    text.innerText = label;
    text.style.color = color;
}

function copyPassword() {
    const output = document.getElementById('password');
    if(!output.value) return;

    navigator.clipboard.writeText(output.value).then(() => {
        showToast('Пароль скопирован');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    generatePassword();
});