// === КОНФИГУРАЦИЯ ===
const API_URL = 'api.php';
const INACTIVITY_LIMIT = 10 * 60 * 1000;

// State
let state = {
    categories: [],
    items: [],
    theme: 'dark',
    activeCat: 'all',
    expanded: []
};

const initData = {
    categories: [
        { id: 'all', name: 'Все', icon: 'fa-solid fa-layer-group', parent: null },
        { id: 'dev', name: 'DevOps', icon: 'fa-solid fa-server', parent: null }
    ],
    items: [],
    activeCat: 'all',
    expanded: [],
    theme: 'dark'
};

let masterKey = null;
let timer;
let isSortMode = false;

document.addEventListener('DOMContentLoaded', () => {
    checkServer();
    ['mousemove','keypress','click'].forEach(e => document.addEventListener(e, resetTimer));
    document.getElementById('pinInput').addEventListener('keydown', e => { if(e.key==='Enter') actionLogin(); });
    document.getElementById('searchInput').addEventListener('input', renderItems);
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(e.target.id); });
    });
});

function actionLogin() {
    if(document.getElementById('loginForm').style.display !== 'none') unlockVault();
    else initVaultOnServer();
}

// === SERVER ===
async function checkServer() {
    try {
        const res = await fetch(`${API_URL}?act=check`);
        const json = await res.json();
        if (json.exists) showLoginUI();
        else showRegisterUI();
    } catch { 
        document.getElementById('lockMessage').innerText = "Ошибка API"; 
        document.getElementById('lockMessage').style.color = "red";
    }
}

function showLoginUI() {
    document.getElementById('lockTitle').innerText = "Вход";
    document.getElementById('lockMessage').innerText = "Введите мастер-пароль";
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('setupForm').style.display = 'none';
}

function showRegisterUI() {
    document.getElementById('lockTitle').innerText = "Создание";
    document.getElementById('lockMessage').innerText = "Новая база данных";
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('setupForm').style.display = 'block';
}

async function initVaultOnServer() {
    const pass = document.getElementById('setupPass').value;
    const phrase = document.getElementById('setupPhrase').value;
    if (!pass || !phrase) return alert("Заполните поля");

    const enc = CryptoJS.AES.encrypt(JSON.stringify(initData), pass).toString();
    const res = await fetch(`${API_URL}?act=init`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: pass, resetPhrase: phrase, data: enc })
    });

    if ((await res.json()).status === 'ok') {
        masterKey = pass; state = JSON.parse(JSON.stringify(initData));
        unlockUI(); renderTree(); renderItems();
    }
}

async function unlockVault() {
    const pin = document.getElementById('pinInput').value;
    if(!pin) return;

    const res = await fetch(`${API_URL}?act=load`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ password: pin })
    });
    const json = await res.json();

    if (json.status === 'ok') {
        try {
            const bytes = CryptoJS.AES.decrypt(json.data, pin);
            state = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
            masterKey = pin;
            unlockUI(); renderTree(); renderItems();
        } catch { alert("Ошибка расшифровки"); }
    } else {
        const inp = document.getElementById('pinInput');
        inp.style.borderColor = 'red';
        setTimeout(()=>inp.style.borderColor='', 500);
    }
}

async function save() {
    if(!masterKey) return;
    const enc = CryptoJS.AES.encrypt(JSON.stringify(state), masterKey).toString();
    fetch(`${API_URL}?act=save`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: enc })
    });
}

async function promptReset() {
    const phrase = prompt("Введите фразу сброса:");
    if (!phrase) return;
    const res = await fetch(`${API_URL}?act=reset`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ phrase })
    });
    if ((await res.json()).status === 'ok') location.reload();
    else alert("Неверная фраза");
}

function unlockUI() {
    document.body.classList.remove('locked');
    document.getElementById('pinInput').value = '';
    resetTimer();
}

function lockVault() {
    document.body.classList.add('locked');
    masterKey = null; state = {categories:[], items:[]};
    showLoginUI();
}

function resetTimer() {
    clearTimeout(timer);
    if(!document.body.classList.contains('locked')) timer = setTimeout(lockVault, INACTIVITY_LIMIT);
}

// === TREE RENDER ===
function renderTree() {
    const root = document.getElementById('categoryContainer');
    root.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'category-list root-list';
    state.categories.filter(c => !c.parent).forEach(cat => ul.appendChild(buildCatNode(cat)));
    root.appendChild(ul);
    if(isSortMode) initSortables();
}

function buildCatNode(cat) {
    const li = document.createElement('li');
    li.dataset.id = cat.id;
    
    // ЛОГИКА ИКОНКИ
    let iconHTML = '';
    if (cat.type === 'img') {
        // Если это SVG - используем маску для покраски
        if (cat.val.endsWith('.svg')) {
            iconHTML = `<div class="cat-icon-box"><div class="custom-svg-icon" style="-webkit-mask-image: url('img/${cat.val}'); mask-image: url('img/${cat.val}');"></div></div>`;
        } else {
            // Если PNG/JPG - просто картинка
            iconHTML = `<div class="cat-icon-box"><img src="img/${cat.val}" class="custom-img-icon" onerror="this.src='img/folder.png'"></div>`;
        }
    } else {
        // FontAwesome
        iconHTML = `<div class="cat-icon-box"><i class="${cat.val || 'fa-solid fa-folder'}"></i></div>`;
    }

    const children = state.categories.filter(c => c.parent === cat.id);
    const isExpanded = state.expanded.includes(cat.id);
    let arrow = (children.length > 0 || isSortMode) ? `<i class="fa-solid fa-chevron-right cat-arrow ${isExpanded ? 'rotated' : ''}"></i>` : '';

    const row = document.createElement('div');
    row.className = `cat-item ${state.activeCat === cat.id ? 'active' : ''}`;
    row.onclick = (e) => handleCatClick(cat, e);
    row.innerHTML = `${iconHTML}<span>${cat.name}</span>${arrow}
        <button class="btn-edit-cat" onclick="openCatModal('${cat.id}', event)"><i class="fa-solid fa-pen"></i></button>`;
    
    li.appendChild(row);

    if(children.length > 0 || isSortMode) {
        const subUl = document.createElement('ul');
        subUl.className = `nested-list ${isExpanded ? 'open' : ''}`;
        subUl.dataset.parent = cat.id;
        children.forEach(child => subUl.appendChild(buildCatNode(child)));
        li.appendChild(subUl);
    }
    return li;
}

function handleCatClick(cat, e) {
    if(e.target.closest('.btn-edit-cat')) return;
    const kids = state.categories.filter(c => c.parent === cat.id);
    if(kids.length > 0) {
        const idx = state.expanded.indexOf(cat.id);
        if(idx === -1) state.expanded.push(cat.id); else state.expanded.splice(idx, 1);
        save(); renderTree();
    }
    state.activeCat = cat.id;
    save(); renderTree(); renderItems();
}

function initSortables() {
    document.querySelectorAll('.category-list, .nested-list').forEach(ul => {
        new Sortable(ul, {
            group: 'nested', animation: 150, fallbackOnBody: true, swapThreshold: 0.65,
            onEnd: recalcStructure
        });
    });
}

function recalcStructure() {
    const newCats = [];
    const process = (ul, pid) => {
        Array.from(ul.children).forEach(li => {
            const c = state.categories.find(x => x.id === li.dataset.id);
            if(c) { c.parent = pid; newCats.push(c); const sub = li.querySelector('ul'); if(sub) process(sub, c.id); }
        });
    };
    const root = document.querySelector('.root-list');
    if(root) process(root, null);
    state.categories.forEach(c => { if(!newCats.find(n => n.id === c.id)) newCats.push(c); });
    state.categories = newCats;
    save();
}

function toggleSortMode() {
    isSortMode = !isSortMode;
    document.getElementById('btnSort').style.color = isSortMode ? 'var(--accent)' : 'inherit';
    renderTree();
}

// === ITEMS ===
function renderItems() {
    const grid = document.getElementById('itemsGrid');
    const term = document.getElementById('searchInput').value.toLowerCase();
    grid.innerHTML = '';

    if(!state.items) return;

    let targetIds = [state.activeCat];
    const getKids = (id) => state.categories.filter(c => c.parent === id).forEach(k => { targetIds.push(k.id); getKids(k.id); });
    getKids(state.activeCat);

    const filtered = state.items.filter(i => {
        const catOk = state.activeCat === 'all' || targetIds.includes(i.catId);
        const searchOk = i.title.toLowerCase().includes(term) || i.cmd.toLowerCase().includes(term);
        return catOk && searchOk;
    });

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">${item.title}</div>
                <div class="card-actions">
                    <button class="card-btn" onclick="openItemModal(${item.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="card-btn del" onclick="deleteItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="code-wrapper" onclick="copyCmd(${item.id})">${escapeStr(item.cmd)}<div class="copy-badge">Copy</div></div>
        `;
        grid.appendChild(card);
    });
}

// === CRUD ===
function openCatModal(id = null, e = null) {
    if(e) e.stopPropagation();
    const isEdit = !!id;
    document.getElementById('catModal').classList.add('active');
    document.getElementById('catModalTitle').innerText = isEdit ? 'Редактировать' : 'Новая категория';
    document.getElementById('editCatId').value = id || '';
    document.getElementById('btnDeleteCat').style.display = isEdit ? 'block' : 'none';

    const sel = document.getElementById('catParent');
    sel.innerHTML = '<option value="root">-- Корневой уровень --</option>';
    state.categories.forEach(c => { 
        // Нельзя выбрать самого себя или своих детей как родителя (защита от циклов)
        if(c.id !== id) sel.innerHTML += `<option value="${c.id}">${c.name}</option>` 
    });

    if(isEdit) {
        const c = state.categories.find(x => x.id === id);
        document.getElementById('catName').value = c.name;
        document.getElementById('catParent').value = c.parent || 'root';
        
        // Восстанавливаем тип иконки
        const iconType = c.type || 'icon'; // По умолчанию icon
        switchIconTab(iconType);
        
        if (iconType === 'icon') {
            document.getElementById('catIconClass').value = c.val || c.icon; // c.icon для совместимости со старыми данными
        } else {
            document.getElementById('catImgName').value = c.val;
        }
    } else {
        document.getElementById('catName').value = '';
        switchIconTab('icon');
    }
}

function saveCategory() {
    const id = document.getElementById('editCatId').value;
    const name = document.getElementById('catName').value;
    const parent = document.getElementById('catParent').value === 'root' ? null : document.getElementById('catParent').value;
    
    // Получаем данные иконки
    const type = document.getElementById('catIconType').value;
    let val = '';
    
    if (type === 'icon') {
        val = document.getElementById('catIconClass').value || 'fa-solid fa-folder';
    } else {
        val = document.getElementById('catImgName').value || 'folder.png';
    }

    if(!name) return;

    if(id) {
        const c = state.categories.find(x => x.id === id);
        c.name = name; 
        c.parent = parent; 
        c.type = type; // Сохраняем тип (icon/img)
        c.val = val;   // Сохраняем значение (класс или имя файла)
        // Удаляем старое поле icon, чтобы не путаться
        delete c.icon; 
    } else {
        state.categories.push({ 
            id: 'cat_' + Date.now(), 
            name, 
            parent, 
            type, 
            val 
        });
    }
    save(); closeModal('catModal'); renderTree();
}

function deleteCurrentCategory() {
    const id = document.getElementById('editCatId').value;
    if(confirm('Удалить категорию и содержимое?')) {
        const toDel = [id];
        const getKids = (pid) => state.categories.filter(c => c.parent === pid).forEach(k => { toDel.push(k.id); getKids(k.id); });
        getKids(id);
        state.categories = state.categories.filter(c => !toDel.includes(c.id));
        state.items = state.items.filter(i => !toDel.includes(i.catId));
        state.activeCat = 'all';
        save(); closeModal('catModal'); renderTree(); renderItems();
    }
}

function openItemModal(id=null) {
    document.getElementById('itemModal').classList.add('active');
    document.getElementById('editItemId').value = id || '';
    if(id) {
        const i = state.items.find(x => x.id === id);
        document.getElementById('itemTitle').value = i.title;
        document.getElementById('itemCommand').value = i.cmd;
    } else {
        document.getElementById('itemTitle').value = '';
        document.getElementById('itemCommand').value = '';
    }
}

function saveItem() {
    const id = document.getElementById('editItemId').value;
    const title = document.getElementById('itemTitle').value;
    const cmd = document.getElementById('itemCommand').value;
    if(!title || !cmd) return;

    if(id) {
        const i = state.items.find(x => x.id == id);
        i.title = title; i.cmd = cmd;
    } else {
        state.items.unshift({ id: Date.now(), catId: state.activeCat==='all' ? state.categories[1]?.id : state.activeCat, title, cmd });
    }
    save(); closeModal('itemModal'); renderItems();
}

function deleteItem(id) {
    if(confirm('Удалить?')) { state.items = state.items.filter(i => i.id !== id); save(); renderItems(); }
}

function copyCmd(id) {
    const item = state.items.find(i => i.id === id);
    if(item) navigator.clipboard.writeText(item.cmd).then(() => {
        document.getElementById('toast').classList.add('active');
        setTimeout(() => document.getElementById('toast').classList.remove('active'), 2000);
    });
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function escapeStr(s) { return s ? s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ''; }
function exportData() {
    const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const a = document.createElement('a'); a.href = str; a.download = 'backup.json'; a.click();
}
function importData(inp) {
    const r = new FileReader();
    r.onload = e => { try { state = JSON.parse(e.target.result); save(); renderTree(); renderItems(); alert("OK"); } catch { alert("Err"); } };
    r.readAsText(inp.files[0]);
}

// === UTILS ===
function switchIconTab(type) {
    document.getElementById('catIconType').value = type;
    
    // Переключаем кнопки
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    // Переключаем контент
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if(type === 'icon') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('tabIconInput').classList.add('active');
    } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('tabImgInput').classList.add('active');
    }
}