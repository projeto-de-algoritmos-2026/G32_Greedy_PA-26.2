/**
 * LogiFlow — Módulo 5: Atraso Máximo (EDF)
 * Ordem de despacho que minimiza o maior atraso
 */
import { getOrders, onOrdersChange } from '../data/store.js';

// ── Algorithm ────────────────────────────────────────────────
/**
 * EDF — Earliest Deadline First (Minimizing Maximum Lateness)
 * @param {Array} jobs [{id, exec (processing time minutes), deadline (hour)}]
 * @returns {{ schedule: Array, maxLateness: number }}
 */
export function edfSchedule(jobs) {
  if (jobs.length === 0) return { schedule: [], maxLateness: 0 };

  const sorted = [...jobs].sort((a, b) => a.deadline - b.deadline);
  let time = 0; // minutes from start of shift (6h = 0min)
  let maxLateness = 0;
  const schedule = [];

  for (const job of sorted) {
    const start = time;
    const finish = time + job.exec;
    // deadline in hours from midnight → convert to minutes from 6h
    const deadlineMin = (job.deadline - 6) * 60;
    const lateness = Math.max(0, finish - deadlineMin);
    maxLateness = Math.max(maxLateness, lateness);
    schedule.push({
      ...job,
      startMin: start,
      finishMin: finish,
      deadlineMin,
      lateness
    });
    time = finish;
  }

  return { schedule, maxLateness };
}

/**
 * Random order for comparison
 */
export function randomSchedule(jobs) {
  const shuffled = [...jobs].sort(() => Math.random() - 0.5);
  return edfSchedule(shuffled);
}

// ── Visualization ────────────────────────────────────────────
function formatMin(min) {
  const h = Math.floor(min / 60) + 6;
  const m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function buildDispatchTimeline(schedule, label, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalMin = schedule.reduce((s, j) => s + j.exec, 0);
  const timelineMax = Math.max(totalMin + 30, schedule.reduce((m, j) => Math.max(m, j.deadlineMin + 30), 0));

  const rows = schedule.map((job, idx) => {
    const leftPct  = (job.startMin / timelineMax) * 100;
    const widthPct = (job.exec / timelineMax) * 100;
    const dlPct    = (job.deadlineMin / timelineMax) * 100;
    const hasLate  = job.lateness > 0;
    const lateLeft = (job.deadlineMin / timelineMax) * 100;
    const lateW    = ((job.finishMin - job.deadlineMin) / timelineMax) * 100;

    return `
      <div class="timeline-row" style="height:42px">
        <div class="timeline-row-label" title="${job.id}">${idx + 1}. ${job.id}</div>
        <div class="timeline-track" style="position:relative">
          <!-- Job block -->
          <div class="timeline-block accepted"
               style="left:${leftPct}%;width:${Math.max(widthPct,1.5)}%;height:calc(100% - 6px)"
               title="${job.id}: ${formatMin(job.startMin)}–${formatMin(job.finishMin)} | exec=${job.exec}min">
            ${job.client?.split(' ')[0] || job.id}
          </div>
          <!-- Late block -->
          ${hasLate ? `
            <div class="timeline-block late"
                 style="left:${lateLeft}%;width:${Math.max(lateW,0.5)}%;height:calc(100% - 6px)"
                 title="Atraso: ${job.lateness} min">
              +${job.lateness}min
            </div>` : ''}
          <!-- Deadline marker -->
          <div class="timeline-deadline-marker" style="left:${dlPct}%">
            <div class="timeline-deadline-label">d=${formatMin(job.deadlineMin)}</div>
          </div>
        </div>
      </div>`;
  });

  container.innerHTML = `
    <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${label}</div>
    <div class="timeline-rows">${rows.join('')}</div>
    <div style="margin-top:6px;display:flex;gap:12px;flex-wrap:wrap">
      <div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--text-muted)">
        <div style="width:12px;height:12px;border-radius:2px;background:rgba(52,211,153,0.35);border:1px solid rgba(52,211,153,0.5)"></div> Processamento
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--text-muted)">
        <div style="width:12px;height:12px;border-radius:2px;background:rgba(248,113,113,0.35);border:1px solid rgba(248,113,113,0.5)"></div> Atraso
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:0.72rem;color:var(--text-muted)">
        <div style="width:2px;height:12px;background:var(--rose)"></div> Deadline
      </div>
    </div>`;
}

function runLateness() {
  const orders = getOrders();
  if (orders.length === 0) return;

  const jobs = orders.map(o => ({
    id: o.id, client: o.client,
    exec: o.exec,          // minutes
    deadline: o.deadline,  // hour of day
    color: o.color
  }));

  const { schedule, maxLateness } = edfSchedule(jobs);

  // Build timeline
  const timelineEl = document.getElementById('lateness-timeline');
  if (timelineEl) {
    timelineEl.innerHTML = '';
    const inner = document.createElement('div');
    inner.id = 'lateness-edf-inner';
    timelineEl.appendChild(inner);
    buildDispatchTimeline(schedule, '📅 Ordem EDF (Earliest Deadline First)', 'lateness-edf-inner');
  }

  // Show results
  const resultEl = document.getElementById('lateness-result');
  const statsEl = document.getElementById('lateness-stats');
  if (resultEl) resultEl.style.display = 'block';
  if (statsEl) {
    statsEl.innerHTML = `
      <div>⏱️ <strong>Atraso Máximo (EDF):</strong> <span style="color:${maxLateness === 0 ? 'var(--emerald)' : 'var(--amber)'}">
        ${maxLateness === 0 ? '0 min — sem atrasos! 🎉' : `${maxLateness} min`}
      </span></div>
      <div style="margin-top:6px;font-size:0.78rem;color:var(--text-muted)">
        Ordem EDF: ${schedule.map(j => j.id).join(' → ')}
      </div>
    `;
  }
}

function runComparison() {
  const orders = getOrders();
  if (orders.length === 0) return;

  const jobs = orders.map(o => ({
    id: o.id, client: o.client,
    exec: o.exec, deadline: o.deadline, color: o.color
  }));

  const edf = edfSchedule(jobs);
  const rnd = randomSchedule(jobs);

  const timelineEl = document.getElementById('lateness-timeline');
  if (!timelineEl) return;
  timelineEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div id="lt-edf"></div>
      <div id="lt-rnd"></div>
    </div>`;

  buildDispatchTimeline(edf.schedule, `✅ EDF — Atraso Máx: ${edf.maxLateness}min`, 'lt-edf');
  buildDispatchTimeline(rnd.schedule, `❌ Aleatório — Atraso Máx: ${rnd.maxLateness}min`, 'lt-rnd');

  const statsEl = document.getElementById('lateness-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="padding:10px;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:8px">
          <div style="font-size:0.72rem;font-weight:700;color:var(--emerald);text-transform:uppercase">EDF (Ótimo)</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--emerald)">${edf.maxLateness}min</div>
        </div>
        <div style="padding:10px;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.25);border-radius:8px">
          <div style="font-size:0.72rem;font-weight:700;color:var(--error);text-transform:uppercase">Aleatório</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--error)">${rnd.maxLateness}min</div>
        </div>
      </div>
      ${edf.maxLateness < rnd.maxLateness
        ? `<div style="margin-top:8px;font-size:0.8rem;color:var(--cyan)">
            EDF reduziu o atraso máximo em <strong>${rnd.maxLateness - edf.maxLateness} minutos</strong>! 🎯
          </div>`
        : '<div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted)">Resultado coincidiu nesta instância — tente novamente com Aleatório.</div>'
      }`;
  }

  // Show result section
  document.getElementById('lateness-result').style.display = 'block';
}

function resetLateness() {
  const timelineEl = document.getElementById('lateness-timeline');
  if (timelineEl) timelineEl.innerHTML = '';
  const resultEl = document.getElementById('lateness-result');
  if (resultEl) resultEl.style.display = 'none';
}

// ── Init ─────────────────────────────────────────────────────
export function initLateness() {
  document.getElementById('btn-lateness-run')?.addEventListener('click', runLateness);
  document.getElementById('btn-lateness-compare')?.addEventListener('click', runComparison);
  document.getElementById('btn-lateness-reset')?.addEventListener('click', resetLateness);

  onOrdersChange(resetLateness);
}
