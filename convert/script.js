const categories = {
    data: {
        // Deep Blue
        color: '#3B82F6', 
        glow: 'rgba(59, 130, 246, 0.4)',
        units: { 'B': 1, 'KB': 1000, 'MB': 1e6, 'GB': 1e9, 'TB': 1e12, 'KiB': 1024, 'MiB': 1048576, 'GiB': 1073741824 },
        labels: { 'B': 'Байт', 'KB': 'КБ (1000)', 'MB': 'МБ (1000)', 'GB': 'ГБ (1000)', 'TB': 'ТБ (1000)', 'KiB': 'КиБ (1024)', 'MiB': 'МиБ (1024)', 'GiB': 'ГиБ (1024)' }
    },
    time: {
        // Neon Purple
        color: '#A855F7', 
        glow: 'rgba(168, 85, 247, 0.4)',
        units: { 's': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800, 'mo': 2629743, 'y': 31556926 },
        labels: { 's': 'Секунд', 'm': 'Минут', 'h': 'Часов', 'd': 'Суток', 'w': 'Недель', 'mo': 'Месяцев', 'y': 'Лет' }
    },
    length: {
        // Cyan / Teal
        color: '#06B6D4',
        glow: 'rgba(6, 182, 212, 0.4)',
        units: { 'mm': 0.001, 'cm': 0.01, 'm': 1, 'km': 1000, 'in': 0.0254, 'ft': 0.3048 },
        labels: { 'mm': 'Миллиметров', 'cm': 'Сантиметров', 'm': 'Метров', 'km': 'Километров', 'in': 'Дюймов', 'ft': 'Футов' }
    },
    weight: {
        // Amber / Gold
        color: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.4)',
        units: { 'g': 1, 'kg': 1000, 't': 1e6, 'lb': 453.59, 'oz': 28.34 },
        labels: { 'g': 'Грамм', 'kg': 'Килограмм', 't': 'Тонн', 'lb': 'Фунтов', 'oz': 'Унций' }
    }
};

let currentCat = 'data';

function changeCategory(cat, el) {
    currentCat = cat;
    
    // UI Update (Tabs)
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');

    // Update CSS Variables (Dynamic Theming)
    const root = document.documentElement;
    root.style.setProperty('--accent', categories[cat].color);
    root.style.setProperty('--accent-glow', categories[cat].glow);

    // Update Dropdowns
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    
    // Save previous selection if possible
    const prevFrom = from.value; 
    const prevTo = to.value;

    from.innerHTML = ''; 
    to.innerHTML = '';

    Object.keys(categories[cat].units).forEach(u => {
        const name = categories[cat].labels[u];
        from.options.add(new Option(name, u));
        to.options.add(new Option(name, u));
    });

    // Try to restore selection or set defaults
    if (categories[cat].units[prevFrom]) from.value = prevFrom;
    if (categories[cat].units[prevTo]) to.value = prevTo;

    // Recalculate
    calculate();
}

function calculate() {
    const inputEl = document.getElementById('input-val');
    const val = parseFloat(inputEl.value);
    
    const resValueEl = document.getElementById('res-val');
    const resUnitEl = document.getElementById('res-unit-label');

    if (isNaN(val)) {
        resValueEl.innerText = '0';
        resUnitEl.innerText = '...';
        return;
    }

    const from = document.getElementById('unit-from').value;
    const to = document.getElementById('unit-to').value;

    // Conversion Logic
    const base = val * categories[currentCat].units[from];
    const res = base / categories[currentCat].units[to];

    // Smart Formatting
    let displayVal;
    if (res === 0) displayVal = 0;
    else if (Math.abs(res) < 0.0001 || Math.abs(res) > 1e9) {
        displayVal = res.toExponential(4);
    } else {
        // Remove trailing zeros
        displayVal = parseFloat(res.toFixed(4));
    }
    
    resValueEl.innerText = displayVal;
    resUnitEl.innerText = categories[currentCat].labels[to];
}

function swapUnits() {
    const from = document.getElementById('unit-from');
    const to = document.getElementById('unit-to');
    
    const temp = from.value;
    from.value = to.value;
    to.value = temp;

    // Add nice rotation animation
    const btn = document.querySelector('.swap-btn i');
    btn.style.transition = 'transform 0.4s';
    btn.style.transform = 'rotate(180deg)'; // Just a trigger
    setTimeout(() => { btn.style.transform = 'rotate(90deg)'; }, 400);

    calculate();
}

function copyResult() {
    const text = document.getElementById('res-val').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    changeCategory('data', document.querySelector('.nav-item'));
});