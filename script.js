let state = {
    saldo: 0,
    transacoes: []
};

// --- FUNÇÕES DE MEMÓRIA (LocalStorage) ---
function load() {
    const saved = localStorage.getItem('app_financas_data');
    if (saved) {
        state = JSON.parse(saved);
        updateUI();
    }
}

function save() {
    localStorage.setItem('app_financas_data', JSON.stringify(state));
}

function clearAll() {
    if(confirm("Apagar todos os dados?")) {
        localStorage.removeItem('app_financas_data');
        location.reload();
    }
}

// --- LÓGICA DO APP ---
function updateUI() {
    document.getElementById('main-balance').textContent = state.saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const list = document.getElementById('trans-list');
    list.innerHTML = state.transacoes.map(t => `
        <div class="trans-item">
            <span>${t.nome}</span>
            <span style="color: ${t.tipo === 'in' ? 'var(--accent2)' : 'var(--danger)'}">
                ${t.tipo === 'in' ? '+' : '-'} R$ ${t.valor.toFixed(2)}
            </span>
        </div>
    `).join('');
}

function addTransaction() {
    const nome = document.getElementById('t-name').value;
    const valor = parseFloat(document.getElementById('t-val').value);
    const tipo = document.getElementById('t-type').value;

    if (!nome || isNaN(valor)) return;

    if (tipo === 'in') state.saldo += valor;
    else state.saldo -= valor;

    state.transacoes.unshift({ nome, valor, tipo });
    
    save(); // Salva no navegador
    updateUI();
    toggleModal();
    
    document.getElementById('t-name').value = '';
    document.getElementById('t-val').value = '';
}

function switchTab(tabId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

function toggleModal() {
    document.getElementById('modal').classList.toggle('active');
}

// Iniciar ao carregar a página
window.onload = load;
