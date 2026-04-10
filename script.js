const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let snackCoins = parseInt(localStorage.getItem("snackCoins")) || 0;
let snackPurchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
let snackEquippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
let snackPurchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
let snackEquippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

const snackSkins = [
    { id: "default", name: "Green", color: "lime", price: 0 },
    { id: "blue", name: "Blue", color: "#3498db", price: 10 },
    { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
    { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
];

const snackBackgrounds = [
    { id: "black", name: "Black", color: "black", price: 0 },
    { id: "darkgrey", name: "Grey", color: "#2c3e50", price: 10 },
    { id: "darkgreen", name: "Forest", color: "#1b262c", price: 20 },
    { id: "navy", name: "Navy", color: "#0f3460", price: 30 },
];

let snack = [
    { x: 10, y: 10 },
];

let snackFood = { x: 5, y: 5 };
const snackColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];
let snackFoodColor = snackColors[0];

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

    lastDx = dx;
    lastDy = dy;

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
    if (head.x === snackFood.x && head.y === snackFood.y) {
        score++;
        snackCoins++;
        saveGameData();
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = snackCoins;
        spawnFood();
    } else {
        snack.pop();
    }
}

function spawnFood() {
    snackFood.x = Math.floor(Math.random() * tileCount);
    snackFood.y = Math.floor(Math.random() * tileCount);
    snackFoodColor = snackColors[Math.floor(Math.random() * snackColors.length)];

    // Make sure food doesn't spawn on snack
    for (let i = 0; i < snack.length; i++) {
        if (snack[i].x === snackFood.x && snack[i].y === snackFood.y) {
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
    lastDx = 0;
    lastDy = 0;
    gameStarted = false;
    score = 0;
    document.getElementById("score").innerText = score;
    spawnFood();
}

function saveGameData() {
    localStorage.setItem("snackCoins", snackCoins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(snackPurchasedSkins));
    localStorage.setItem("snackEquippedSkin", snackEquippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(snackPurchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", snackEquippedBackground);
}

// Initial UI update
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("coins").innerText = snackCoins;
    spawnFood();
    renderShop();
});

function renderShop() {
    const skinShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("snack-backgrounds");

    skinShop.innerHTML = "";
    bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        const item = createShopItem(skin, "skin");
        skinShop.appendChild(item);
    });

    snackBackgrounds.forEach(bg => {
        const item = createShopItem(bg, "background");
        bgShop.appendChild(item);
    });
}

function createShopItem(data, type) {
    const div = document.createElement("div");
    div.className = "shop-item";

    const isOwned = type === "skin" ? snackPurchasedSkins.includes(data.id) : snackPurchasedBackgrounds.includes(data.id);
    const isEquipped = type === "skin" ? snackEquippedSkin === data.id : snackEquippedBackground === data.id;

    if (isOwned) div.classList.add("owned");
    if (isEquipped) div.classList.add("equipped");

    div.innerHTML = `
        <div class="skin-preview" style="background-color: ${data.color}"></div>
        <span class="item-name">${data.name}</span>
        <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : data.price + " Coins"}</span>
    `;

    div.onclick = () => {
        if (isOwned) {
            if (type === "skin") snackEquippedSkin = data.id;
            else snackEquippedBackground = data.id;
        } else {
            if (snackCoins >= data.price) {
                snackCoins -= data.price;
                if (type === "skin") {
                    snackPurchasedSkins.push(data.id);
                    snackEquippedSkin = data.id;
                } else {
                    snackPurchasedBackgrounds.push(data.id);
                    snackEquippedBackground = data.id;
                }
                document.getElementById("coins").innerText = snackCoins;
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
    const bg = snackBackgrounds.find(b => b.id === snackEquippedBackground) || snackBackgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = snackFoodColor;
    ctx.beginPath();
    ctx.arc(snackFood.x * gridSize + gridSize / 2, snackFood.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === snackEquippedSkin) || snackSkins[0];
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

gameLoop();
