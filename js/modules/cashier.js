/**
 * LogiFlow — Módulo 6: Problema do Caixa (Troco)
 * Troco com mínimo de cédulas/moedas nas entregas COD
 */

// ── Denominations ────────────────────────────────────────────
const BR_DENOMINATIONS = [
  { value: 100,  label: 'R$100', type: 'note', color: '#4ade80',  bg: 'rgba(74,222,128,0.15)'   },
  { value: 50,   label: 'R$50',  type: 'note', color: '#22d3ee',  bg: 'rgba(34,211,238,0.15)'   },
  { value: 20,   label: 'R$20',  type: 'note', color: '#fbbf24',  bg: 'rgba(251,191,36,0.15)'   },
  { value: 10,   label: 'R$10',  type: 'note', color: '#fb923c',  bg: 'rgba(251,146,60,0.15)'   },
  { value: 5,    label: 'R$5',   type: 'note', color: '#a78bfa',  bg: 'rgba(167,139,250,0.15)'  },
  { value: 2,    label: 'R$2',   type: 'note', color: '#60a5fa',  bg: 'rgba(96,165,250,0.15)'   },
  { value: 1,    label: 'R$1',   type: 'coin', color: '#f0f4ff',  bg: 'rgba(240,244,255,0.1)'   },
  { value: 0.50, label: '50¢',   type: 'coin', color: '#fbbf24',  bg: 'rgba(251,191,36,0.12)'   },
  { value: 0.25, label: '25¢',   type: 'coin', color: '#94a3b8',  bg: 'rgba(148,163,184,0.12)'  },
  { value: 0.10, label: '10¢',   type: 'coin', color: '#64748b',  bg: 'rgba(100,116,139,0.12)'  },
  { value: 0.05, label: '5¢',    type: 'coin', color: '#475569',  bg: 'rgba(71,85,105,0.12)'    },
  { value: 0.01, label: '1¢',    type: 'coin', color: '#334155',  bg: 'rgba(51,65,85,0.12)'     },
];

// Counterexample: system {4,3,1} — greedy gives 4+1+1=3 coins, optimal is 3+3=2
const COUNTER_DENOM = [
  { value: 4, label: '₡4', type: 'coin', color: '#fb7185', bg: 'rgba(251,113,133,0.15)' },
  { value: 3, label: '₡3', type: 'coin', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  { value: 1, label: '₡1', type: 'coin', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
];

// ── Algorithm ────────────────────────────────────────────────
/**
 * Greedy Coin Change
 * @param {number} amount
 * @param {Array} denominations  sorted desc by value
 * @returns {Array} [{denom, count}]
 */
export function greedyCoinChange(amount, denominations) {
  let remaining = Math.round(amount * 100) / 100;
  const result = [];

  for (const d of denominations) {
    if (remaining <= 0) break;
    const count = Math.floor(Math.round(remaining * 100) / Math.round(d.value * 100));
    if (count > 0) {
      result.push({ denom: d, count });
      remaining = Math.round((remaining - count * d.value) * 100) / 100;
    }
  }

  return result;
}

/**
 * Optimal Coin Change via Dynamic Programming (for counterexample)
 * @param {number} amount (integer)
 * @param {number[]} values  integer denominations
 * @returns {Array} [{value, count}]
 */
export function dpCoinChange(amount, values) {
  const dp = new Array(amount + 1).fill(Infinity);
  const parent = new Array(amount + 1).fill(-1);
  dp[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const v of values) {
      if (v <= a && dp[a - v] + 1 < dp[a]) {
        dp[a] = dp[a - v] + 1;
        parent[a] = v;
      }
    }
  }

  if (dp[amount] === Infinity) return [];

  // Reconstruct
  const counts = {};
  let cur = amount;
  while (cur > 0) {
    const v = parent[cur];
    counts[v] = (counts[v] || 0) + 1;
    cur -= v;
  }

  return Object.entries(counts).map(([v, count]) => ({
    value: parseInt(v), count
  })).sort((a, b) => b.value - a.value);
}

// ── Render ───────────────────────────────────────────────────
function renderCoinItem(denom, count, delay = 0) {
  const isNote = denom.type === 'note';
  return `
    <div class="coin-item" style="animation-delay:${delay}ms">
      <div class="coin-face ${isNote ? 'note' : ''}"
           style="background:${denom.bg};border-color:${denom.color};color:${denom.color}">
        ${denom.label}
      </div>
      <div class="coin-count">× ${count}</div>
    </div>`;
}

function runCashier() {
  const priceEl = document.getElementById('cashier-price');
  const paidEl  = document.getElementById('cashier-paid');
  const modeEl  = document.querySelector('input[name="cashier-mode"]:checked');

  const price = parseFloat(priceEl?.value) || 0;
  const paid  = parseFloat(paidEl?.value) || 0;
  const mode  = modeEl?.value || 'canonical';

  if (paid < price) {
    document.getElementById('cashier-display').innerHTML = `
      <div style="color:var(--error);padding:20px;text-align:center">
        ❌ Valor recebido (R$${paid.toFixed(2)}) menor que o preço (R$${price.toFixed(2)})
      </div>`;
    return;
  }

  const change = Math.round((paid - price) * 100) / 100;

  if (mode === 'canonical') {
    renderCanonical(change);
  } else {
    renderCounterExample();
  }
}

function renderCanonical(change) {
  const result = greedyCoinChange(change, BR_DENOMINATIONS);
  const totalCoins = result.reduce((s, r) => s + r.count, 0);

  document.getElementById('cashier-display').innerHTML = `
    <div class="change-summary">
      <div class="change-header">
        <div>
          <div style="font-size:0.72rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Troco</div>
          <div class="change-amount">R$${change.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.72rem;color:var(--text-muted)">Total de peças</div>
          <div style="font-size:1.5rem;font-weight:800;color:var(--cyan)">${totalCoins}</div>
        </div>
      </div>
      ${change === 0
        ? '<div style="color:var(--emerald);font-size:0.9rem">💰 Pagamento exato — sem troco!</div>'
        : `<div class="change-coins">
            ${result.map((r, i) => renderCoinItem(r.denom, r.count, i * 80)).join('')}
          </div>`}
      <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">
        ✅ Sistema Brasileiro é <strong>canônico</strong> — o algoritmo guloso sempre produz a solução ótima.
      </div>
    </div>`;
}

function renderCounterExample() {
  // Greedy: denominations {4,3,1}, change=6 → gives 4+1+1 = 3 coins
  const change = 6;
  const greedyResult = greedyCoinChange(change, COUNTER_DENOM);
  const greedyCoins = greedyResult.reduce((s,r) => s + r.count, 0);

  // Optimal via DP: {3,3} = 2 coins
  const dpResult = dpCoinChange(change, [4, 3, 1]);
  const dpCoins = dpResult.reduce((s, r) => s + r.count, 0);

  const dpDenomsMap = { 4: COUNTER_DENOM[0], 3: COUNTER_DENOM[1], 1: COUNTER_DENOM[2] };

  document.getElementById('cashier-display').innerHTML = `
    <div style="margin-bottom:12px">
      <div style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6">
        🎓 <strong>Contraexemplo Didático:</strong> Moedas disponíveis <span style="color:var(--cyan);font-family:var(--font-mono)">{4, 3, 1}</span>.
        Troco necessário: <span style="color:var(--amber);font-weight:700;font-size:1.1rem">6</span>
      </div>
    </div>
    <div class="counterexample-compare">
      <div class="compare-panel greedy">
        <div class="compare-title">❌ Guloso (Não-Ótimo)</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px">
          Escolhe sempre a maior moeda ≤ restante:<br>
          <span style="font-family:var(--font-mono);color:var(--rose)">6 → 4 → 2 → 1 → 1</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          ${greedyResult.map((r, i) => renderCoinItem(r.denom, r.count, i * 80)).join('')}
        </div>
        <div style="font-size:0.78rem;color:var(--rose);font-weight:700">${greedyCoins} moedas</div>
      </div>
      <div class="compare-panel optimal">
        <div class="compare-title">✅ Ótimo (Prog. Dinâmica)</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px">
          Usa DP para encontrar o mínimo global:<br>
          <span style="font-family:var(--font-mono);color:var(--emerald)">6 → 3 + 3</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          ${dpResult.map((r, i) => renderCoinItem(dpDenomsMap[r.value], r.count, i * 80 + 200)).join('')}
        </div>
        <div style="font-size:0.78rem;color:var(--emerald);font-weight:700">${dpCoins} moedas — ${greedyCoins - dpCoins} a menos!</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px;background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.2);border-radius:8px;font-size:0.8rem;color:var(--text-secondary)">
      💡 O algoritmo guloso <strong>falha</strong> neste sistema pois as denominações não são canônicas.
      Para sistemas arbitrários, use <em>Programação Dinâmica</em>.
    </div>`;
}

function resetCashier() {
  document.getElementById('cashier-display').innerHTML = `
    <div class="cashier-placeholder">Configure os valores e clique em Calcular Troco</div>`;
}

// ── Init ─────────────────────────────────────────────────────
export function initCashier() {
  document.getElementById('btn-cashier-run')?.addEventListener('click', runCashier);
  document.getElementById('btn-cashier-reset')?.addEventListener('click', resetCashier);
}
