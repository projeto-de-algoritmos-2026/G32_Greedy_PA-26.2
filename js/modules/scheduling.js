/**
 * LogiFlow — Módulo 3: Interval Scheduling
 * Máximo de entregas compatíveis para um motorista/doca
 */
import { getOrders, onOrdersChange } from '../data/store.js';

// ── Algorithm ────────────────────────────────────────────────
/**
 * Greedy Interval Scheduling (Maximum Compatible Jobs)
 * Sort by finish time, select if compatible with last selected.
 * @param {Array} intervals [{id, start, end, ...}]
 * @returns {{ selected: Array, rejected: Array }}
 */
export function intervalScheduling(intervals) {
  if (intervals.length === 0) return { selected: [], rejected: [] };

  const sorted = [...intervals].sort((a, b) => a.end - b.end);
  const selected = [];
  const rejected = [];
  let lastFinish = -Infinity;

  for (const interval of sorted) {
    if (interval.start >= lastFinish) {
      selected.push({ ...interval, status: 'accepted' });
      lastFinish = interval.end;
    } else {
      rejected.push({ ...interval, status: 'rejected' });
    }
  }

  return { selected, rejected };
}

// ── Visualization ────────────────────────────────────────────
const HOUR_START = 6;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;

function buildTimeline(all, selected, rejected) {
  const container = document.getElementById('scheduling-timeline');
  if (!container) return;

  const selectedIds = new Set(selected.map(s => s.id));
  const labelWidth = 88;

  // Build axis ticks
  const ticks = [];
  for (let h = HOUR_START; h <= HOUR_END; h += 2) {
    ticks.push(`${String(h).padStart(2,'0')}h`);
  }

  const rows = all.map(o => {
    const status = selectedIds.has(o.id) ? 'accepted' : 'rejected';
    const leftPct  = ((o.start - HOUR_START) / TOTAL_HOURS) * 100;
    const widthPct = ((o.end - o.start) / TOTAL_HOURS) * 100;
    const icon = status === 'accepted' ? '✅' : '❌';

    return `
      <div class="timeline-row">
        <div class="timeline-row-label" title="${o.id}: ${o.client}">${o.id}</div>
        <div class="timeline-track">
          <div class="timeline-block ${status}"
               style="left:${leftPct}%;width:${Math.max(widthPct,2)}%"
               title="${o.client}: ${o.start}h–${o.end}h">
            ${icon} ${o.client.split(' ')[0]}
          </div>
        </div>
      </div>`;
  });

  container.innerHTML = `
    <div class="timeline-canvas">
      <div class="timeline-axis" style="padding-left:${labelWidth}px">
        ${ticks.map(t => `<span>${t}</span>`).join('')}
      </div>
      <div class="timeline-rows">${rows.join('')}</div>
    </div>`;
}

function runScheduling() {
  const orders = getOrders();
  if (orders.length === 0) return;

  const intervals = orders.map(o => ({
    id: o.id, client: o.client,
    start: o.start, end: o.end, color: o.color
  }));

  const { selected, rejected } = intervalScheduling(intervals);

  buildTimeline(orders, selected, rejected);

  // Show results
  const resultEl = document.getElementById('scheduling-result');
  const selectedEl = document.getElementById('scheduling-selected');
  if (resultEl) resultEl.style.display = 'block';
  if (selectedEl) {
    selectedEl.innerHTML = `
      <div style="margin-bottom:6px;font-size:0.78rem;color:var(--text-muted)">
        <strong style="color:var(--emerald)">${selected.length}</strong> de ${orders.length} entregas selecionadas
      </div>
      ${selected.map(s => `
        <div class="selected-item">
          <span style="color:var(--emerald)">✅</span>
          <span>${s.id} — ${s.client}</span>
          <span style="margin-left:auto;font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted)">${s.start}h–${s.end}h</span>
        </div>`).join('')}
      <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted)">
        ❌ Rejeitadas: ${rejected.map(r => r.id).join(', ') || 'nenhuma'}
      </div>
    `;
  }
}

function resetScheduling() {
  const container = document.getElementById('scheduling-timeline');
  if (container) container.innerHTML = '';
  const resultEl = document.getElementById('scheduling-result');
  if (resultEl) resultEl.style.display = 'none';
}

function renderInitialTimeline() {
  const orders = getOrders();
  if (orders.length === 0) return;
  buildTimeline(orders, [], []);
}

// ── Init ─────────────────────────────────────────────────────
export function initScheduling() {
  document.getElementById('btn-scheduling-run')?.addEventListener('click', runScheduling);
  document.getElementById('btn-scheduling-reset')?.addEventListener('click', resetScheduling);

  renderInitialTimeline();
  onOrdersChange(() => {
    resetScheduling();
    renderInitialTimeline();
  });
}
