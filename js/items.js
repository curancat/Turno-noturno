// ==========================================
// BANCO DE DADOS GLOBAL DE ITENS (50 ITENS)
// ==========================================

export const databaseItens = {
    // ------------------------------------------
    // TIER 1: LIXO (10 Itens) - Itens iniciais básicos
    // ------------------------------------------
    lixo: [
        { id: 'l1', nome: 'Graveto Quebrado', preco: 50, desc: '+2 Dano Físico (AD)', stats: { ad: 2 } },
        { id: 'l2', nome: 'Farrapo Velho', preco: 50, desc: '+5 Defesa Física', stats: { def: 5 } },
        { id: 'l3', nome: 'Poção Vazia (Vidro)', preco: 40, desc: '+10 Vida Máxima', stats: { maxHp: 10 } },
        { id: 'l4', nome: 'Pedaço de Cristal Místico', preco: 60, desc: '+3 Poder de Habilidade (AP)', stats: { ap: 3 } },
        { id: 'l5', nome: 'Pedrinha Brilhante', preco: 55, desc: '+2 Defesa Mágica', stats: { mdef: 2 } },
        { id: 'l6', nome: 'Sandália Furada', preco: 45, desc: '+5 Vel. Movimento', stats: { ms: 5 } },
        { id: 'l7', nome: 'Pena Seca de Corvo', preco: 50, desc: '+1% Recarga de Habilidade', stats: { cdr: 1 } },
        { id: 'l8', nome: 'Osso de Galinha', preco: 40, desc: '+1% Vampirismo Físico', stats: { vampFis: 1 } },
        { id: 'l9', nome: 'Gota de Orvalho Sujo', preco: 50, desc: '+10 Mana / Tinta Máxima', stats: { maxMana: 10 } },
        { id: 'l10', nome: 'Moeda Falsa Afiada', preco: 30, desc: '+1 Penetração Física', stats: { penFis: 1 } }
    ],

    // ------------------------------------------
    // TIER 2: NORMAL (10 Itens) - O básico para a rota
    // ------------------------------------------
    normal: [
        { id: 'n1', nome: 'Espada Longa Básica', preco: 350, desc: '+12 Dano Físico (AD)', stats: { ad: 12 } },
        { id: 'n2', nome: 'Anel do Mago Aprendiz', preco: 350, desc: '+15 Poder de Habilidade (AP)', stats: { ap: 15 } },
        { id: 'n3', nome: 'Cota de Malha Leve', preco: 400, desc: '+25 Defesa Física', stats: { def: 25 } },
        { id: 'n4', nome: 'Manto de Negatrom', preco: 400, desc: '+20 Defesa Mágica', stats: { mdef: 20 } },
        { id: 'n5', nome: 'Botas da Velocidade', preco: 300, desc: '+25 Vel. Movimento', stats: { ms: 25 } },
        { id: 'n6', nome: 'Gema Estreita', preco: 450, desc: '+5% Recarga e +100 Mana', stats: { cdr: 5, maxMana: 100 } },
        { id: 'n7', nome: 'Adaga do Salteador', preco: 350, desc: '+10 Vel. Ataque', stats: { atkSpd: 10 } },
        { id: 'n8', nome: 'Amuleto Vampírico Menor', preco: 500, desc: '+5% Vampirismo Físico', stats: { vampFis: 5 } },
        { id: 'n9', nome: 'Cristal de Rubi Bruto', preco: 400, desc: '+150 Vida Máxima', stats: { maxHp: 150 } },
        { id: 'n10', nome: 'Punhal Perfurante', preco: 500, desc: '+6 Penetração Física', stats: { penFis: 6 } }
    ],

    // ------------------------------------------
    // TIER 3: ÉPICO (10 Itens) - Core itens de mid game
    // ------------------------------------------
    epico: [
        { id: 'e1', nome: 'Foice do Ceifador', preco: 1200, desc: '+35 AD, +10% Vampirismo Físico', stats: { ad: 35, vampFis: 10 } },
        { id: 'e2', nome: 'Cetro do Vazio Menor', preco: 1250, desc: '+45 AP, +10 Penetração Mágica', stats: { ap: 45, penMag: 10 } },
        { id: 'e3', nome: 'Armadura de Espinhos', preco: 1300, desc: '+50 Defesa Física, +300 Vida', stats: { def: 50, maxHp: 300 } },
        { id: 'e4', nome: 'Capuz Espectral', preco: 1200, desc: '+45 Defesa Mágica, +200 Mana', stats: { mdef: 45, maxMana: 200 } },
        { id: 'e5', nome: 'Botas do Berserker', preco: 1100, desc: '+45 Vel. Movimento, +25% Vel. Ataque', stats: { ms: 45, atkSpd: 25 } },
        { id: 'e6', nome: 'Cajado do Arcano', preco: 1350, desc: '+15% Recarga, +400 Mana', stats: { cdr: 15, maxMana: 400 } },
        { id: 'e7', nome: 'Dentes de Naginata', preco: 1250, desc: '+30 AD, +15 Vel. Ataque', stats: { ad: 30, atkSpd: 15 } },
        { id: 'e8', nome: 'Máscara Sombria', preco: 1400, desc: '+30 AP, +8% Vampirismo Mágico', stats: { ap: 30, vampMag: 8 } },
        { id: 'e9', nome: 'Cinto de Gigante', preco: 1000, desc: '+400 Vida Máxima', stats: { maxHp: 400 } },
        { id: 'e10', nome: 'Lâmina Penetrante', preco: 1300, desc: '+25 AD, +12 Penetração Física', stats: { ad: 25, penFis: 12 } }
    ],

    // ------------------------------------------
    // TIER 4: RARO (10 Itens) - Itens fortes de late game
    // ------------------------------------------
    raro: [
        { id: 'r1', nome: 'Gume do Infinito Sombrio', preco: 2600, desc: '+70 AD, +15% Recarga', stats: { ad: 70, cdr: 15 } },
        { id: 'r2', nome: 'Rabadon Arcano', preco: 2800, desc: '+95 Poder de Habilidade (AP)', stats: { ap: 95 } },
        { id: 'r3', nome: 'Placa da Dinastia', preco: 2500, desc: '+80 Defesa Física, +600 Vida', stats: { def: 80, maxHp: 600 } },
        { id: 'r4', nome: 'Força da Natureza Rara', preco: 2500, desc: '+75 Defesa Mágica, +50 Vel. Movimento', stats: { mdef: 75, ms: 50 } },
        { id: 'r5', nome: 'Passos do Mercúrio Supremo', preco: 2200, desc: '+60 Vel. Movimento, +40 Defesa Mágica', stats: { ms: 60, mdef: 40 } },
        { id: 'r6', nome: 'Convergência de Ekko', preco: 2400, desc: '+20% Recarga, +50 AP, +300 Mana', stats: { cdr: 20, ap: 50, maxMana: 300 } },
        { id: 'r7', nome: 'Mata-Krakens Mítico', preco: 2700, desc: '+50 AD, +35% Vel. Ataque', stats: { ad: 50, atkSpd: 35 } },
        { id: 'r8', nome: 'Sede de Sangue Mágica', preco: 2600, desc: '+60 AP, +15% Vampirismo Mágico', stats: { ap: 60, vampMag: 15 } },
        { id: 'r9', nome: 'Warmog Imortal', preco: 2900, desc: '+1000 Vida Máxima', stats: { maxHp: 1000 } },
        { id: 'r10', nome: 'Last Whisper Divino', preco: 2500, desc: '+40 AD, +25 Penetração Física', stats: { ad: 40, penFis: 25 } }
    ],

    // ------------------------------------------
    // TIER 5: ULTRA (10 Itens) - Finais/Apelões
    // ------------------------------------------
    ultra: [
        { id: 'u1', nome: 'Excalibur Ancestral', preco: 4500, desc: '+150 AD, +25% Vamp. Físico, +30 Pen. Física', stats: { ad: 150, vampFis: 25, penFis: 30 } },
        { id: 'u2', nome: 'Olho do Criador de Universos', preco: 4800, desc: '+200 AP, +25 Pen. Mágica, +20% Recarga', stats: { ap: 200, penMag: 25, cdr: 20 } },
        { id: 'u3', nome: 'Titã do Cataclismo', preco: 4300, desc: '+150 Def. Física, +150 Def. Mágica, +2000 Vida', stats: { def: 150, mdef: 150, maxHp: 2000 } },
        { id: 'u4', nome: 'Onipresença do Vento', preco: 4000, desc: '+120 Vel. Movimento, +50% Vel. Ataque, +20% Recarga', stats: { ms: 120, atkSpd: 50, cdr: 20 } },
        { id: 'u5', nome: 'Vampirium Supremo', preco: 4600, desc: '+100 AD, +100 AP, +30% Vamp. Físico e Mágico', stats: { ad: 100, ap: 100, vampFis: 30, vampMag: 30 } },
        { id: 'u6', nome: 'Coração de Deus Estelar', preco: 4500, desc: '+1500 Vida, +800 Mana, +40 Defesa Física', stats: { maxHp: 1500, maxMana: 800, def: 40 } },
        { id: 'u7', nome: 'Foice da Extinção', preco: 4700, desc: '+130 AD, +40% Vel. Ataque, +25 Pen. Física', stats: { ad: 130, atkSpd: 40, penFis: 25 } },
        { id: 'u8', nome: 'Orbe do Caos Absoluto', preco: 4800, desc: '+180 AP, +35 Pen. Mágica, +15% Vamp. Mágico', stats: { ap: 180, penMag: 35, vampMag: 15 } },
        { id: 'u9', nome: 'Manto do Juízo Final', preco: 4400, desc: '+120 Def. Física, +100 Def. Mágica, +1000 Vida', stats: { def: 120, mdef: 100, maxHp: 1000 } },
        { id: 'u10', nome: 'Zero Absoluto (Cajado)', preco: 5000, desc: '+40% Recarga, +150 AP, +100 AD, +100 Vel. Mov', stats: { cdr: 40, ap: 150, ad: 100, ms: 100 } }
    ]
};
