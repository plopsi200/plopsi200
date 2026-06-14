const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let snackCoins = parseInt(localStorage.getItem("snackCoins")) || 0;
let purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["green"];
let equippedSkin = localStorage.getItem("snackEquippedSkin") || "green";
let purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
let equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

const snackSkins = [
    { id: "green", name: "Green", color: "lime", price: 0 },
    { id: "blue", name: "Blue", color: "#3498db", price: 10 },
    { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
    { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
];

const backgrounds = [
    { id: "black", name: "Black", color: "black", price: 0 },
    { id: "grey", name: "Grey", color: "#2c3e50", price: 10 },
    { id: "forest", name: "Forest", color: "#1b262c", price: 20 },
    { id: "navy", name: "Navy", color: "#0f3460", price: 30 },
];

const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

let snack = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: foodColors[0] };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

function update() {
    if (dx === 0 && dy === 0) return;

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
    let newFoodX, newFoodY;
    let onSnack = true;

    while(onSnack) {
        newFoodX = Math.floor(Math.random() * tileCount);
        newFoodY = Math.floor(Math.random() * tileCount);
        onSnack = false;
        for (let part of snack) {
            if (part.x === newFoodX && part.y === newFoodY) {
                onSnack = true;
                break;
            }
        }
    }

    food.x = newFoodX;
    food.y = newFoodY;
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    dx = 0;
    dy = 0;
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";
    saveGameData();
}

function restartGame() {
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;
    updateUI();
    document.getElementById("game-over-overlay").style.display = "none";
    spawnFood();
    draw();
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

// Initial UI update
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    renderShop();
    spawnFood();
    draw();
    document.getElementById("restart-btn").onclick = restartGame;
});

function renderShop() {
    const snackShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("background-skins");

    snackShop.innerHTML = "";
    bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        const item = createShopItem(skin, "skin");
        snackShop.appendChild(item);
    });

    backgrounds.forEach(bg => {
        const item = createShopItem(bg, "background");
        bgShop.appendChild(item);
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
        <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : data.price + " Coins"}</span>
    `;

    div.onclick = () => {
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
        draw();
    };

    return div;
}

function draw() {
    // Clear canvas with equipped background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food
    ctx.fillStyle = food.color;
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

window.addEventListener("keydown", e => {
    if (document.getElementById("game-over-overlay").style.display === "flex") return;

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
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
