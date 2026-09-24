# 🚚 LogiFlow — Painel de Operações de Transportadora

Sistema interativo de gestão logística que aplica **7 Algoritmos Greedy** a problemas reais do dia a dia de uma transportadora/distribuidora.

## 📦 Algoritmos Implementados

| Módulo | Problema Real | Algoritmo |
|--------|--------------|-----------|
| 🚛 Carregar Caminhão | Maximizar valor dos pedidos carregados dentro da capacidade | **Mochila Fracionária** |
| ⛽ Rota de Abastecimento | Mínimo de paradas para o caminhão chegar ao destino | **Caminhoneiro** |
| 📅 Escala de Entregas | Máximo de entregas compatíveis para um motorista/doca | **Interval Scheduling** |
| 👷 Alocação de Docas | Número mínimo de docas/motoristas para atender todas as janelas | **Interval Partitioning** |
| ⏰ Ordem de Despacho | Minimizar o maior atraso nos despachos (EDF) | **Atraso Máximo** |
| 💰 Caixa COD | Troco exato com mínimo de cédulas/moedas para entregas pagas na hora | **Caixa (Troco)** |
| 🗜️ Compressão de Rastreio | Comprimir códigos de rastreio antes de enviar ao sistema central | **Huffman** |

## 🚀 Como Executar

```bash
# Opção 1: Python (mais simples)
python -m http.server 8080

# Opção 2: Node.js
npx serve .

# Depois abra: http://localhost:8080
```

## 🎨 Tecnologias

- **HTML5 + CSS3 + JavaScript** (ES Modules, sem framework)
- Design Dark Mode premium com glassmorphism
- Animações passo a passo para cada algoritmo

## 📚 Contexto Acadêmico

Projeto desenvolvido para a disciplina de **Projeto de Algoritmos (PA)**.
Cada módulo demonstra um algoritmo greedy aplicado a um cenário real coerente — todos alimentados pelos mesmos dados de pedidos do dia.
