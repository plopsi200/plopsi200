const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Game State
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

const foodColors = ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];

let snack = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: foodColors[0] };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

let lastRenderTime = 0;
const gameSpeed = 10; // FPS

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / gameSpeed) return;
    lastRenderTime = currentTime;

    update();
    draw();
}

function update() {
    if (dx === 0 && dy === 0) return;

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
    lastDx = dx;
    lastDy = dy;

    // Check if snack ate food
    if (head.x === food.x && head.y === food.y) {
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
    if (snack.length >= tileCount * tileCount) return;

    let newFoodX, newFoodY;
    let foodOnSnack = true;

    while (foodOnSnack) {
        newFoodX = Math.floor(Math.random() * tileCount);
        newFoodY = Math.floor(Math.random() * tileCount);
        foodOnSnack = false;
        for (let part of snack) {
            if (part.x === newFoodX && part.y === newFoodY) {
                foodOnSnack = true;
                break;
            }
        }
    }

    food.x = newFoodX;
    food.y = newFoodY;
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    saveGameData();
}

function restartGame() {
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;
    document.getElementById("score").innerText = score;
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

function renderShop() {
    const snackShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("background-skins");

    snackShop.innerHTML = "";
    bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        snackShop.appendChild(createShopItem(skin, "skin"));
    });

    backgrounds.forEach(bg => {
        bgShop.appendChild(createShopItem(bg, "background"));
    });
}

function createShopItem(itemData, type) {
    const div = document.createElement("div");
    div.className = "shop-item";

    const isOwned = type === "skin" ? purchasedSkins.includes(itemData.id) : purchasedBackgrounds.includes(itemData.id);
    const isEquipped = type === "skin" ? equippedSkin === itemData.id : equippedBackground === itemData.id;

    if (isOwned) div.classList.add("owned");
    if (isEquipped) div.classList.add("equipped");

    div.innerHTML = `
        <div class="skin-preview" style="background-color: ${itemData.color}"></div>
        <span class="item-name">${itemData.name}</span>
        <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : itemData.price + " Coins"}</span>
    `;

    div.onclick = () => {
        if (isOwned) {
            if (type === "skin") equippedSkin = itemData.id;
            else equippedBackground = itemData.id;
        } else {
            if (snackCoins >= itemData.price) {
                snackCoins -= itemData.price;
                if (type === "skin") purchasedSkins.push(itemData.id);
                else purchasedBackgrounds.push(itemData.id);
                if (type === "skin") equippedSkin = itemData.id;
                else equippedBackground = itemData.id;
                document.getElementById("coins").innerText = snackCoins;
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
    // Background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Food (Circle)
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Snack
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

document.getElementById("restart-btn").onclick = restartGame;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("coins").innerText = snackCoins;
    spawnFood();
    renderShop();
    draw();
    requestAnimationFrame(gameLoop);
});
