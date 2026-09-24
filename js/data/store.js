/**
 * LogiFlow — Shared Data Store
 * Pedidos do dia que alimentam todos os 7 módulos
 */

// Colors for visual differentiation
export const ORDER_COLORS = [
  '#22d3ee', '#4ade80', '#fbbf24', '#a78bfa',
  '#fb7185', '#34d399', '#fb923c', '#60a5fa',
  '#f472b6', '#818cf8', '#2dd4bf', '#facc15'
];

// Default orders dataset — each order feeds multiple modules
export const DEFAULT_ORDERS = [
  {
    id: 'PED-001', client: 'Mercado Bom Preço',
    weight: 120, volume: 2.4, value: 1800,
    start: 8, end: 10, deadline: 11, exec: 90,
    tracking: 'LF2024SP001'
  },
  {
    id: 'PED-002', client: 'Farmácia Saúde+',
    weight: 45, volume: 0.8, value: 3200,
    start: 9, end: 11, deadline: 12, exec: 60,
    tracking: 'LF2024SP002'
  },
  {
    id: 'PED-003', client: 'Construtora Rio Verde',
    weight: 280, volume: 5.0, value: 4500,
    start: 10, end: 13, deadline: 14, exec: 120,
    tracking: 'LF2024RJ001'
  },
  {
    id: 'PED-004', client: 'Restaurante do Chef',
    weight: 60, volume: 1.2, value: 900,
    start: 11, end: 12, deadline: 13, exec: 45,
    tracking: 'LF2024MG001'
  },
  {
    id: 'PED-005', client: 'TechStore LTDA',
    weight: 30, volume: 0.5, value: 5200,
    start: 8, end: 14, deadline: 16, exec: 75,
    tracking: 'LF2024SP003'
  },
  {
    id: 'PED-006', client: 'Padaria Mãe Maria',
    weight: 15, volume: 0.3, value: 450,
    start: 13, end: 14, deadline: 15, exec: 30,
    tracking: 'LF2024RJ002'
  },
  {
    id: 'PED-007', client: 'Hospital Santa Clara',
    weight: 80, volume: 1.5, value: 6800,
    start: 7, end: 9, deadline: 9, exec: 90,
    tracking: 'LF2024BA001'
  },
  {
    id: 'PED-008', client: 'Shopping Nova Era',
    weight: 150, volume: 3.2, value: 2100,
    start: 14, end: 17, deadline: 18, exec: 150,
    tracking: 'LF2024SP004'
  }
];

// Reactive store
let _orders = DEFAULT_ORDERS.map((o, i) => ({
  ...o,
  color: ORDER_COLORS[i % ORDER_COLORS.length]
}));

const _listeners = new Set();

export function getOrders() {
  return [..._orders];
}

export function setOrders(newOrders) {
  _orders = newOrders.map((o, i) => ({
    ...o,
    color: o.color || ORDER_COLORS[i % ORDER_COLORS.length]
  }));
  _notify();
}

export function addOrder(order) {
  const id = `PED-${String(_orders.length + 1).padStart(3, '0')}`;
  const idx = _orders.length;
  _orders.push({
    id,
    client: order.client || 'Novo Cliente',
    weight: order.weight || 50,
    volume: order.volume || 1.0,
    value: order.value || 1000,
    start: order.start || 9,
    end: order.end || 11,
    deadline: order.deadline || 12,
    exec: order.exec || 60,
    tracking: `LF2024XX${String(idx + 1).padStart(3, '0')}`,
    color: ORDER_COLORS[idx % ORDER_COLORS.length]
  });
  _notify();
}

export function removeOrder(id) {
  _orders = _orders.filter(o => o.id !== id);
  _notify();
}

export function updateOrder(id, field, value) {
  const order = _orders.find(o => o.id === id);
  if (order) {
    order[field] = value;
    _notify();
  }
}

export function onOrdersChange(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

function _notify() {
  _listeners.forEach(fn => fn(_orders));
}

// Trucker route presets
export const TRUCKER_PRESETS = {
  default: {
    autonomy: 150,
    distance: 420,
    stations: [80, 140, 200, 260, 310, 380]
  },
  tight: {
    autonomy: 100,
    distance: 350,
    stations: [50, 110, 160, 220, 280, 330]
  },
  sparse: {
    autonomy: 200,
    distance: 600,
    stations: [90, 210, 340, 480, 560]
  }
};
