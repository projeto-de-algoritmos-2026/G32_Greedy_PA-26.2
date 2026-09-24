/**
 * LogiFlow — Módulo 2: Problema do Caminhoneiro
 * Mínimo de paradas de abastecimento na rota
 */

// ── Algorithm ────────────────────────────────────────────────
/**
 * Greedy Gas Station / Trucker Problem
 * Always advance to the farthest reachable station.
 * @param {number} autonomy  Tank range in km
 * @param {number[]} stations Sorted positions of gas stations (km from start)
 * @param {number} destination Total distance (km)
 * @returns {{ stops: number[], possible: boolean }}
 */
export function truckerGreedy(autonomy, stations, destination) {
  // Add origin and destination as endpoints
  const points = [0, ...stations.filter(s => s > 0 && s < destination), destination];
  const stops = [];
  let current = 0;

  while (current < destination) {
    // Find the farthest point reachable from current position
    let farthest = -1;
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i] > current && points[i] - current <= autonomy) {
        farthest = points[i];
        break;
      }
    }

    if (farthest === -1) {
      // No point reachable — impossible
      return { stops, possible: false };
    }

    if (farthest >= destination) {
      // Can reach destination directly
      break;
    }

    stops.push(farthest);
    current = farthest;
  }

  return { stops, possible: true };
}

// ── Visualization ────────────────────────────────────────────
function renderRoad(autonomy, stationPositions, destination, stops) {
  const container = document.getElementById('trucker-road');
  if (!container) return;

  const width = Math.max(container.offsetWidth || 700, 500);
  const height = 180;
  const roadY = 100;
  const roadH = 30;
  const scale = (width - 60) / destination;
  const toX = pos => 30 + pos * scale;

  const stopsSet = new Set(stops);
  const svgNS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'road-svg');

  // Road base
  const road = document.createElementNS(svgNS, 'rect');
  road.setAttribute('x', 20); road.setAttribute('y', roadY);
  road.setAttribute('width', width - 40); road.setAttribute('height', roadH);
  road.setAttribute('rx', 6); road.setAttribute('fill', '#1e2a40');
  road.setAttribute('stroke', '#2d3f5a'); road.setAttribute('stroke-width', 1);
  svg.appendChild(road);

  // Road dashes (center line)
  for (let x = 40; x < width - 40; x += 30) {
    const dash = document.createElementNS(svgNS, 'rect');
    dash.setAttribute('x', x); dash.setAttribute('y', roadY + roadH/2 - 1);
    dash.setAttribute('width', 16); dash.setAttribute('height', 2);
    dash.setAttribute('rx', 1); dash.setAttribute('fill', '#4d617a');
    svg.appendChild(dash);
  }

  // Origin marker
  const originG = document.createElementNS(svgNS, 'g');
  const originCircle = document.createElementNS(svgNS, 'circle');
  originCircle.setAttribute('cx', toX(0)); originCircle.setAttribute('cy', roadY + roadH/2);
  originCircle.setAttribute('r', 8); originCircle.setAttribute('fill', '#22d3ee');
  originCircle.setAttribute('stroke', '#0d1321'); originCircle.setAttribute('stroke-width', 2);
  originG.appendChild(originCircle);
  const originLabel = document.createElementNS(svgNS, 'text');
  originLabel.setAttribute('x', toX(0)); originLabel.setAttribute('y', roadY - 8);
  originLabel.setAttribute('text-anchor', 'middle'); originLabel.setAttribute('fill', '#22d3ee');
  originLabel.setAttribute('font-size', 10); originLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
  originLabel.textContent = 'Origem';
  originG.appendChild(originLabel);
  svg.appendChild(originG);

  // Station markers
  stationPositions.forEach(pos => {
    const x = toX(pos);
    const isStop = stopsSet.has(pos);
    const g = document.createElementNS(svgNS, 'g');

    // Pump icon (rect)
    const pump = document.createElementNS(svgNS, 'rect');
    pump.setAttribute('x', x - 6); pump.setAttribute('y', roadY - 24);
    pump.setAttribute('width', 12); pump.setAttribute('height', 14);
    pump.setAttribute('rx', 2);
    pump.setAttribute('fill', isStop ? '#fbbf24' : '#1e2a40');
    pump.setAttribute('stroke', isStop ? '#fbbf24' : '#4d617a');
    pump.setAttribute('stroke-width', 1.5);
    g.appendChild(pump);

    // Pump nozzle
    const nozzle = document.createElementNS(svgNS, 'rect');
    nozzle.setAttribute('x', x + 5); nozzle.setAttribute('y', roadY - 20);
    nozzle.setAttribute('width', 5); nozzle.setAttribute('height', 8);
    nozzle.setAttribute('rx', 2);
    nozzle.setAttribute('fill', isStop ? '#fbbf24' : '#4d617a');
    g.appendChild(nozzle);

    // Connector line to road
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', roadY - 10);
    line.setAttribute('x2', x); line.setAttribute('y2', roadY);
    line.setAttribute('stroke', isStop ? '#fbbf24' : '#4d617a');
    line.setAttribute('stroke-width', isStop ? 2 : 1);
    line.setAttribute('stroke-dasharray', isStop ? '0' : '3,2');
    g.appendChild(line);

    // km label
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', x); label.setAttribute('y', roadY + roadH + 14);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', isStop ? '#fbbf24' : '#4d617a');
    label.setAttribute('font-size', 9);
    label.setAttribute('font-family', 'JetBrains Mono, monospace');
    label.textContent = `${pos}km`;
    g.appendChild(label);

    if (isStop) {
      // Glow circle for stops
      const glow = document.createElementNS(svgNS, 'circle');
      glow.setAttribute('cx', x); glow.setAttribute('cy', roadY + roadH/2);
      glow.setAttribute('r', 5); glow.setAttribute('fill', 'rgba(251,191,36,0.3)');
      glow.setAttribute('stroke', '#fbbf24'); glow.setAttribute('stroke-width', 1.5);
      g.appendChild(glow);
    }

    svg.appendChild(g);
  });

  // Destination marker
  const destX = toX(destination);
  const destG = document.createElementNS(svgNS, 'g');
  const destCircle = document.createElementNS(svgNS, 'circle');
  destCircle.setAttribute('cx', destX); destCircle.setAttribute('cy', roadY + roadH/2);
  destCircle.setAttribute('r', 8); destCircle.setAttribute('fill', '#34d399');
  destCircle.setAttribute('stroke', '#0d1321'); destCircle.setAttribute('stroke-width', 2);
  destG.appendChild(destCircle);
  const destLabel = document.createElementNS(svgNS, 'text');
  destLabel.setAttribute('x', destX); destLabel.setAttribute('y', roadY - 8);
  destLabel.setAttribute('text-anchor', 'middle'); destLabel.setAttribute('fill', '#34d399');
  destLabel.setAttribute('font-size', 10); destLabel.setAttribute('font-family', 'JetBrains Mono, monospace');
  destLabel.textContent = `Destino\n(${destination}km)`;
  destG.appendChild(destLabel);
  const destKm = document.createElementNS(svgNS, 'text');
  destKm.setAttribute('x', destX); destKm.setAttribute('y', roadY - 20);
  destKm.setAttribute('text-anchor', 'middle'); destKm.setAttribute('fill', '#34d399');
  destKm.setAttribute('font-size', 9); destKm.setAttribute('font-family', 'JetBrains Mono, monospace');
  destKm.textContent = `${destination}km`;
  destG.appendChild(destKm);
  svg.appendChild(destG);

  // Autonomy arc indicator at origin
  const arcEnd = Math.min(autonomy, destination);
  const arcRect = document.createElementNS(svgNS, 'rect');
  arcRect.setAttribute('x', toX(0)); arcRect.setAttribute('y', roadY);
  arcRect.setAttribute('width', toX(arcEnd) - toX(0)); arcRect.setAttribute('height', roadH);
  arcRect.setAttribute('fill', 'rgba(34,211,238,0.06)');
  arcRect.setAttribute('stroke', 'rgba(34,211,238,0.2)'); arcRect.setAttribute('stroke-width', 1);
  svg.insertBefore(arcRect, road.nextSibling);

  container.innerHTML = '';
  container.appendChild(svg);
}

function runTrucker() {
  const autonomy = parseFloat(document.getElementById('trucker-autonomy')?.value) || 150;
  const distance = parseFloat(document.getElementById('trucker-distance')?.value) || 420;
  const stationsRaw = document.getElementById('trucker-stations')?.value || '';

  const stations = stationsRaw
    .split(',')
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n) && n > 0 && n < distance)
    .sort((a, b) => a - b);

  const { stops, possible } = truckerGreedy(autonomy, stations, distance);
  renderRoad(autonomy, stations, distance, stops);

  const resultEl = document.getElementById('trucker-result');
  const stopsList = document.getElementById('trucker-stops-list');

  if (resultEl) resultEl.style.display = 'block';
  if (!possible) {
    if (stopsList) stopsList.innerHTML = `
      <div style="color:var(--error);font-size:0.85rem;padding:8px 0">
        ❌ <strong>Impossível!</strong> Nenhum posto alcançável em algum trecho.<br>
        Verifique as posições dos postos ou aumente a autonomia.
      </div>`;
    return;
  }

  if (stopsList) {
    if (stops.length === 0) {
      stopsList.innerHTML = `<div style="color:var(--emerald);font-size:0.85rem">🎉 <strong>Nenhuma parada necessária!</strong> O destino é acessível com o tanque cheio.</div>`;
    } else {
      stopsList.innerHTML = `
        <div class="stop-item"><div class="stop-dot" style="background:var(--cyan)"></div><span>Início: 0 km (tanque cheio)</span></div>
        ${stops.map(s => `<div class="stop-item"><div class="stop-dot"></div><span>Abastece em <strong>${s} km</strong></span></div>`).join('')}
        <div class="stop-item"><div class="stop-dot" style="background:var(--emerald)"></div><span>Chegada: ${distance} km</span></div>
        <div style="margin-top:10px;padding:8px;background:rgba(251,191,36,0.08);border-radius:8px;border:1px solid rgba(251,191,36,0.2);font-size:0.82rem;color:var(--amber)">
          ⛽ <strong>${stops.length} parada${stops.length !== 1 ? 's' : ''}</strong> de abastecimento (mínimo possível)
        </div>
      `;
    }
  }
}

function resetTrucker() {
  const container = document.getElementById('trucker-road');
  if (container) container.innerHTML = '';
  const resultEl = document.getElementById('trucker-result');
  if (resultEl) resultEl.style.display = 'none';
}

// ── Init ─────────────────────────────────────────────────────
export function initTrucker() {
  document.getElementById('btn-trucker-run')?.addEventListener('click', runTrucker);
  document.getElementById('btn-trucker-reset')?.addEventListener('click', resetTrucker);
}
