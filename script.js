const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let coins = parseInt(localStorage.getItem("snackCoins")) || 0;
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

let lastTime = 0;
const fps = 10;
const interval = 1000 / fps;

function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    if (delta >= interval) {
        lastTime = timestamp - (delta % interval);
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    if (dx === 0 && dy === 0) return;

    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        coins++;
        saveGameData();
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        spawnFood();
    } else {
        snack.pop();
    }
}

function spawnFood() {
    if (snack.length >= tileCount * tileCount) return;

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
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";
    saveGameData();
    dx = 0;
    dy = 0;
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
    localStorage.setItem("snackCoins", coins);
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

    snackSkins.forEach(skin => snackShop.appendChild(createShopItem(skin, "skin")));
    backgrounds.forEach(bg => bgShop.appendChild(createShopItem(bg, "background")));
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
            if (coins >= data.price) {
                coins -= data.price;
                if (type === "skin") purchasedSkins.push(data.id);
                else purchasedBackgrounds.push(data.id);
                if (type === "skin") equippedSkin = data.id;
                else equippedBackground = data.id;
                document.getElementById("coins").innerText = coins;
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
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = food.color;
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    ctx.arc(centerX, centerY, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

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
    document.getElementById("coins").innerText = coins;
    spawnFood();
    renderShop();
    draw();
    requestAnimationFrame(gameLoop);
});
