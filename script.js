const state = {
  transacoes: [],
  investimentos: [],
  dividas: [],
  txFilter: 'todas',
  txType: 'despesa'
};

const fmt = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const catIcons = { Alimentação:'🍔', Transporte:'🚗', Moradia:'🏠', Saúde:'💊', Lazer:'🎮', Salário:'💼', Freelance:'💻', Outros:'📦' };
const catColors = { Alimentação:'#ff9f43', Transporte:'#6c63ff', Moradia:'#26de81', Saúde:'#ff5c5c', Lazer:'#a29bfe', Salário:'#00d4aa', Freelance:'#fd9644', Outros:'#636e72' };
const budgetLimits = { Alimentação:1200, Transporte:500, Moradia:2000, Saúde:400, Lazer:600 };
// Tenta recuperar os dados salvos
const dadosSalvos = localStorage.getItem('meu_app_financas');
if (dadosSalvos) {
  state = JSON.parse(dadosSalvos);
}
function salvarDados() {
  localStorage.setItem('meu_app_financas', JSON.stringify(state));
}
function navTo(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  document.getElementById('nav-' + screen).classList.add('active');
  const fab = document.getElementById('fab');
  fab.style.display = (screen === 'home' || screen === 'transacoes') ? 'flex' : 'none';
  if (screen === 'home') renderHome();
  if (screen === 'transacoes') renderTx();
  if (screen === 'investimentos') renderInvest();
  if (screen === 'dividas') renderDebts();
}

function openModal(type) {
  setType(type);
  document.getElementById('modal-tx').classList.add('open');
  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-valor').value = '';
}
function openInvestModal() { document.getElementById('modal-invest').classList.add('open'); }
function openDebtModal() { document.getElementById('modal-debt').classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function setType(type) {
  state.txType = type;
  document.getElementById('btn-receita').className = 'type-btn' + (type === 'receita' ? ' active-income' : '');
  document.getElementById('btn-despesa').className = 'type-btn' + (type === 'despesa' ? ' active-expense' : '');
}

function salvarTransacao() {
  const desc = document.getElementById('tx-desc').value.trim();
  const valor = parseFloat(document.getElementById('tx-valor').value);
  const cat = document.getElementById('tx-categoria').value;
  if (!desc || isNaN(valor) || valor <= 0) return alert('Preencha todos os campos.');
  const now = new Date();
  state.transacoes.unshift({ desc, valor, cat, tipo: state.txType, data: now.toLocaleDateString('pt-BR') });
  closeModal('modal-tx');
  renderHome(); renderTx();
}

function salvarInvestimento() {
  const nome = document.getElementById('inv-nome').value.trim();
  const tipo = document.getElementById('inv-tipo').value;
  const valor = parseFloat(document.getElementById('inv-valor').value);
  const rent = parseFloat(document.getElementById('inv-rent').value);
  if (!nome || isNaN(valor) || valor <= 0) return alert('Preencha todos os campos.');
  state.investimentos.push({ nome, tipo, valor, rent: isNaN(rent) ? 0 : rent });
  closeModal('modal-invest');
  renderInvest();
}

function salvarDivida() {
  const nome = document.getElementById('debt-nome').value.trim();
  const total = parseFloat(document.getElementById('debt-total-val').value);
  const pagas = parseInt(document.getElementById('debt-pagas').value) || 0;
  const parcelas = parseInt(document.getElementById('debt-parcelas').value) || 1;
  if (!nome || isNaN(total) || total <= 0) return alert('Preencha todos os campos.');
  state.dividas.push({ nome, total, pagas, parcelas });
  closeModal('modal-debt');
  renderDebts();
}

function filterTx(f) {
  state.txFilter = f;
  ['todas','receita','despesa'].forEach(x => {
    const el = document.getElementById('chip-' + x);
    el.style.borderColor = x === f ? 'var(--accent)' : 'var(--border)';
    el.style.color = x === f ? 'var(--text)' : 'var(--muted)';
  });
  renderTx();
}

function renderTxItem(tx) {
  return `<div class="tx-item">
    <div class="tx-icon" style="background:${catColors[tx.cat] || '#636e72'}22;">${catIcons[tx.cat] || '📦'}</div>
    <div class="tx-info">
      <div class="tx-name">${tx.desc}</div>
      <div class="tx-date">${tx.cat} · ${tx.data}</div>
    </div>
    <div class="tx-val ${tx.tipo === 'receita' ? 'pos' : 'neg'}">${tx.tipo === 'receita' ? '+' : '-'}${fmt(tx.valor)}</div>
  </div>`;
}

function renderHome() {
  const receitas = state.transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const despesas = state.transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  document.getElementById('total-receitas').textContent = fmt(receitas);
  document.getElementById('total-despesas').textContent = fmt(despesas);
  document.getElementById('saldo-total').textContent = fmt(receitas - despesas);

  const bl = document.getElementById('budget-list');
  const cats = Object.keys(budgetLimits);
  bl.innerHTML = cats.map(cat => {
    const gasto = state.transacoes.filter(t => t.tipo === 'despesa' && t.cat === cat).reduce((s, t) => s + t.valor, 0);
    const limit = budgetLimits[cat];
    const pct = Math.min(100, (gasto / limit) * 100);
    const color = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warn)' : 'var(--accent2)';
    return `<div class="budget-item">
      <div class="budget-row">
        <div class="budget-name">${catIcons[cat]} ${cat}</div>
        <div class="budget-vals">${fmt(gasto)} / ${fmt(limit)}</div>
      </div>
      <div class="budget-bar-bg"><div class="budget-bar-fill" style="width:${pct}%;background:${color};"></div></div>
    </div>`;
  }).join('');

  const txList = document.getElementById('tx-list-home');
  const last5 = state.transacoes.slice(0, 5);
  txList.innerHTML = last5.length ? last5.map(renderTxItem).join('') : '<div style="text-align:center;color:var(--muted);padding:30px 0;">Nenhuma transação ainda.<br>Toque em + para começar.</div>';
}

function renderTx() {
  const list = state.transacoes.filter(t => state.txFilter === 'todas' || t.tipo === state.txFilter);
  const el = document.getElementById('tx-list-all');
  const empty = document.getElementById('tx-empty');
  if (!list.length) { el.innerHTML = ''; empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  el.innerHTML = list.map(renderTxItem).join('');
}

function renderInvest() {
  const total = state.investimentos.reduce((s, i) => s + i.valor, 0);
  document.getElementById('invest-total').textContent = fmt(total);
  const el = document.getElementById('invest-list');
  el.innerHTML = state.investimentos.map(inv => {
    const up = inv.rent >= 0;
    return `<div class="invest-card">
      <div class="invest-header">
        <div><div class="invest-name">${inv.nome}</div><div class="invest-type">${inv.tipo}</div></div>
        <div class="invest-badge ${up ? 'badge-up' : 'badge-down'}">${up ? '+' : ''}${inv.rent.toFixed(1)}%</div>
      </div>
      <div class="invest-vals">
        <div class="invest-val-item">
          <div class="invest-val-label">Aplicado</div>
          <div class="invest-val-num">${fmt(inv.valor)}</div>
        </div>
        <div class="invest-val-item">
          <div class="invest-val-label">Rendimento</div>
          <div class="invest-val-num" style="color:${up ? 'var(--accent2)' : 'var(--danger)'};">${fmt(inv.valor * inv.rent / 100)}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderDebts() {
  const total = state.dividas.reduce((s, d) => {
    const restantes = d.parcelas - d.pagas;
    return s + (d.total / d.parcelas) * restantes;
  }, 0);
  document.getElementById('debt-total').textContent = fmt(total);
  const el = document.getElementById('debt-list');
  el.innerHTML = state.dividas.map(d => {
    const pct = Math.round((d.pagas / d.parcelas) * 100);
    const parcVal = d.total / d.parcelas;
    return `<div class="debt-card">
      <div class="debt-header">
        <div><div class="debt-name">${d.nome}</div><div class="debt-parcelas">${d.pagas} de ${d.parcelas} parcelas pagas</div></div>
        <div class="debt-total">${fmt(d.total)}</div>
      </div>
      <div class="debt-prog-label"><span>${pct}% pago</span><span>${d.parcelas - d.pagas} restantes</span></div>
      <div class="debt-bar-bg"><div class="debt-bar-fill" style="width:${pct}%;background:var(--accent);"></div></div>
      <div class="debt-parcela-val">Próxima parcela: <span>${fmt(parcVal)}</span></div>
    </div>`;
  }).join('');
}

document.querySelectorAll('.modal-overlay').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

renderHome();
renderInvest();
renderDebts();
