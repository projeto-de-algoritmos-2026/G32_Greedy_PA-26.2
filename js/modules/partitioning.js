/**
 * LogiFlow — Módulo 4: Interval Partitioning
 * Número mínimo de docas/motoristas para atender todas as janelas
 */
import { getOrders, onOrdersChange } from '../data/store.js';

// ── Algorithm ────────────────────────────────────────────────
/**
 * Greedy Interval Partitioning (minimum number of resources)
 * Sort by start time, greedily assign to earliest-free dock.
 * @param {Array} intervals [{id, start, end, ...}]
 * @returns {{ docks: Array<Array>, numDocks: number, depth: number }}
 */
export function intervalPartitioning(intervals) {
  if (intervals.length === 0) return { docks: [], numDocks: 0, depth: 0 };

  const sorted = [...intervals].sort((a, b) => a.start - b.start);

  // Min-heap simulation: array of {dockIdx, finishTime}
  // We keep it sorted by finishTime
  const heap = []; // [{dockIdx, finishTime}]
  const docks = []; // docks[i] = array of intervals assigned to dock i

  function heapPush(item) {
    heap.push(item);
    heap.sort((a, b) => a.finishTime - b.finishTime);
  }

  function heapPop() {
    return heap.shift();
  }

  for (const interval of sorted) {
    if (heap.length > 0 && heap[0].finishTime <= interval.start) {
      // Reuse the dock that frees earliest
      const freed = heapPop();
      docks[freed.dockIdx].push({ ...interval });
      heapPush({ dockIdx: freed.dockIdx, finishTime: interval.end });
    } else {
      // Open a new dock
      const dockIdx = docks.length;
      docks.push([{ ...interval }]);
      heapPush({ dockIdx, finishTime: interval.end });
    }
  }

  // Compute depth (max simultaneous overlaps)
  let depth = 0;
  const points = [];
  for (const iv of intervals) {
    points.push({ t: iv.start, d: +1 });
    points.push({ t: iv.end,   d: -1 });
  }
  points.sort((a, b) => a.t - b.t || a.d - b.d);
  let cur = 0;
  for (const p of points) {
    cur += p.d;
    depth = Math.max(depth, cur);
  }

  return { docks, numDocks: docks.length, depth };
}

// ── Visualization ────────────────────────────────────────────
const HOUR_START = 6;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const DOCK_COLORS = [
  '#22d3ee','#4ade80','#fbbf24','#a78bfa',
  '#fb7185','#34d399','#fb923c','#60a5fa',
  '#f472b6','#818cf8'
];

function buildDocksViz(docks) {
  const container = document.getElementById('partitioning-docks');
  if (!container) return;

  if (docks.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;padding:10px">Execute o algoritmo para ver a alocação.</div>';
    return;
  }

  // Time axis
  const ticks = [];
  for (let h = HOUR_START; h <= HOUR_END; h += 2) {
    ticks.push(`${String(h).padStart(2,'0')}h`);
  }

  const axisRow = `
    <div class="timeline-row" style="height:20px">
      <div class="dock-label" style="font-size:0.65rem;color:var(--text-muted)">Hora</div>
      <div style="flex:1;display:flex;justify-content:space-between;font-size:0.62rem;font-family:var(--font-mono);color:var(--text-muted)">
        ${ticks.map(t => `<span>${t}</span>`).join('')}
      </div>
    </div>`;

  const rows = docks.map((intervals, di) => {
    const dockColor = DOCK_COLORS[di % DOCK_COLORS.length];
    const blocks = intervals.map(iv => {
      const leftPct  = ((iv.start - HOUR_START) / TOTAL_HOURS) * 100;
      const widthPct = ((iv.end - iv.start) / TOTAL_HOURS) * 100;
      return `
        <div class="timeline-block accepted"
             style="left:${leftPct}%;width:${Math.max(widthPct,2)}%;
                    background:${dockColor}22;border-color:${dockColor}88;color:${dockColor}"
             title="${iv.id}: ${iv.start}h–${iv.end}h">
          ${iv.id}
        </div>`;
    }).join('');

    return `
      <div class="dock-row">
        <div class="dock-label" style="color:${dockColor}">Doca ${di + 1}</div>
        <div class="dock-track">${blocks}</div>
      </div>`;
  }).join('');

  container.innerHTML = axisRow + rows;
}

function runPartitioning() {
  const orders = getOrders();
  if (orders.length === 0) return;

  const intervals = orders.map(o => ({
    id: o.id, client: o.client,
    start: o.start, end: o.end, color: o.color
  }));

  const { docks, numDocks, depth } = intervalPartitioning(intervals);
  buildDocksViz(docks);

  const resultEl = document.getElementById('partitioning-result');
  const statsEl = document.getElementById('partitioning-stats');
  if (resultEl) resultEl.style.display = 'block';
  if (statsEl) {
    statsEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:10px">
        <div class="depth-indicator" style="flex:1;min-width:120px">
          <div class="depth-value">${numDocks}</div>
          <div class="depth-label">docas necessárias<br><span style="font-size:0.7rem;color:var(--text-muted)">(mínimo possível)</span></div>
        </div>
        <div class="depth-indicator" style="flex:1;min-width:120px;border-color:rgba(34,211,238,0.25)">
          <div class="depth-value" style="color:var(--cyan)">${depth}</div>
          <div class="depth-label">profundidade máxima<br><span style="font-size:0.7rem;color:var(--text-muted)">(sobreposições simultâneas)</span></div>
        </div>
      </div>
      <div style="font-size:0.8rem;color:var(--text-secondary)">
        ✅ <strong>Prova:</strong> O número mínimo de recursos = profundidade máxima de sobreposição
        <em style="color:var(--cyan)">(${depth} = ${numDocks})</em>
      </div>
    `;
  }
}

function resetPartitioning() {
  buildDocksViz([]);
  const resultEl = document.getElementById('partitioning-result');
  if (resultEl) resultEl.style.display = 'none';
}

// ── Init ─────────────────────────────────────────────────────
export function initPartitioning() {
  document.getElementById('btn-partitioning-run')?.addEventListener('click', runPartitioning);
  document.getElementById('btn-partitioning-reset')?.addEventListener('click', resetPartitioning);

  buildDocksViz([]);
  onOrdersChange(() => resetPartitioning());
}
