const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let coins = parseInt(localStorage.getItem("snackCoins")) || 0;
let highScore = parseInt(localStorage.getItem("snackHighScore")) || 0;
let purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
let equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
let purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["dark"];
let equippedBackground = localStorage.getItem("snackEquippedBackground") || "dark";

let gameStarted = false;

const snackSkins = [
    { id: "default", name: "Green", color: "#2ecc71", price: 0 },
    { id: "blue", name: "Blue", color: "#3498db", price: 10 },
    { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
    { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
    { id: "crimson", name: "Crimson", color: "#e74c3c", price: 30 },
];

const backgrounds = [
    { id: "dark", name: "Midnight", color: "#1a1a2e", price: 0 },
    { id: "deep", name: "Deep Sea", color: "#16213e", price: 15 },
    { id: "forest", name: "Forest", color: "#1b262c", price: 25 },
    { id: "void", name: "The Void", color: "#000000", price: 40 },
];

const snackColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

let snack = [
    { x: 10, y: 10 },
];

let food = { x: 5, y: 5, color: snackColors[0] };

let dx = 0;
let dy = 0;

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

function update() {
    if (!gameStarted) return;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Collision with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Collision with self
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);

    // Check if snack ate food
    if (head.x === food.x && head.y === food.y) {
        score++;
        coins++;
        if (score > highScore) {
            highScore = score;
        }
        saveGameData();
        updateUI();
        spawnFood();
    } else {
        snack.pop();
    }
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    food.color = snackColors[Math.floor(Math.random() * snackColors.length)];

    // Make sure food doesn't spawn on snack
    for (let i = 0; i < snack.length; i++) {
        if (snack[i].x === food.x && snack[i].y === food.y) {
            spawnFood();
            return;
        }
    }
}

function gameOver() {
    alert("Game Over! Score: " + score);
    saveGameData();
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    gameStarted = false;
    updateUI();
    spawnFood();
}

function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackHighScore", highScore);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

function updateUI() {
    document.getElementById("score").innerText = score;
    document.getElementById("coins").innerText = coins;
    document.getElementById("high-score").innerText = highScore;
}

// Initial UI update
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    renderShop();
    spawnFood();
});

function renderShop() {
    const snackSkinsContainer = document.getElementById("snack-skins");
    const backgroundsContainer = document.getElementById("snack-backgrounds");

    snackSkinsContainer.innerHTML = "";
    backgroundsContainer.innerHTML = "";

    snackSkins.forEach(skin => {
        const item = createShopItem(skin, "skin");
        snackSkinsContainer.appendChild(item);
    });

    backgrounds.forEach(bg => {
        const item = createShopItem(bg, "background");
        backgroundsContainer.appendChild(item);
    });
}

function createShopItem(data, type) {
    const div = document.createElement("div");
    div.className = "shop-item";

    const isOwned = type === "skin" ? purchasedSkins.includes(data.id) : purchasedBackgrounds.includes(data.id);
    const isEquipped = type === "skin" ? equippedSkin === data.id : equippedBackground === data.id;

    if (isOwned) div.classList.add("owned");
    if (isEquipped) div.classList.add("equipped");

    div.innerHTML = `
        <div class="skin-preview" style="background-color: ${data.color}"></div>
        <span class="item-name">${data.name}</span>
        <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Equip") : data.price + " Coins"}</span>
    `;

    div.onclick = () => {
        if (isOwned) {
            if (type === "skin") equippedSkin = data.id;
            else equippedBackground = data.id;
        } else {
            if (coins >= data.price) {
                coins -= data.price;
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
    // Clear canvas with equipped background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as circle
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach((part, index) => {
        // Head is slightly different or has eyes? For now just fill
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });

    if (!gameStarted) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Press an Arrow Key to Start", canvas.width/2, canvas.height/2);
    }
}

window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        gameStarted = true;
    }
    switch (e.key) {
        case "ArrowUp":
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

gameLoop();
