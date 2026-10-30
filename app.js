// High-Quality Cyber App Icon Generation Setup
(function setupAppIconAndManifest() {
    const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#080b11"/>
                <stop offset="100%" stop-color="#161f30"/>
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8a2be2"/>
                <stop offset="50%" stop-color="#00f0ff"/>
                <stop offset="100%" stop-color="#ff0055"/>
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="#00f0ff" flood-opacity="0.6"/>
            </filter>
        </defs>
        <rect width="512" height="512" rx="116" fill="url(#bgGrad)"/>
        <rect x="16" y="16" width="480" height="480" rx="104" fill="none" stroke="url(#accentGrad)" stroke-width="8" opacity="0.4"/>
        <path d="M256 64L384 112V240C384 340 330 420 256 448C182 420 128 340 128 240V112L256 64Z" fill="#101622" stroke="#00f0ff" stroke-width="14" filter="url(#neonGlow)"/>
        <g transform="translate(180, 190) scale(4.5)" fill="none" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="3" fill="#080b11"/>
            <path d="M6 12h4m-2-2v4M15 11h.01M18 13h.01"/>
        </g>
    </svg>`;
    const iconDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgIcon);

    document.getElementById('favicon-placeholder')?.setAttribute('href', iconDataUrl);
    document.getElementById('apple-touch-icon-placeholder')?.setAttribute('href', iconDataUrl);

    const manifest = {
        name: "NexusVault - Game Account & Code Manager",
        short_name: "NexusVault",
        description: "Secure local offline Game Account & Redeem Code Vault",
        start_url: "./",
        display: "standalone",
        background_color: "#080b11",
        theme_color: "#0a0d14",
        icons: [{ src: iconDataUrl, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }]
    };
    document.getElementById('manifest-placeholder')?.setAttribute('href', 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest)));
})();


// Presets & App State
const PRESET_ICONS = [
    { name: 'Steam', icon: 'fa-brands fa-steam', color: '#006CFA' },
    { name: 'Discord', icon: 'fa-brands fa-discord', color: '#4300FA' },
    { name: 'Riot Games', icon: 'fa-solid fa-shield-halved', color: '#d03837' },
    { name: 'Genshin', icon: 'fa-solid fa-star', color: '#8a2be2' },
    { name: 'Nikke', icon: 'fa-solid fa-crosshairs', color: '#ff0055' },
    { name: 'Console', icon: 'fa-solid fa-gamepad', color: '#003791' }
];

let accounts = [];
let redeemCodeLists = [];
let activeTab = 'accounts';
let selectedPreset = PRESET_ICONS[0];
let customIconData = '';
let customCodeListIconData = '';
let currentFilter = 'all';

// Security Lock State
let lockType = localStorage.getItem('nexus_lock_type') || 'pin';
let pinCode = localStorage.getItem('nexus_pin') || '';
let patternCode = localStorage.getItem('nexus_pattern') || '';
let isPinEnabled = localStorage.getItem('nexus_pin_enabled') === 'true';
let enteredPin = '';
let currentPattern = [];
let draggedCardId = null;

window.onload = function () {
    if (window.lucide) lucide.createIcons();
    loadAccountsFromStorage();
    loadRedeemCodeListsFromStorage();
    renderPresetPicker();

    if (isPinEnabled && (pinCode || patternCode)) {
        openLockScreen();
    }
    updateLockStatusUI();
    initPatternCanvas('pattern-canvas', onPatternDrawn);
    initPatternCanvas('set-pattern-canvas', onSetPatternDrawn);
    renderCurrentView();
};

function switchTab(tab) {
    activeTab = tab;
    const accBtn = document.getElementById('tab-accounts-btn');
    const codesBtn = document.getElementById('tab-codes-btn');
    const accGrid = document.getElementById('accounts-grid');
    const codesGrid = document.getElementById('codes-grid');
    const stat1Label = document.getElementById('stat-label-1');
    const stat2Label = document.getElementById('stat-label-2');
    const headerBtnText = document.getElementById('header-add-text');

    if (tab === 'accounts') {
        accBtn.className = 'flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition bg-cyber-accent text-black shadow-neon-cyan';
        codesBtn.className = 'flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition bg-cyber-card text-gray-300 border border-cyber-border hover:border-cyber-accent';
        accGrid.classList.remove('hidden');
        codesGrid.classList.add('hidden');
        stat1Label.textContent = 'Total Games';
        stat2Label.textContent = 'Total Accounts';
        headerBtnText.textContent = 'Add Game Accounts';
    } else {
        codesBtn.className = 'flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition bg-cyber-purple text-white shadow-neon-purple';
        accBtn.className = 'flex items-center gap-2 px-5 py-2.5 rounded-xl font-orbitron text-xs font-bold tracking-wider transition bg-cyber-card text-gray-300 border border-cyber-border hover:border-cyber-accent';
        codesGrid.classList.remove('hidden');
        accGrid.classList.add('hidden');
        stat1Label.textContent = 'Game Code Lists';
        stat2Label.textContent = 'Total Codes Saved';
        headerBtnText.textContent = 'Add Code';
    }
    updateStats();
    renderCurrentView();
}

function loadAccountsFromStorage() {
    const data = localStorage.getItem('nexus_vault_data');
    if (data) {
        try { accounts = JSON.parse(data); } catch (e) { accounts = []; }
    } else {
        saveAccountsToStorage();
    }
    updateStats();
}

function loadRedeemCodeListsFromStorage() {
    const data = localStorage.getItem('nexus_redeem_code_lists');
    if (data) {
        try { redeemCodeLists = JSON.parse(data); } catch (e) { redeemCodeLists = []; }
    } else {
        saveRedeemCodeListsToStorage();
    }
    updateStats();
}

function saveAccountsToStorage() {
    try {
        localStorage.setItem('nexus_vault_data', JSON.stringify(accounts));
        updateStats();
    } catch (e) {
        alert('Storage limit reached! Try using smaller custom icons or export your backup JSON to free up space.');
    }
}

function saveRedeemCodeListsToStorage() {
    try {
        localStorage.setItem('nexus_redeem_code_lists', JSON.stringify(redeemCodeLists));
        updateStats();
    } catch (e) {
        alert('Storage limit reached! Try using smaller custom icons or export your backup JSON to free up space.');
    }
}

function renderCurrentView() {
    if (activeTab === 'accounts') {
        renderAccounts();
    } else {
        renderRedeemCodeLists();
    }
}

function renderAccounts() {
    const grid = document.getElementById('accounts-grid');
    const empty = document.getElementById('empty-state');
    const query = document.getElementById('search-input').value.toLowerCase().trim();

    grid.innerHTML = '';
    const filtered = accounts.filter(acc => {
        const matchesTitle = acc.title.toLowerCase().includes(query) || acc.tag.toLowerCase().includes(query);
        const matchesSub = acc.subAccounts && acc.subAccounts.some(sub =>
            sub.name.toLowerCase().includes(query) ||
            sub.email.toLowerCase().includes(query) ||
            (sub.notes && sub.notes.toLowerCase().includes(query))
        );
        const matchesFilter = currentFilter === 'all' || acc.tag === currentFilter;
        return (matchesTitle || matchesSub) && matchesFilter;
    });

    if (filtered.length === 0) {
        empty.classList.remove('hidden'); empty.classList.add('flex'); return;
    } else {
        empty.classList.remove('flex'); empty.classList.add('hidden');
    }

    filtered.forEach(acc => {
        const card = document.createElement('div');
        card.className = 'glass-card p-5 rounded-2xl relative flex flex-col justify-between group';
        card.setAttribute('draggable', 'true');
        card.dataset.id = acc.id;

        card.addEventListener('dragstart', (e) => {
            draggedCardId = acc.id;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => card.classList.add('dragging'), 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedCardId = null;
            const newOrderIds = [...grid.querySelectorAll('.glass-card')].map(el => el.dataset.id);
            accounts.sort((a, b) => newOrderIds.indexOf(a.id) - newOrderIds.indexOf(b.id));
            saveAccountsToStorage();
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const draggingEl = document.querySelector('.dragging');
            if (draggingEl && draggingEl !== card) {
                const rect = card.getBoundingClientRect();
                const nextSibling = (e.clientX - rect.left) > (rect.width / 2) ? card.nextSibling : card;
                if (draggingEl !== nextSibling) {
                    grid.insertBefore(draggingEl, nextSibling);
                }
            }
        });

        let iconHtml = acc.customIcon ? `<img src="${acc.customIcon}" class="w-full h-full object-cover rounded-xl" />` :
            acc.preset ? `<i class="${acc.preset.icon} text-lg" style="color: ${acc.preset.color}"></i>` :
                `<i class="fa-solid fa-gamepad text-lg text-cyber-accent"></i>`;

        let subAccountsHtml = '';
        if (acc.subAccounts && acc.subAccounts.length > 0) {
            subAccountsHtml = acc.subAccounts.map(sub => `
                <div class="bg-cyber-bg/70 p-3 rounded-xl border border-cyber-border/70 space-y-2 relative">
                    <div class="flex items-center justify-between border-b border-cyber-border/40 pb-1.5">
                        <span class="font-bold text-xs text-cyber-accent flex items-center gap-1.5">
                            <i data-lucide="gamepad-2" class="w-3.5 h-3.5"></i> ${escapeHtml(sub.name || 'Account')}
                        </span>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="overflow-hidden pr-2">
                            <p class="text-[9px] text-gray-400 font-mono uppercase">User / Email</p>
                            <p class="text-sm text-white font-medium truncate">${escapeHtml(sub.email)}</p>
                        </div>
                        <button onclick="copyToClipboard('${escapeHtml(sub.email)}', 'Username')" class="p-1 rounded-lg bg-cyber-card hover:bg-cyber-accent hover:text-black text-cyber-accent transition">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="overflow-hidden pr-2 flex-1">
                            <p class="text-[9px] text-gray-400 font-mono uppercase">Password</p>
                            <p id="pass-display-${sub.id}" class="text-sm text-white tracking-wider truncate">••••••••••••</p>
                            <p id="pass-plain-${sub.id}" class="text-sm text-white tracking-wider truncate hidden">${escapeHtml(sub.password)}</p>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="toggleCardPassword('${sub.id}')" class="p-1 rounded-lg bg-cyber-card hover:bg-cyber-border text-gray-300 hover:text-white transition">
                                <i id="eye-icon-${sub.id}" data-lucide="eye" class="w-3 h-3"></i>
                            </button>
                            <button onclick="copyToClipboard('${escapeHtml(sub.password)}', 'Password')" class="p-1 rounded-lg bg-cyber-card hover:bg-cyber-accent hover:text-black text-cyber-accent transition">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                    ${sub.notes ? `<p class="font-bold text-[12px] text-[#FFD700] drop-shadow-[0_0_9px_rgba(255,176,31)] bg-black/1 p-1.5 rounded">${escapeHtml(sub.notes)}</p>` : ''}
                </div>
            `).join('');
        }

        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-cyber-card border border-cyber-border flex items-center justify-center overflow-hidden shadow-inner drag-handle" title="Drag to reorder">
                            ${iconHtml}
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <i data-lucide="grip-vertical" class="w-3.5 h-3.5 text-gray-500 drag-handle"></i>
                                <h3 class="font-orbitron font-bold text-sm text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] animate-bounce transition">${escapeHtml(acc.title)}</h3>
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20">${escapeHtml(acc.tag)}</span>
                                <span class="font-semibold text-[10px] text-cyber-purple">${acc.subAccounts ? acc.subAccounts.length : 0} Accounts</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button onclick="editAccount('${acc.id}')" class="p-1.5 rounded-lg bg-cyber-card hover:bg-green-500/20 text-gray-300 hover:text-green-500 transition" title="Edit Game Vault"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                        <button onclick="deleteAccount('${acc.id}')" class="p-1.5 rounded-lg bg-cyber-card hover:bg-red-500/20 text-gray-300 hover:text-red-500 transition" title="Delete Game Vault"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>
                <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
                    ${subAccountsHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function renderRedeemCodeLists() {
    const grid = document.getElementById('codes-grid');
    const empty = document.getElementById('empty-state');
    const query = document.getElementById('search-input').value.toLowerCase().trim();

    grid.innerHTML = '';
    const filtered = redeemCodeLists.filter(list => {
        const matchesGame = list.game.toLowerCase().includes(query);
        const matchesCodes = list.codes && list.codes.some(c =>
            c.code.toLowerCase().includes(query) || (c.reward && c.reward.toLowerCase().includes(query))
        );
        return matchesGame || matchesCodes;
    });

    if (filtered.length === 0) {
        empty.classList.remove('hidden'); empty.classList.add('flex'); return;
    } else {
        empty.classList.remove('flex'); empty.classList.add('hidden');
    }

    filtered.forEach(list => {
        const card = document.createElement('div');
        card.className = 'glass-card p-5 rounded-2xl relative flex flex-col justify-between group border-l-4 border-l-cyber-purple';

        let iconHtml = list.icon ? `<img src="${list.icon}" class="w-full h-full object-cover rounded-xl" />` :
            `<i class="fa-solid fa-ticket text-lg text-cyber-accent"></i>`;

        let codesItemsHtml = '';
        if (list.codes && list.codes.length > 0) {
            codesItemsHtml = list.codes.map(c => {
                const statusColor = c.status === 'Active' ? 'text-cyber-green bg-cyber-green/10 border-cyber-green/30' : 'text-red-400 bg-red-500/10 border-red-500/30';
                return `
                    <div class="bg-cyber-bg/70 p-2.5 rounded-xl border border-cyber-border/70 flex items-center justify-between gap-2">
                        <div class="overflow-hidden pr-1 flex-1">
                            <div class="flex items-center gap-2">
                                <span class="font-orbitron font-bold text-xs text-cyber-accent">${escapeHtml(c.code)}</span>
                                <span class="text-[9px] px-1.5 py-0.5 rounded border ${statusColor}">${escapeHtml(c.status)}</span>
                            </div>
                            ${c.reward ? `<p class="text-[10px] text-gray-400 truncate">${escapeHtml(c.reward)}</p>` : ''}
                        </div>
                        <button onclick="copyToClipboard('${escapeHtml(c.code)}', 'Code')" class="px-2.5 py-1.5 rounded-lg bg-cyber-card hover:bg-cyber-purple hover:text-white text-cyber-purple border border-cyber-purple/40 text-xs font-semibold flex items-center gap-1 transition shrink-0">
                            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy
                        </button>
                    </div>
                `;
            }).join('');
        }

        card.innerHTML = `
            <div>
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-xl bg-cyber-card border border-cyber-border flex items-center justify-center overflow-hidden shadow-inner">
                            ${iconHtml}
                        </div>
                        <div>
                            <h3 class="font-orbitron font-bold text-sm text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] animate-bounce transition">${escapeHtml(list.game)}</h3>
                            <span class="font-semibold text-[10px] text-cyber-purple">${list.codes ? list.codes.length : 0} Redeem Codes</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button onclick="editRedeemCodeList('${list.id}')" class="p-1.5 rounded-lg bg-cyber-card hover:bg-cyber-border text-gray-300 hover:text-white transition" title="Edit Code List"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
                        <button onclick="deleteRedeemCodeList('${list.id}')" class="p-1.5 rounded-lg bg-cyber-card hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition" title="Delete Code List"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>
                <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                    ${codesItemsHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
}

function addSubAccountRow(sub = { id: '', name: '', email: '', password: '', notes: '' }) {
    const container = document.getElementById('subaccounts-modal-container');
    const subId = sub.id || 'sub-' + Date.now() + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.className = 'subaccount-row p-3 rounded-xl bg-cyber-card/60 border border-cyber-border/80 space-y-2 relative group';
    row.dataset.subId = subId;

    row.innerHTML = `
        <div class="flex justify-between items-center">
            <input type="text" value="${escapeHtml(sub.name)}" placeholder="Account Name (e.g. Main)" class="sub-name bg-cyber-bg border border-cyber-border rounded-lg px-2.5 py-1 text-xs text-cyber-accent font-semibold w-2/3 focus:outline-none focus:border-cyber-accent">
            <button type="button" onclick="this.closest('.subaccount-row').remove()" class="p-1 rounded text-red-400 hover:bg-red-500/20 transition">
                <i data-lucide="trash" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="text" value="${escapeHtml(sub.email)}" placeholder="Username / Email *" required class="sub-email bg-cyber-bg border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-accent">
            <input type="text" value="${escapeHtml(sub.password)}" placeholder="Password *" required class="sub-password bg-cyber-bg border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-accent">
        </div>
        <input type="text" value="${escapeHtml(sub.notes)}" placeholder="Notes / Server / 2FA (Optional)" class="sub-notes w-full bg-cyber-bg border border-cyber-border rounded-lg px-2.5 py-1 text-[11px] text-yellow-500 focus:outline-none focus:border-cyber-accent">
    `;
    container.appendChild(row);
    if (window.lucide) lucide.createIcons();
}

function addCodeItemRow(item = { id: '', code: '', reward: '', status: 'Active' }) {
    const container = document.getElementById('code-items-modal-container');
    const itemId = item.id || 'item-' + Date.now() + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.className = 'code-item-row p-3 rounded-xl bg-cyber-card/60 border border-cyber-border/80 space-y-2 relative group';
    row.dataset.itemId = itemId;

    row.innerHTML = `
        <div class="flex justify-between items-center gap-2">
            <input type="text" value="${escapeHtml(item.code)}" placeholder="Redeem Code *" required class="ci-code bg-cyber-bg border border-cyber-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-cyber-accent uppercase w-full focus:outline-none focus:border-cyber-purple">
            <select class="ci-status bg-cyber-bg border border-cyber-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyber-purple">
                <option value="Active" ${item.status === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Expired" ${item.status === 'Expired' ? 'selected' : ''}>Expired</option>
            </select>
            <button type="button" onclick="this.closest('.code-item-row').remove()" class="p-1 rounded text-red-400 hover:bg-red-500/20 transition shrink-0">
                <i data-lucide="trash" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        <input type="text" value="${escapeHtml(item.reward)}" placeholder="Reward Description (e.g. Gems x300)" class="ci-reward w-full bg-cyber-bg border border-cyber-border rounded-lg px-2.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-cyber-purple">
    `;
    container.appendChild(row);
    if (window.lucide) lucide.createIcons();
}

function renderPresetPicker() {
    const container = document.getElementById('preset-icons-grid');
    if (!container) return;
    container.innerHTML = '';
    PRESET_ICONS.forEach((preset) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `h-10 rounded-xl bg-cyber-card border flex items-center justify-center transition ${selectedPreset.name === preset.name && !customIconData ? 'border-cyber-accent shadow-neon-cyan' : 'border-cyber-border hover:border-gray-500'}`;
        btn.innerHTML = `<i class="${preset.icon}" style="color: ${preset.color}"></i>`;
        btn.onclick = () => { selectedPreset = preset; customIconData = ''; document.getElementById('acc-icon-custom').value = ''; renderPresetPicker(); };
        container.appendChild(btn);
    });
}

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
                } else {
                    if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                if (type === 'account') {
                    customIconData = compressedDataUrl;
                    const customInput = document.getElementById('acc-icon-custom');
                    if (customInput) customInput.value = '';
                } else {
                    customCodeListIconData = compressedDataUrl;
                    const codeInput = document.getElementById('code-list-icon-url');
                    if (codeInput) codeInput.value = '';
                }
                showToast('Icon compressed and loaded successfully!', 'success');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function toggleCardPassword(id) {
    const displayEl = document.getElementById(`pass-display-${id}`);
    const plainEl = document.getElementById(`pass-plain-${id}`);
    const eyeEl = document.getElementById(`eye-icon-${id}`);

    if (displayEl.classList.contains('hidden')) {
        displayEl.classList.remove('hidden'); plainEl.classList.add('hidden'); eyeEl.setAttribute('data-lucide', 'eye');
    } else {
        displayEl.classList.add('hidden'); plainEl.classList.remove('hidden'); eyeEl.setAttribute('data-lucide', 'eye-off');
    }
    if (window.lucide) lucide.createIcons();
}

function openModal(account = null) {
    if (activeTab === 'codes') {
        openCodeModal();
        return;
    }
    document.getElementById('account-modal').classList.remove('hidden');
    const subContainer = document.getElementById('subaccounts-modal-container');
    subContainer.innerHTML = '';

    if (account) {
        document.getElementById('modal-title').innerHTML = '<i data-lucide="edit" class="w-5 h-5 text-cyber-accent"></i><span>Edit Game Account</span>';
        document.getElementById('acc-id').value = account.id;
        document.getElementById('acc-title').value = account.title;
        document.getElementById('acc-tag').value = account.tag;
        document.getElementById('acc-icon-custom').value = account.customIcon || '';
        customIconData = account.customIcon || '';
        selectedPreset = account.preset || PRESET_ICONS[0];

        if (account.subAccounts && account.subAccounts.length > 0) {
            account.subAccounts.forEach(sub => addSubAccountRow(sub));
        } else {
            addSubAccountRow();
        }
    } else {
        document.getElementById('modal-title').innerHTML = '<i data-lucide="plus-circle" class="w-5 h-5 text-cyber-accent"></i><span>Add New Game Account</span>';
        document.getElementById('account-form').reset();
        document.getElementById('acc-id').value = '';
        customIconData = '';
        selectedPreset = PRESET_ICONS[0];
        addSubAccountRow({ name: 'Main Account', email: '', password: '', notes: '' });
    }
    renderPresetPicker(); if (window.lucide) lucide.createIcons();
}

function closeModal() { document.getElementById('account-modal').classList.add('hidden'); }

function openCodeModal(listObj = null) {
    document.getElementById('code-modal').classList.remove('hidden');
    const container = document.getElementById('code-items-modal-container');
    container.innerHTML = '';

    if (listObj) {
        document.getElementById('code-modal-title').innerHTML = '<i data-lucide="edit" class="w-5 h-5 text-cyber-purple"></i><span>Edit Game Code List</span>';
        document.getElementById('code-list-id').value = listObj.id;
        document.getElementById('code-list-game').value = listObj.game;
        document.getElementById('code-list-icon-url').value = listObj.icon || '';
        customCodeListIconData = listObj.icon || '';

        if (listObj.codes && listObj.codes.length > 0) {
            listObj.codes.forEach(c => addCodeItemRow(c));
        } else {
            addCodeItemRow();
        }
    } else {
        document.getElementById('code-modal-title').innerHTML = '<i data-lucide="ticket" class="w-5 h-5 text-cyber-accent"></i><span>Add Game Redeem Codes</span>';
        document.getElementById('code-form').reset();
        document.getElementById('code-list-id').value = '';
        customCodeListIconData = '';
        addCodeItemRow({ code: '', reward: '', status: 'Active' });
    }
    if (window.lucide) lucide.createIcons();
}

function closeCodeModal() { document.getElementById('code-modal').classList.add('hidden'); }

function saveAccount(e) {
    e.preventDefault();
    const id = document.getElementById('acc-id').value;
    const title = document.getElementById('acc-title').value.trim();
    const tag = document.getElementById('acc-tag').value;
    const finalIconUrl = document.getElementById('acc-icon-custom').value.trim() || customIconData;

    const subRows = document.querySelectorAll('.subaccount-row');
    const subAccounts = [];
    subRows.forEach(row => {
        const name = row.querySelector('.sub-name').value.trim() || 'Account';
        const email = row.querySelector('.sub-email').value.trim();
        const password = row.querySelector('.sub-password').value.trim();
        const notes = row.querySelector('.sub-notes').value.trim();
        if (email && password) {
            subAccounts.push({
                id: row.dataset.subId || 'sub-' + Date.now() + Math.random().toString(36).substr(2, 4),
                name, email, password, notes
            });
        }
    });

    if (subAccounts.length === 0) {
        alert('Please add at least one valid sub-account username and password.');
        return;
    }

    if (id) {
        const index = accounts.findIndex(a => a.id === id);
        if (index !== -1) accounts[index] = { id, title, tag, preset: selectedPreset, customIcon: finalIconUrl, subAccounts };
        showToast('Game vault updated!', 'success');
    } else {
        accounts.unshift({ id: 'acc-' + Date.now(), title, tag, preset: selectedPreset, customIcon: finalIconUrl, subAccounts });
        showToast('New game entry saved!', 'success');
    }

    saveAccountsToStorage(); closeModal(); renderAccounts();
}

function saveBatchRedeemCodesEntry(e) {
    e.preventDefault();
    const id = document.getElementById('code-list-id').value;
    const game = document.getElementById('code-list-game').value.trim();
    const iconUrlInput = document.getElementById('code-list-icon-url').value.trim();
    const finalIcon = iconUrlInput || customCodeListIconData;

    const rows = document.querySelectorAll('.code-item-row');
    const codes = [];
    rows.forEach(row => {
        const code = row.querySelector('.ci-code').value.trim().toUpperCase();
        const reward = row.querySelector('.ci-reward').value.trim();
        const status = row.querySelector('.ci-status').value;
        if (code) {
            codes.push({
                id: row.dataset.itemId || 'item-' + Date.now() + Math.random().toString(36).substr(2, 4),
                code, reward, status
            });
        }
    });

    if (codes.length === 0) {
        alert('Please add at least one redeem code.');
        return;
    }

    if (id) {
        const index = redeemCodeLists.findIndex(l => l.id === id);
        if (index !== -1) {
            redeemCodeLists[index] = { id, game, icon: finalIcon, codes };
        }
        showToast('Redeem code list updated!', 'success');
    } else {
        redeemCodeLists.unshift({
            id: 'list-' + Date.now(),
            game, icon: finalIcon, codes
        });
        showToast('Redeem code list saved!', 'success');
    }

    saveRedeemCodeListsToStorage(); closeCodeModal(); renderRedeemCodeLists();
}

function editAccount(id) { const acc = accounts.find(a => a.id === id); if (acc) openModal(acc); }
function editRedeemCodeList(id) { const list = redeemCodeLists.find(l => l.id === id); if (list) openCodeModal(list); }

function deleteAccount(id) {
    if (confirm('Delete this game vault and all its accounts?')) {
        accounts = accounts.filter(a => a.id !== id); saveAccountsToStorage(); renderAccounts(); showToast('Game removed.', 'info');
    }
}

function deleteRedeemCodeList(id) {
    if (confirm('Delete this game redeem code list?')) {
        redeemCodeLists = redeemCodeLists.filter(l => l.id !== id); saveRedeemCodeListsToStorage(); renderRedeemCodeLists(); showToast('Code list removed.', 'info');
    }
}

function updateStats() {
    if (activeTab === 'accounts') {
        const totalGames = accounts.length;
        const totalSubAccounts = accounts.reduce((acc, current) => acc + (current.subAccounts ? current.subAccounts.length : 0), 0);

        document.getElementById('stat-count-1').textContent = totalGames;
        document.getElementById('stat-count-2').textContent = totalSubAccounts;
    } else {
        const totalCodeLists = redeemCodeLists.length;
        const totalCodes = redeemCodeLists.reduce((acc, current) => acc + (current.codes ? current.codes.length : 0), 0);

        document.getElementById('stat-count-1').textContent = totalCodeLists;
        document.getElementById('stat-count-2').textContent = totalCodes;
    }
}

function copyToClipboard(text, label) { navigator.clipboard.writeText(text).then(() => showToast(`${label} copied!`, 'success')); }

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const borderColor = type === 'success' ? 'border-cyber-accent text-cyber-accent' : 'border-cyber-purple text-cyber-purple';
    toast.className = `glass-panel p-3.5 rounded-xl border ${borderColor} shadow-lg text-xs font-medium flex items-center gap-2 transform translate-y-2 opacity-0 transition-all duration-300`;
    toast.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}" class="w-4 h-4"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast); if (window.lucide) lucide.createIcons();
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => { toast.classList.add('translate-y-2', 'opacity-0'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// Settings & Lock Screen Logic
function openSettingsModal() { document.getElementById('settings-modal').classList.remove('hidden'); updatePinSettingsUI(); }
function closeSettingsModal() { document.getElementById('settings-modal').classList.add('hidden'); }

function togglePinLockSetting() {
    if (isPinEnabled) {
        isPinEnabled = false; pinCode = ''; patternCode = '';
        localStorage.setItem('nexus_pin_enabled', 'false');
        document.getElementById('lock-type-selector').classList.add('hidden');
        document.getElementById('set-pin-section').classList.add('hidden');
        document.getElementById('set-pattern-section').classList.add('hidden');
        showToast('Vault lock disabled.', 'info');
    } else {
        document.getElementById('lock-type-selector').classList.remove('hidden');
        setLockType(lockType);
        return;
    }
    updatePinSettingsUI(); updateLockStatusUI();
}

function setLockType(type) {
    lockType = type;
    localStorage.setItem('nexus_lock_type', type);
    const pinBtn = document.getElementById('lock-type-pin-btn');
    const patBtn = document.getElementById('lock-type-pattern-btn');

    if (type === 'pin') {
        pinBtn.className = 'py-1.5 rounded-lg border text-center font-semibold bg-cyber-accent text-black border-cyber-accent';
        patBtn.className = 'py-1.5 rounded-lg border text-center font-semibold bg-cyber-bg text-gray-300 border-cyber-border';
        document.getElementById('set-pin-section').classList.remove('hidden');
        document.getElementById('set-pattern-section').classList.add('hidden');
    } else {
        patBtn.className = 'py-1.5 rounded-lg border text-center font-semibold bg-cyber-accent text-black border-cyber-accent';
        pinBtn.className = 'py-1.5 rounded-lg border text-center font-semibold bg-cyber-bg text-gray-300 border-cyber-border';
        document.getElementById('set-pattern-section').classList.remove('hidden');
        document.getElementById('set-pin-section').classList.add('hidden');
    }
}

function saveNewPin() {
    const val = document.getElementById('new-pin-input').value.trim();
    if (val.length < 4 || val.length > 8 || isNaN(val)) {
        alert('PIN must be between 4 and 8 digits long!'); return;
    }
    pinCode = val; isPinEnabled = true;
    localStorage.setItem('nexus_pin', pinCode);
    localStorage.setItem('nexus_pin_enabled', 'true');
    document.getElementById('new-pin-input').value = '';
    document.getElementById('set-pin-section').classList.add('hidden');
    showToast('New PIN lock saved successfully!', 'success');
    updatePinSettingsUI(); updateLockStatusUI();
}

function saveNewPattern() {
    if (currentPattern.length < 3) {
        alert('Pattern must connect at least 3 dots!'); return;
    }
    patternCode = currentPattern.join('-');
    isPinEnabled = true;
    localStorage.setItem('nexus_pattern', patternCode);
    localStorage.setItem('nexus_pin_enabled', 'true');
    document.getElementById('set-pattern-section').classList.add('hidden');
    showToast('New pattern lock saved successfully!', 'success');
    updatePinSettingsUI(); updateLockStatusUI();
}

function updatePinSettingsUI() {
    const btn = document.getElementById('pin-toggle-btn');
    if (isPinEnabled) {
        btn.textContent = 'Enabled'; btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-cyber-accent text-black transition';
        document.getElementById('lock-type-selector').classList.remove('hidden');
    } else {
        btn.textContent = 'Disabled'; btn.className = 'px-3 py-1.5 rounded-lg text-xs font-bold bg-cyber-border text-gray-300 transition';
        document.getElementById('lock-type-selector').classList.add('hidden');
    }
}

function updateLockStatusUI() {
    const lockStatus = document.getElementById('stat-lock-status');
    if (isPinEnabled && (pinCode || patternCode)) {
        lockStatus.textContent = lockType === 'pin' ? 'PIN Active' : 'Pattern Active';
        lockStatus.className = 'font-orbitron text-xs sm:text-sm font-semibold text-cyber-green mt-2 uppercase';
    } else {
        lockStatus.textContent = 'Disabled';
        lockStatus.className = 'font-orbitron text-xs sm:text-sm font-semibold text-cyber-pink mt-2 uppercase';
    }
}

function openLockScreen() {
    document.getElementById('pin-lock-screen').classList.remove('hidden');
    const pinContainer = document.getElementById('pin-lock-container');
    const patternContainer = document.getElementById('pattern-lock-container');
    const subtitle = document.getElementById('lock-subtitle');

    if (lockType === 'pin') {
        pinContainer.classList.remove('hidden');
        patternContainer.classList.add('hidden');
        subtitle.textContent = `Enter ${pinCode.length || '4-8'} digit PIN to unlock`;
        renderPinDots();
    } else {
        patternContainer.classList.remove('hidden');
        patternContainer.classList.add('flex');
        pinContainer.classList.add('hidden');
        subtitle.textContent = 'Draw pattern to unlock';
    }
}

function appendPin(digit) {
    if (enteredPin.length < 8) {
        enteredPin += digit; renderPinDots();
    }
}
function clearPin() { enteredPin = ''; renderPinDots(); document.getElementById('pin-error').textContent = ''; }
function backspacePin() { enteredPin = enteredPin.slice(0, -1); renderPinDots(); document.getElementById('pin-error').textContent = ''; }

function renderPinDots() {
    const container = document.getElementById('pin-dots');
    if (!container) return;
    container.innerHTML = '';
    const totalDots = Math.max(enteredPin.length, pinCode.length || 4);
    for (let i = 0; i < totalDots; i++) {
        const dot = document.createElement('div');
        dot.className = i < enteredPin.length ?
            'w-3.5 h-3.5 rounded-full bg-cyber-accent border border-cyber-accent shadow-neon-cyan transition-all' :
            'w-3.5 h-3.5 rounded-full border border-cyber-accent/50 bg-transparent transition-all';
        container.appendChild(dot);
    }
}

function verifyPin() {
    if (enteredPin === pinCode) {
        document.getElementById('pin-lock-screen').classList.add('hidden');
        enteredPin = ''; renderPinDots(); showToast('Vault unlocked!', 'success');
    } else {
        document.getElementById('pin-error').textContent = 'Incorrect PIN code. Try again.';
        enteredPin = ''; renderPinDots();
    }
}

function initPatternCanvas(canvasId, onCompleteCallback) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const radius = 12;
    let isDrawing = false;
    let pattern = [];

    const dots = [];
    const step = canvas.width / 4;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            dots.push({ id: row * 3 + col, x: step * (col + 1), y: step * (row + 1) });
        }
    }

    function draw(currentPos = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (pattern.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 10;
            ctx.moveTo(dots[pattern[0]].x, dots[pattern[0]].y);
            for (let i = 1; i < pattern.length; i++) {
                ctx.lineTo(dots[pattern[i]].x, dots[pattern[i]].y);
            }
            if (currentPos && isDrawing) {
                ctx.lineTo(currentPos.x, currentPos.y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        dots.forEach(dot => {
            const isActive = pattern.includes(dot.id);
            ctx.beginPath();
            ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? '#00f0ff' : '#101622';
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        });
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDraw(e) {
        e.preventDefault(); isDrawing = true; pattern = [];
        handleMove(e);
    }

    function handleMove(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        dots.forEach(dot => {
            const dist = Math.hypot(dot.x - pos.x, dot.y - pos.y);
            if (dist < radius * 2 && !pattern.includes(dot.id)) {
                pattern.push(dot.id);
            }
        });
        draw(pos);
    }

    function stopDraw(e) {
        if (!isDrawing) return;
        isDrawing = false;
        draw();
        if (onCompleteCallback) onCompleteCallback(pattern);
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', stopDraw);

    draw();
}

function onPatternDrawn(pattern) {
    const drawnStr = pattern.join('-');
    if (drawnStr === patternCode) {
        document.getElementById('pin-lock-screen').classList.add('hidden');
        document.getElementById('pin-error').textContent = '';
        showToast('Vault unlocked successfully!', 'success');
    } else {
        document.getElementById('pin-error').textContent = 'Incorrect Pattern! Try again.';
    }
}

function onSetPatternDrawn(pattern) { currentPattern = pattern; }

function exportJSON() {
    const backupData = { accounts, redeemCodeLists };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `nexus_vault_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor); dlAnchor.click(); dlAnchor.remove();
    showToast('Backup JSON file exported!', 'success');
}

function importJSON(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const imported = JSON.parse(e.target.result);
                if (Array.isArray(imported)) {
                    accounts = imported;
                } else if (imported.accounts || imported.redeemCodeLists) {
                    accounts = imported.accounts || [];
                    redeemCodeLists = imported.redeemCodeLists || [];
                }
                saveAccountsToStorage();
                saveRedeemCodeListsToStorage();
                renderCurrentView();
                showToast('Database imported successfully!', 'success');
                closeSettingsModal();
            } catch (err) { alert('Error parsing JSON backup.'); }
        };
        reader.readAsText(file);
    }
}

function clearAllData() {
    if (confirm('Delete all saved accounts and code lists permanently?')) {
        localStorage.removeItem('nexus_vault_data');
        localStorage.removeItem('nexus_redeem_code_lists');
        accounts = []; redeemCodeLists = []; renderCurrentView(); updateStats(); closeSettingsModal();
        showToast('All local data wiped.', 'info');
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}