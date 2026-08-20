// ==========================================
// ENGINE DO RIFT: ITENS, ECONOMIA E REGRAS
// ==========================================


// ==========================================
// BANCO DE DADOS DOS 50 ITENS (5 TIERs)
// ==========================================
import { gameState, atualizarUI } from './app.js';
import { databaseItens } from './item.js';

// ==========================================
// RENDERIZAÇÃO DA LOJA NO DOM
// ==========================================
export function inicializarLoja() {
    const shopContainer = document.getElementById('shop-items');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Função interna para exibir os itens da aba selecionada
    function mostrarTier(tier) {
        shopContainer.innerHTML = '';
        const itens = databaseItens[tier] || [];

        itens.forEach(item => {
            const card = document.createElement('div');
            card.className = 'unified-panel';
            card.style.padding = '8px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';
            card.style.fontSize = '0.8rem';

            card.innerHTML = `
                <div>
                    <strong style="color: var(--ouro-brilhante);">${item.nome}</strong>
                    <div style="color: var(--ouro-antigo); margin: 4px 0;">🪙 ${item.preco}</div>
                    <div style="color: var(--texto-secundario); font-size: 0.75rem;">${item.desc}</div>
                </div>
                <button class="btn-action w-full mt-10" style="padding: 4px; font-size: 0.7rem;">Comprar</button>
            `;

            // Ação de Compra
            card.querySelector('button').addEventListener('click', () => {
                comprarItem(item);
            });

            shopContainer.appendChild(card);
        });
    }

    // Alternar abas da loja
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            mostrarTier(e.target.dataset.lane || e.target.dataset.tier);
        });
    });

    // Iniciar na aba Lixo por padrão
    mostrarTier('lixo');
}

// ==========================================
// LÓGICA DE COMPRA DE ITENS
// ==========================================
function comprarItem(item) {
    // Regra: Jogador só pode comprar itens na Base
    if (gameState.lane !== "Base") {
        alert("Transação negada! Você precisa retornar à Base para adquirir itens na loja.");
        return;
    }

    if (gameState.gold < item.preco) {
        alert("Ouro insuficiente para adquirir este artefato!");
        return;
    }

    // Deduz o ouro
    gameState.gold -= item.preco;

    // Aplica os atributos do item ao gameState
    for (const [stat, valor] of Object.entries(item.stats)) {
        if (gameState.stats[stat] !== undefined) {
            gameState.stats[stat] += valor;
        } else {
            // Se o atributo não existir no objeto base, cria-o
            gameState.stats[stat] = valor;
        }
    }

    // Sincroniza a interface
    atualizarUI();
    alert(`Você adquiriu com sucesso: ${item.nome}!`);
}

// ==========================================
// REGRAS DE COMBATE E MINIONS (PVP)
// ==========================================
export function verificarRegraAtackTorre(temMinionPerto) {
    if (!temMinionPerto) {
        alert("As defesas da torre geram um campo arcano intransponível! Você não pode atacar estruturas inimigas sem tropas aliadas (minions) por perto.");
        return false;
    }
    return true;
}
