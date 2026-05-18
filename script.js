const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let snackCoins = parseInt(localStorage.getItem("snackCoins")) || 0;
let purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
let equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
let purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
let equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

const snackSkins = [
    { id: "default", name: "Green", color: "lime", price: 0 },
    { id: "blue", name: "Blue", color: "#3498db", price: 10 },
    { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
    { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
];

const backgrounds = [
    { id: "black", name: "Black", color: "black", price: 0 },
    { id: "forest", name: "Forest", color: "#1b262c", price: 20 },
    { id: "royal", name: "Royal", color: "#4169E1", price: 30 },
    { id: "midnight", name: "Midnight", color: "#0f3460", price: 40 },
];

const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

let snack = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: foodColors[0] };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;
let gameStarted = false;

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

function update() {
    if (!gameStarted) return;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision
    for (let part of snack) {
        if (head.x === part.x && head.y === part.y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);
    lastDx = dx;
    lastDy = dy;

    if (head.x === food.x && head.y === food.y) {
        score++;
        snackCoins++;
        saveGameData();
        updateUI();
        spawnFood();
    } else {
        snack.pop();
    }
}

function spawnFood() {
    let newX, newY;
    let onSnack = true;

    while (onSnack) {
        newX = Math.floor(Math.random() * tileCount);
        newY = Math.floor(Math.random() * tileCount);
        onSnack = snack.some(part => part.x === newX && part.y === newY);
    }

    food.x = newX;
    food.y = newY;
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    gameStarted = false;
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").classList.remove("hidden");
    saveGameData();
}

function restartGame() {
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;
    gameStarted = false;
    updateUI();
    spawnFood();
    document.getElementById("game-over-overlay").classList.add("hidden");
}

function saveGameData() {
    localStorage.setItem("snackCoins", snackCoins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("coins").innerText = snackCoins;
}

function renderShop() {
    const skinShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("backgrounds");

    skinShop.innerHTML = "";
    bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        skinShop.appendChild(createShopItem(skin, "skin"));
    });

    backgrounds.forEach(bg => {
        bgShop.appendChild(createShopItem(bg, "background"));
    });
}

function createShopItem(data, type) {
    const div = document.createElement("div");
    div.className = "shop-item";

    const updateItemUI = () => {
        const isOwned = type === "skin" ? purchasedSkins.includes(data.id) : purchasedBackgrounds.includes(data.id);
        const isEquipped = type === "skin" ? equippedSkin === data.id : equippedBackground === data.id;

        div.classList.toggle("owned", isOwned);
        div.classList.toggle("equipped", isEquipped);

        div.innerHTML = `
            <div class="skin-preview" style="background-color: ${data.color}"></div>
            <span class="item-name">${data.name}</span>
            <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : data.price + " Coins"}</span>
        `;
    };

    updateItemUI();

    div.onclick = () => {
        const isOwned = type === "skin" ? purchasedSkins.includes(data.id) : purchasedBackgrounds.includes(data.id);
        if (isOwned) {
            if (type === "skin") equippedSkin = data.id;
            else equippedBackground = data.id;
        } else {
            if (snackCoins >= data.price) {
                snackCoins -= data.price;
                if (type === "skin") {
                    purchasedSkins.push(data.id);
                    equippedSkin = data.id;
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id;
                }
                updateUI();
            } else {
                alert("Not enough coins!");
                return;
            }
        }
        saveGameData();
        renderShop();
    };

    return div;
}

function draw() {
    // Clear with background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = food.color;
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    ctx.arc(centerX, centerY, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        gameStarted = true;
    }

    switch (e.key) {
        case "ArrowUp":
            if (lastDy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
            if (lastDy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
            if (lastDx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
            if (lastDx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("restart-btn").onclick = restartGame;
    updateUI();
    renderShop();
    spawnFood();
    gameLoop();
});
