// ==========================================
// ENGINE DO RIFT: ITENS, ECONOMIA E REGRAS
// ==========================================

import { gameState, atualizarUI } from './app.js';
import { databaseItens } from './items.js';

// ==========================================
// SISTEMA DE NOTIFICAÇÕES (Substitua por UI customizada no futuro)
// ==========================================
function mostrarMensagem(mensagem, tipo = 'info') {
    // Idealmente, substitua isso por um Toast, Modal ou texto na tela.
    alert(`[${tipo.toUpperCase()}] ${mensagem}`);
}

// ==========================================
// RENDERIZAÇÃO DA LOJA NO DOM
// ==========================================
export function inicializarLoja() {
    const shopContainer = document.getElementById('shop-items');
    const tabBtns = document.querySelectorAll('.tab-btn');

    if (!shopContainer) {
        console.error("Erro: Contêiner da loja ('shop-items') não encontrado no DOM.");
        return;
    }

    function mostrarTier(tier) {
        shopContainer.innerHTML = '';
        const itens = databaseItens[tier] || [];

        if (itens.length === 0) {
            shopContainer.innerHTML = '<p class="text-center">Nenhum item disponível nesta categoria.</p>';
            return;
        }

        itens.forEach(item => {
            const card = document.createElement('div');
            // Recomendo colocar esses estilos em um arquivo CSS sob a classe 'item-card'
            card.className = 'unified-panel item-card'; 
            
            card.innerHTML = `
                <div class="item-info">
                    <strong class="item-name" style="color: var(--ouro-brilhante);">${item.nome}</strong>
                    <div class="item-price" style="color: var(--ouro-antigo); margin: 4px 0;">🪙 ${item.preco}</div>
                    <div class="item-desc" style="color: var(--texto-secundario); font-size: 0.75rem;">${item.desc}</div>
                </div>
                <button class="btn-action w-full mt-10 btn-comprar" style="padding: 4px; font-size: 0.7rem;">Comprar</button>
            `;

            // Ação de Compra via Event Listener (Melhor prática)
            const btnComprar = card.querySelector('.btn-comprar');
            btnComprar.addEventListener('click', () => comprarItem(item));

            shopContainer.appendChild(card);
        });
    }

    // Gerenciador de Abas (Tabs)
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const targetTier = e.currentTarget.dataset.lane || e.currentTarget.dataset.tier;
            mostrarTier(targetTier);
        });
    });

    // Iniciar na aba Lixo por padrão
    mostrarTier('lixo');
}

// ==========================================
// LÓGICA DE COMPRA DE ITENS
// ==========================================
function comprarItem(item) {
    const { nome, preco, stats } = item;

    // 1. Validação de Localização (Early Return)
    if (gameState.lane !== "Base") {
        mostrarMensagem("Transação negada! Você precisa retornar à Base para adquirir itens.", "aviso");
        return;
    }

    // 2. Validação de Economia (Early Return)
    if (gameState.gold < preco) {
        mostrarMensagem(`Ouro insuficiente para adquirir ${nome}!`, "erro");
        return;
    }

    // 3. Efetuar Compra
    gameState.gold -= preco;

    // 4. Aplicar Atributos Dinamicamente
    Object.entries(stats).forEach(([statKey, statValue]) => {
        gameState.stats[statKey] = (gameState.stats[statKey] || 0) + statValue;
    });

    // 5. Atualizar Interface e Notificar
    atualizarUI();
    mostrarMensagem(`Você adquiriu com sucesso: ${nome}!`, "sucesso");
}

// ==========================================
// REGRAS DE COMBATE E MINIONS (PVP)
// ==========================================
export function verificarRegraAtackTorre(temMinionPerto) {
    if (!temMinionPerto) {
        mostrarMensagem("As defesas da torre geram um campo arcano intransponível! Tropas aliadas são necessárias.", "aviso");
        return false;
    }
    return true;
}
