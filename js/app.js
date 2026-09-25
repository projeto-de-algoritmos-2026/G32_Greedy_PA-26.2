/**
 * LogiFlow — App Controller
 * Navigation, initialization, dashboard table management
 */
import { getOrders, addOrder, removeOrder, updateOrder, onOrdersChange, DEFAULT_ORDERS, setOrders } from './data/store.js';
import { initKnapsack } from './modules/knapsack.js';
import { initTrucker } from './modules/trucker.js';
import { initScheduling } from './modules/scheduling.js';
import { initPartitioning } from './modules/partitioning.js';
import { initLateness } from './modules/lateness.js';
import { initCashier } from './modules/cashier.js';
import { initHuffman } from './modules/huffman.js';

// ── Navigation ──────────────────────────────────────────────
const MODULE_TITLES = {
  dashboard:    '📊 Dashboard — Visão do Dia',
  knapsack:     '📦 Carregar Caminhão — Mochila Fracionária',
  trucker:      '⛽ Rota de Abastecimento — Problema do Caminhoneiro',
  scheduling:   '📅 Escala de Entregas — Interval Scheduling',
  partitioning: '👷 Alocação de Docas — Interval Partitioning',
  lateness:     '⏰ Ordem de Despacho — Atraso Máximo (EDF)',
  cashier:      '💰 Caixa COD — Problema da Caixa',
  huffman:      '🗜️ Compressão de Rastreio — Código de Huffman',
};

let currentModule = 'dashboard';

function navigateTo(moduleId) {
  if (!MODULE_TITLES[moduleId]) return;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.module === moduleId);
  });

  // Update panels
  document.querySelectorAll('.module-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${moduleId}`);
  });

  // Update topbar title
  document.getElementById('topbar-title').textContent = MODULE_TITLES[moduleId];

  currentModule = moduleId;
}

// ── Dashboard Table ──────────────────────────────────────────
function renderOrdersTable() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  let orders = getOrders();

  const searchInput = document.getElementById('input-search-order');
  if (searchInput && searchInput.value.trim() !== '') {
    const term = searchInput.value.trim().toLowerCase();
    orders = orders.filter(o => 
      o.id.toLowerCase().includes(term) || 
      o.client.toLowerCase().includes(term)
    );
  }

  tbody.innerHTML = orders.map(o => `
    <tr data-id="${o.id}">
      <td><span style="color:${o.color};font-weight:700;">${o.id}</span></td>
      <td><input class="table-input" data-field="client" value="${o.client}" /></td>
      <td><input class="table-input" type="number" data-field="weight" value="${o.weight}" style="width:70px" /></td>
      <td><input class="table-input" type="number" data-field="volume" value="${o.volume}" step="0.1" style="width:70px" /></td>
      <td><input class="table-input" type="number" data-field="value" value="${o.value}" style="width:80px" /></td>
      <td><input class="table-input" type="number" data-field="start" value="${o.start}" min="0" max="23" style="width:55px" /></td>
      <td><input class="table-input" type="number" data-field="end" value="${o.end}" min="0" max="23" style="width:55px" /></td>
      <td><input class="table-input" type="number" data-field="deadline" value="${o.deadline}" min="0" max="24" style="width:55px" /></td>
      <td><input class="table-input" type="number" data-field="exec" value="${o.exec}" style="width:65px" /></td>
      <td>
        <div class="table-action-cell">
          <button class="btn-icon btn-delete" title="Remover" data-id="${o.id}">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');

  // Wire up inline edits
  tbody.querySelectorAll('.table-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const row = e.target.closest('tr');
      const id = row.dataset.id;
      const field = e.target.dataset.field;
      let val = e.target.value;
      if (e.target.type === 'number') val = parseFloat(val) || 0;
      updateOrder(id, field, val);
    });
  });

  // Wire up delete buttons
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      removeOrder(btn.dataset.id);
    });
  });

  // Update stat cards
  updateStatCards(orders);
}

function updateStatCards(orders) {
  const el = (id) => document.getElementById(id);
  if (el('stat-orders')) el('stat-orders').textContent = orders.length;
  const totalVal = orders.reduce((s, o) => s + o.value, 0);
  if (el('stat-revenue')) {
    el('stat-revenue').textContent = totalVal >= 1000
      ? `R$${(totalVal/1000).toFixed(1)}k`
      : `R$${totalVal}`;
  }
}

// ── Date/Time ────────────────────────────────────────────────
function updateDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Toast Notifications ──────────────────────────────────────
export function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Init ─────────────────────────────────────────────────────
function init() {
  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.module));
  });

  // Module cards on dashboard
  document.querySelectorAll('.module-card[data-goto]').forEach(card => {
    card.addEventListener('click', () => navigateTo(card.dataset.goto));
  });

  // Add order button
  document.getElementById('btn-add-order')?.addEventListener('click', () => {
    addOrder({});
    showToast('Pedido adicionado!', 'success');
  });

  // Reset orders button
  document.getElementById('btn-reset-orders')?.addEventListener('click', () => {
    setOrders(JSON.parse(JSON.stringify(DEFAULT_ORDERS)));
    const searchInput = document.getElementById('input-search-order');
    if (searchInput) searchInput.value = '';
    renderOrdersTable();
    showToast('Lista de pedidos restaurada!', 'info');
  });

  // Search input functionality
  document.getElementById('input-search-order')?.addEventListener('input', () => {
    renderOrdersTable();
  });

  // Sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Render initial table
  renderOrdersTable();

  // Subscribe to order changes
  onOrdersChange(() => renderOrdersTable());

  // Date/time
  updateDate();
  setInterval(updateDate, 30000);

  // Initialize all modules
  initKnapsack();
  initTrucker();
  initScheduling();
  initPartitioning();
  initLateness();
  initCashier();
  initHuffman();
}

document.addEventListener('DOMContentLoaded', init);
