/**
 * LogiFlow — Módulo 1: Mochila Fracionária
 * Carregamento do caminhão maximizando valor total
 */
import { getOrders, onOrdersChange } from '../data/store.js';

const COLORS = [
  '#22d3ee','#4ade80','#fbbf24','#a78bfa',
  '#fb7185','#34d399','#fb923c','#60a5fa',
  '#f472b6','#818cf8','#2dd4bf','#facc15'
];

// ── Algorithm ────────────────────────────────────────────────
/**
 * Fractional Knapsack — Greedy by value/weight ratio
 * @param {Array} items [{weight, value, ...}]
 * @param {number} capacity
 * @returns {{ taken: Array, totalValue: number, totalWeight: number }}
 */
export function fractionalKnapsack(items, capacity) {
  // Compute density and sort descending
  const sorted = items
    .map((item, idx) => ({ ...item, idx, density: item.value / item.weight }))
    .sort((a, b) => b.density - a.density);

  let remaining = capacity;
  let totalValue = 0;
  let totalWeight = 0;
  const taken = [];

  for (const item of sorted) {
    if (remaining <= 0) break;
    if (item.weight <= remaining) {
      // Take fully
      taken.push({ ...item, fraction: 1.0, takenWeight: item.weight, takenValue: item.value });
      remaining -= item.weight;
      totalValue += item.value;
      totalWeight += item.weight;
    } else {
      // Take fractionally
      const fraction = remaining / item.weight;
      taken.push({
        ...item,
        fraction,
        takenWeight: remaining,
        takenValue: item.value * fraction
      });
      totalValue += item.value * fraction;
      totalWeight += remaining;
      remaining = 0;
    }
  }

  return { taken, totalValue, totalWeight, usedCapacity: capacity - remaining };
}

// ── Render ───────────────────────────────────────────────────
function renderItemsList() {
  const orders = getOrders();
  const list = document.getElementById('knapsack-items-list');
  if (!list) return;

  list.innerHTML = orders.map((o, i) => `
    <div class="item-row">
      <div class="item-color" style="background:${o.color || COLORS[i % COLORS.length]}"></div>
      <div class="item-name">${o.id}</div>
      <div class="item-detail">${o.weight}kg</div>
      <div class="item-detail" style="color:var(--emerald)">R$${o.value.toLocaleString('pt-BR')}</div>
      <div class="density-badge">${(o.value / o.weight).toFixed(1)}/kg</div>
    </div>
  `).join('');
}

function runKnapsack() {
  const capacity = parseFloat(document.getElementById('knapsack-capacity').value) || 500;
  const orders = getOrders();

  if (orders.length === 0) {
    showKnapsackMessage('Nenhum pedido disponível. Adicione pedidos no Dashboard.');
    return;
  }

  const items = orders.map(o => ({
    id: o.id,
    client: o.client,
    weight: o.weight,
    value: o.value,
    color: o.color
  }));

  const result = fractionalKnapsack(items, capacity);
  renderTruckResult(result, capacity);
}

function renderTruckResult({ taken, totalValue, totalWeight, usedCapacity }, capacity) {
  // Update capacity bar
  const fillEl = document.getElementById('knapsack-truck-fill');
  const labelEl = document.getElementById('knapsack-fill-label');
  const pct = Math.min((usedCapacity / capacity) * 100, 100);

  // Animate bar
  setTimeout(() => {
    if (fillEl) fillEl.style.width = `${pct}%`;
  }, 50);

  if (labelEl) labelEl.textContent = `${usedCapacity.toFixed(1)} kg / ${capacity} kg`;

  // Truck items
  const itemsContainer = document.getElementById('knapsack-truck-items');
  if (itemsContainer) {
    itemsContainer.innerHTML = taken.map((item, i) => {
      const isPartial = item.fraction < 1;
      const delay = i * 120;
      return `
        <div class="truck-item-row ${isPartial ? 'partial' : 'full'}" style="animation-delay:${delay}ms">
          <div style="width:10px;height:10px;border-radius:50%;background:${item.color};flex-shrink:0;"></div>
          <div style="flex:1;font-size:0.8rem;color:var(--text-primary);font-weight:500">${item.id} — ${item.client}</div>
          <div style="font-size:0.72rem;font-family:var(--font-mono);color:var(--text-muted)">${item.takenWeight.toFixed(1)}kg</div>
          <div style="font-size:0.72rem;font-family:var(--font-mono);color:var(--emerald)">R$${item.takenValue.toLocaleString('pt-BR', {maximumFractionDigits:0})}</div>
          <span class="truck-item-badge ${isPartial ? 'partial-badge' : 'full-badge'}">
            ${isPartial ? `${(item.fraction * 100).toFixed(0)}%` : '100%'}
          </span>
        </div>
      `;
    }).join('');
  }

  // Show result panel
  const resultEl = document.getElementById('knapsack-result');
  const statsEl = document.getElementById('knapsack-stats');
  if (resultEl) resultEl.style.display = 'block';
  if (statsEl) {
    const skipped = getOrders().length - taken.filter(t => t.fraction > 0).length;
    statsEl.innerHTML = `
      <div>💰 <strong>Valor Total Carregado:</strong> R$${totalValue.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
      <div>⚖️ <strong>Peso Utilizado:</strong> ${usedCapacity.toFixed(1)} de ${capacity} kg (${pct.toFixed(1)}%)</div>
      <div>📦 <strong>Pedidos:</strong> ${taken.length} carregados${skipped > 0 ? `, ${skipped} deixados para trás` : ' (todos couberam)'}</div>
      <div>📊 <strong>Critério:</strong> Ordenação por densidade (R$/kg)</div>
    `;
  }
}

function showKnapsackMessage(msg) {
  const itemsContainer = document.getElementById('knapsack-truck-items');
  if (itemsContainer) {
    itemsContainer.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;padding:10px;">${msg}</div>`;
  }
}

function resetKnapsack() {
  const fillEl = document.getElementById('knapsack-truck-fill');
  const labelEl = document.getElementById('knapsack-fill-label');
  const capacity = parseFloat(document.getElementById('knapsack-capacity')?.value) || 500;
  if (fillEl) fillEl.style.width = '0%';
  if (labelEl) labelEl.textContent = `0 kg / ${capacity} kg`;
  const itemsContainer = document.getElementById('knapsack-truck-items');
  if (itemsContainer) itemsContainer.innerHTML = '';
  const resultEl = document.getElementById('knapsack-result');
  if (resultEl) resultEl.style.display = 'none';
}

// ── Init ─────────────────────────────────────────────────────
export function initKnapsack() {
  document.getElementById('btn-knapsack-run')?.addEventListener('click', runKnapsack);
  document.getElementById('btn-knapsack-reset')?.addEventListener('click', resetKnapsack);
  document.getElementById('knapsack-capacity')?.addEventListener('input', resetKnapsack);

  renderItemsList();
  onOrdersChange(() => {
    renderItemsList();
    resetKnapsack();
  });
}
