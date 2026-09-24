/**
 * LogiFlow — Módulo 7: Código de Huffman
 * Compressão dos códigos de rastreio antes do envio
 */
import { getOrders, onOrdersChange } from '../data/store.js';

// ── Algorithm ────────────────────────────────────────────────

class HuffmanNode {
  constructor(char, freq, left = null, right = null) {
    this.char = char;
    this.freq = freq;
    this.left = left;
    this.right = right;
  }
  get isLeaf() { return !this.left && !this.right; }
}

/**
 * Build Huffman tree from frequency map using greedy min-heap simulation
 * @param {Map<string,number>} freqMap
 * @returns {HuffmanNode} root
 */
export function buildHuffmanTree(freqMap) {
  if (freqMap.size === 0) return null;

  // Min-heap simulation (sorted array)
  let heap = [...freqMap.entries()]
    .map(([char, freq]) => new HuffmanNode(char, freq))
    .sort((a, b) => a.freq - b.freq);

  if (heap.length === 1) {
    // Special case: single character
    const leaf = heap[0];
    return new HuffmanNode(null, leaf.freq, leaf, null);
  }

  while (heap.length > 1) {
    // Extract two minimums
    const left = heap.shift();
    const right = heap.shift();
    const parent = new HuffmanNode(null, left.freq + right.freq, left, right);
    // Insert back and re-sort (priority queue behavior)
    heap.push(parent);
    heap.sort((a, b) => a.freq - b.freq);
  }

  return heap[0];
}

/**
 * Generate Huffman codes from tree
 * @param {HuffmanNode} root
 * @returns {Map<string,string>} char → binary code string
 */
export function generateCodes(root) {
  const codes = new Map();
  function traverse(node, code) {
    if (!node) return;
    if (node.isLeaf) {
      codes.set(node.char, code || '0');
      return;
    }
    traverse(node.left, code + '0');
    traverse(node.right, code + '1');
  }
  traverse(root, '');
  return codes;
}

/**
 * Compute frequency map from text
 */
export function computeFrequency(text) {
  const map = new Map();
  for (const ch of text) {
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  return map;
}

/**
 * Encode text using Huffman codes
 */
export function encodeText(text, codes) {
  return [...text].map(ch => codes.get(ch) || '').join('');
}

// ── SVG Tree Rendering ───────────────────────────────────────
function layoutTree(root) {
  const positions = new Map();
  let leafX = 0;
  const nodeSpacingX = 50;
  const nodeSpacingY = 64;

  function assignPos(node, depth) {
    if (!node) return;
    if (node.isLeaf) {
      positions.set(node, { x: leafX * nodeSpacingX, y: depth * nodeSpacingY });
      leafX++;
      return;
    }
    assignPos(node.left, depth + 1);
    assignPos(node.right, depth + 1);
    const leftPos = positions.get(node.left);
    const rightPos = positions.get(node.right);
    positions.set(node, {
      x: (leftPos.x + rightPos.x) / 2,
      y: depth * nodeSpacingY
    });
  }

  assignPos(root, 0);
  return positions;
}

function renderTree(root, codes) {
  const container = document.getElementById('huffman-tree');
  if (!container) return;
  if (!root) {
    container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">Digite texto para construir a árvore.</div>';
    return;
  }

  const positions = layoutTree(root);
  const nodes = [...positions.entries()];
  const maxX = Math.max(...nodes.map(([,p]) => p.x)) + 40;
  const maxY = Math.max(...nodes.map(([,p]) => p.y)) + 40;
  const SVG_W = Math.max(maxX + 40, 300);
  const SVG_H = maxY + 40;
  const PAD = 20;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', SVG_W + PAD * 2);
  svg.setAttribute('height', SVG_H + PAD * 2);
  svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${SVG_W + PAD*2} ${SVG_H + PAD*2}`);

  const charColors = [
    '#22d3ee','#4ade80','#fbbf24','#a78bfa','#fb7185',
    '#34d399','#fb923c','#60a5fa','#f472b6','#818cf8'
  ];
  let colorIdx = 0;
  const charColorMap = new Map();
  for (const [ch] of codes) {
    charColorMap.set(ch, charColors[colorIdx++ % charColors.length]);
  }

  // Draw edges first (below nodes)
  function drawEdges(node) {
    if (!node) return;
    const pos = positions.get(node);
    if (node.left) {
      const lp = positions.get(node.left);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', pos.x); line.setAttribute('y1', pos.y + 12);
      line.setAttribute('x2', lp.x); line.setAttribute('y2', lp.y - 12);
      line.setAttribute('class', 'tree-link');
      svg.appendChild(line);
      // Edge label "0"
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', (pos.x + lp.x) / 2 - 8);
      label.setAttribute('y', (pos.y + lp.y) / 2);
      label.setAttribute('class', 'tree-edge-label');
      label.textContent = '0';
      svg.appendChild(label);
      drawEdges(node.left);
    }
    if (node.right) {
      const rp = positions.get(node.right);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', pos.x); line.setAttribute('y1', pos.y + 12);
      line.setAttribute('x2', rp.x); line.setAttribute('y2', rp.y - 12);
      line.setAttribute('class', 'tree-link');
      svg.appendChild(line);
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', (pos.x + rp.x) / 2 + 4);
      label.setAttribute('y', (pos.y + rp.y) / 2);
      label.setAttribute('class', 'tree-edge-label');
      label.textContent = '1';
      svg.appendChild(label);
      drawEdges(node.right);
    }
  }

  drawEdges(root);

  // Draw nodes
  for (const [node, pos] of positions) {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('class', 'tree-node');

    const color = node.isLeaf ? (charColorMap.get(node.char) || '#22d3ee') : '#334155';
    const strokeColor = node.isLeaf ? color : '#4d617a';

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', 14);
    circle.setAttribute('fill', node.isLeaf ? `${color}22` : 'rgba(30,42,64,0.9)');
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', node.isLeaf ? 2 : 1.5);
    g.appendChild(circle);

    // Frequency text
    const freqText = document.createElementNS(svgNS, 'text');
    freqText.setAttribute('x', pos.x); freqText.setAttribute('y', node.isLeaf ? pos.y - 2 : pos.y + 4);
    freqText.setAttribute('text-anchor', 'middle');
    freqText.setAttribute('fill', node.isLeaf ? color : '#8fa0bc');
    freqText.setAttribute('font-size', 10);
    freqText.setAttribute('font-family', 'JetBrains Mono, monospace');
    freqText.setAttribute('font-weight', '600');
    freqText.textContent = node.freq;
    g.appendChild(freqText);

    // Character text for leaves
    if (node.isLeaf) {
      const charText = document.createElementNS(svgNS, 'text');
      const displayChar = node.char === ' ' ? '⎵' : node.char;
      charText.setAttribute('x', pos.x); charText.setAttribute('y', pos.y + 10);
      charText.setAttribute('text-anchor', 'middle');
      charText.setAttribute('fill', color);
      charText.setAttribute('font-size', 9);
      charText.setAttribute('font-family', 'JetBrains Mono, monospace');
      charText.textContent = `'${displayChar}'`;
      g.appendChild(charText);
    }

    svg.appendChild(g);
  }

  container.innerHTML = '';
  container.appendChild(svg);
}

function renderCodeTable(freqMap, codes) {
  const container = document.getElementById('huffman-table');
  if (!container) return;

  const sorted = [...codes.entries()].sort((a, b) => a[1].length - b[1].length);
  const maxFreq = Math.max(...[...freqMap.values()]);

  const rows = sorted.map(([ch, code]) => {
    const freq = freqMap.get(ch) || 0;
    const pct = (freq / maxFreq) * 100;
    const displayCh = ch === ' ' ? '⎵ (espaço)' : ch === '\n' ? '↵ (newline)' : ch;
    return `
      <tr>
        <td style="font-family:var(--font-mono);color:var(--text-primary);font-weight:700">${displayCh}</td>
        <td>
          <div class="freq-bar-row" style="margin:0">
            <div class="freq-bar-track" style="flex:1">
              <div class="freq-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="freq-bar-count">${freq}</div>
          </div>
        </td>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${String(ch.charCodeAt(0)).padStart(8,'0').split('').reverse().join('')}</td>
        <td class="huffman-code-cell">${code}</td>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">${code.length}</td>
        <td style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">8</td>
      </tr>`;
  }).join('');

  container.innerHTML = `
    <table class="huffman-table">
      <thead>
        <tr>
          <th>Char</th><th>Frequência</th><th>ASCII (8-bit)</th>
          <th>Código Huffman</th><th>Bits</th><th>Antes</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderHuffmanStats(text, codes, encoded) {
  const origBits = text.length * 8;
  const compBits = encoded.length;
  const ratio = origBits > 0 ? (1 - compBits / origBits) * 100 : 0;
  const statsEl = document.getElementById('huffman-stats');
  const resultEl = document.getElementById('huffman-result');
  if (resultEl) resultEl.style.display = 'block';
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="compression-display">
        <div class="compression-stat">
          <div class="compression-stat-value" style="color:var(--text-muted)">${origBits.toLocaleString()}</div>
          <div class="compression-stat-label">Bits (ASCII)</div>
        </div>
        <div class="compression-arrow">→</div>
        <div class="compression-stat">
          <div class="compression-stat-value" style="color:var(--emerald)">${compBits.toLocaleString()}</div>
          <div class="compression-stat-label">Bits (Huffman)</div>
        </div>
        <div class="compression-arrow">→</div>
        <div class="compression-stat">
          <div class="compression-stat-value" style="color:var(--cyan)">${ratio.toFixed(1)}%</div>
          <div class="compression-stat-label">Compressão</div>
        </div>
      </div>
      <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted)">
        ${text.length} chars × 8 bits = ${origBits} bits → ${compBits} bits (economia: ${origBits - compBits} bits)
      </div>`;
  }
}

function runHuffman() {
  const inputEl = document.getElementById('huffman-input');
  const text = inputEl?.value || '';

  if (text.trim().length === 0) return;

  const freqMap = computeFrequency(text);
  const root = buildHuffmanTree(freqMap);
  const codes = generateCodes(root);
  const encoded = encodeText(text, codes);

  renderTree(root, codes);
  renderCodeTable(freqMap, codes);
  renderHuffmanStats(text, codes, encoded);
}

function resetHuffman() {
  const container = document.getElementById('huffman-tree');
  if (container) container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">Digite texto para construir a árvore.</div>';
  const tableContainer = document.getElementById('huffman-table');
  if (tableContainer) tableContainer.innerHTML = '';
  const resultEl = document.getElementById('huffman-result');
  if (resultEl) resultEl.style.display = 'none';
}

function loadTrackingText() {
  const orders = getOrders();
  const inputEl = document.getElementById('huffman-input');
  if (inputEl && orders.length > 0) {
    inputEl.value = orders.map(o => o.tracking).join(' ');
  }
}

// ── Init ─────────────────────────────────────────────────────
export function initHuffman() {
  document.getElementById('btn-huffman-run')?.addEventListener('click', runHuffman);
  document.getElementById('btn-huffman-reset')?.addEventListener('click', resetHuffman);

  loadTrackingText();
  onOrdersChange(() => {
    loadTrackingText();
    resetHuffman();
  });
}
