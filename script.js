// CONTROLE DE SESSÃO LOGADA
let isLoggedIn = localStorage.getItem('cm_logged_in') === 'true';
document.getElementById('login-screen').style.display = isLoggedIn ? 'none' : 'flex';

function handleAuth() {
    const email = document.getElementById('email-input').value;
    if (!email) return alert("Digite um email");
    localStorage.setItem('cm_logged_in', 'true');
    localStorage.setItem('cm_user', email);
    document.getElementById('login-screen').style.display = 'none';
    alert("🔓 Acesso liberado! Bem-vindo ao painel do Crypto Café Miner.");
}

function handleLogout() {
    localStorage.setItem('cm_logged_in', 'false');
    document.getElementById('login-screen').style.display = 'flex';
}

// CONFIGURAÇÕES ECONÔMICAS PERSISTENTES
let caféCoins = parseFloat(localStorage.getItem('cm_cafecoins')) || 50.00;
let litecoinBalance = parseFloat(localStorage.getItem('cm_litecoin')) || 0.00000000;
let totalHash = 0.00; 
let timeLeft = 600; 
let isMiningActive = false;
let placedItemsCount = 0;

let inventory = JSON.parse(localStorage.getItem('cm_inventory')) || [];
let currentRoomsOwned = parseInt(localStorage.getItem('cm_rooms')) || 1;
const maxRooms = 3, roomCost = 500.00; 

let gridLayout = JSON.parse(localStorage.getItem('cm_grid')) || {
    "shelf-1-1": null, "shelf-1-2": null, "shelf-1-3": null,
    "shelf-2-1": null, "shelf-2-2": null, "shelf-2-3": null
};

function saveGame() {
    localStorage.setItem('cm_cafecoins', caféCoins);
    localStorage.setItem('cm_litecoin', litecoinBalance);
    localStorage.setItem('cm_rooms', currentRoomsOwned);
    localStorage.setItem('cm_inventory', JSON.stringify(inventory));
    localStorage.setItem('cm_grid', JSON.stringify(gridLayout));
}

// NAVEGAÇÃO MENU LATERAL
document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
        if (button.classList.contains('logout-btn')) return;
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        const text = button.innerText.toLowerCase();
        if (text.includes('mineração')) document.getElementById('tab-kitchen').classList.add('active');
        if (text.includes('loja')) document.getElementById('tab-shop').classList.add('active');
        if (text.includes('inventário')) document.getElementById('tab-inventory').classList.add('active');
    });
});

// COMPRAR ITEM DA LOJA
function buyItem(name, price, hashPower) {
    if (caféCoins >= price) {
        caféCoins -= price;
        inventory.push({ name: name, hash: hashPower });
        saveGame(); 
        updateInterface(); 
        renderInventory();
        alert(`🛒 ${name} comprado! Verifique seu Inventário para ativar.`);
    } else {
        alert("❌ Saldo de CaféCoins (CC) insuficiente!");
    }
}

// RENDERIZAR INVENTÁRIO
function renderInventory() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = inventory.length === 0 ? '<p class="empty-msg">Seu inventário está vazio. Visite a loja!</p>' : '';
    
    inventory.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'inventory-card';
        card.innerHTML = `<h3>${item.name}</h3><p class="desc">Poder: +${item.hash.toFixed(2)} H/s</p><button class="use-btn">Ligar Máquina</button>`;
        card.querySelector('.use-btn').addEventListener('click', () => deployToRack(index));
        container.appendChild(card);
    });
}

// INSTALAR MAQUINA NO BLOCO
function deployToRack(index) {
    let foundSlot = null;
    for (let r = 1; r <= 2; r++) {
        for (let s = 1; s <= 3; s++) {
            let slotId = `shelf-${r}-${s}`;
            if (gridLayout[slotId] === null) { foundSlot = slotId; break; }
        }
        if (foundSlot) break;
    }
    if (!foundSlot) { alert("❌ Seus blocos estão cheios! Compre uma Nova Sala."); return; }

    gridLayout[foundSlot] = inventory.splice(index, 1)[0];
    saveGame(); 
    renderInventory(); 
    rebuildKitchenGrid();
}

// REMOVER MAQUINA DO BLOCO
function removeFromRack(slotId) {
    if (!gridLayout[slotId]) return;
    inventory.push(gridLayout[slotId]);
    gridLayout[slotId] = null;
    saveGame(); 
    renderInventory(); 
    rebuildKitchenGrid();
}

// ATUALIZAR INTERFACE DA COZINHA
function rebuildKitchenGrid() {
    totalHash = 0.00; 
    placedItemsCount = 0;
    for (let slotId in gridLayout) {
        const slotElement = document.getElementById(slotId);
        if (!slotElement) continue;
        
        if (gridLayout[slotId]) {
            let item = gridLayout[slotId];
            totalHash += item.hash; 
            placedItemsCount++;
            slotElement.innerHTML = `<div class="installed-miner">${item.name}<br>${item.hash} H/s</div>`;
            slotElement.querySelector('.installed-miner').addEventListener('click', () => removeFromRack(slotId));
        } else {
            slotElement.innerHTML = `<div class="empty-square">Vazio</div>`;
        }
    }
    isMiningActive = totalHash > 0;
    if (!isMiningActive) {
        document.getElementById('timer-banner').className = "timer-banner";
        document.getElementById('timer-banner').innerText = "⚠️ SISTEMA DESLIGADO: Coloque uma máquina para iniciar a mineração.";
    }
    document.getElementById('rack-count').innerText = placedItemsCount;
    updateInterface();
}

// COMPRAR SALA
document.getElementById('buy-room-btn').addEventListener('click', () => {
    if (currentRoomsOwned >= maxRooms) { alert("❌ Capacidade máxima atingida!"); return; }
    if (caféCoins >= roomCost) {
        caféCoins -= roomCost; 
        currentRoomsOwned++; 
        saveGame(); 
        updateRoomDisplay(); 
        updateInterface();
        alert(`🎉 Sala ${currentRoomsOwned} adquirida!`);
    } else { 
        alert(`❌ Você precisa de ${roomCost.toFixed(2)} CaféCoins.`); 
    }
});

function updateRoomDisplay() {
    let display = document.getElementById('room-name-display');
    if (display) display.innerText = currentRoomsOwned > 1 ? `SALA EXPANDIDA (${currentRoomsOwned}/${maxRooms})` : `SALA INICIAL (1/3)`;
}

// BOTÃO DEPOSITAR - MOSTRA SEU ENDEREÇO
document.getElementById('deposit-btn').addEventListener('click', () => {
    const SEU_ENDERECO = "LTgVfVjSUA_COLOCA_SEU_ENDERECO_LTC_AQUI"; // TROCA AQUI PELO SEU
    
    alert(`📥 DEPÓSITO LITECOIN LTC\n\nEndereço para depósito:\n${SEU_ENDERECO}\n\nMínimo: 0.001 LTC\nDepósitos são creditados em até 24h após 3 confirmações da rede.`);
});

// BOTÃO ADMIN SECRETO - APERTA 3 VEZES NO LOGO PRA APARECER
let logoClicks = 0;
document.querySelector('.logo').addEventListener('click', () => {
    logoClicks++;
    if (logoClicks === 3) {
        const valor = prompt("🔧 PAINEL ADMIN\n\nDigite quanto LTC adicionar ao seu saldo:");
        if (valor && !isNaN(valor) && parseFloat(valor) > 0) {
            litecoinBalance += parseFloat(valor);
            saveGame();
            updateInterface();
            alert(`✅ Adicionado ${parseFloat(valor).toFixed(8)} LTC ao seu saldo!`);
        }
        logoClicks = 0;
    }
    setTimeout(() => { logoClicks = 0 }, 2000); // Reseta se demorar
});

// MODAL DE SAQUE - USUÁRIO DIGITA O ENDEREÇO
const withdrawModal = document.getElementById('withdraw-modal');
const walletInput = document.getElementById('wallet-input');
const withdrawAmountInput = document.getElementById('withdraw-amount-input');

document.getElementById('withdraw-btn').addEventListener('click', () => {
    document.getElementById('modal-available-matic').innerText = litecoinBalance.toFixed(8);
    walletInput.value = ''; 
    withdrawAmountInput.value = ''; 
    withdrawModal.classList.add('open');
});

document.getElementById('close-modal-btn').addEventListener('click', () => withdrawModal.classList.remove('open'));

document.getElementById('confirm-withdraw-btn').addEventListener('click', () => {
    const address = walletInput.value.trim(); 
    const amount = parseFloat(withdrawAmountInput.value);
    
    if (address.length < 26 || isNaN(amount) || amount <= 0 || amount > litecoinBalance) { 
        alert("❌ Endereço inválido ou saldo insuficiente."); 
        return; 
    }
    if (amount < 0.001) {
        alert("❌ Valor mínimo de saque: 0.001 LTC");
        return;
    }
    
    litecoinBalance -= amount; 
    saveGame(); 
    updateInterface(); 
    withdrawModal.classList.remove('open');
    alert(`📤 Solicitação de saque enviada!\n\n${amount.toFixed(8)} LTC para: ${address}\n\nO saque será processado em até 24h.`);
});

// CRONÔMETRO DE 10 MINUTOS
setInterval(() => {
    if (!isMiningActive) return;
    timeLeft--;
    let mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
    document.getElementById('timer-banner').className = "timer-banner active-mining";
    document.getElementById('timer-banner').innerText = `⏳ Bloco ativo! Recompensa em: ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

    if (timeLeft <= 0) {
        let rewardCc = totalHash / 100;
        caféCoins += rewardCc; 
        timeLeft = 600; 
        saveGame();
        alert(`🎁 Bloco finalizado! Suas máquinas geraram +${rewardCc.toFixed(4)} CaféCoins.`);
    }
    updateInterface();
}, 1000);

function updateInterface() {
    document.getElementById('cafecoin-balance').innerText = caféCoins.toFixed(2);
    document.getElementById('Litcoin-balance').innerText = litecoinBalance.toFixed(8);
    document.getElementById('mining-power').innerText = totalHash.toFixed(2);
}

// INICIALIZAÇÃO
updateRoomDisplay(); 
rebuildKitchenGrid(); 
renderInventory();
updateInterface();
