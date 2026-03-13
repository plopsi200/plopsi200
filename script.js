const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let coins = parseInt(localStorage.getItem("snakeCoins")) || 0;
let purchasedSkins = JSON.parse(localStorage.getItem("snakePurchasedSkins")) || ["default"];
let equippedSkin = localStorage.getItem("snakeEquippedSkin") || "default";
let purchasedBackgrounds = JSON.parse(localStorage.getItem("snakePurchasedBackgrounds")) || ["black"];
let equippedBackground = localStorage.getItem("snakeEquippedBackground") || "black";

const snakeSkins = [
    { id: "default", name: "Green", color: "lime", price: 0 },
    { id: "blue", name: "Blue", color: "#3498db", price: 10 },
    { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
    { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
];

const backgrounds = [
    { id: "black", name: "Black", color: "black", price: 0 },
    { id: "darkgrey", name: "Grey", color: "#2c3e50", price: 10 },
    { id: "darkgreen", name: "Forest", color: "#1b262c", price: 20 },
    { id: "navy", name: "Navy", color: "#0f3460", price: 30 },
];

let snake = [
    { x: 10, y: 10 },
];

let food = { x: 5, y: 5 };

let dx = 0;
let dy = 0;

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

function update() {
    if (dx === 0 && dy === 0) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Collision with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Collision with self
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        score++;
        coins++;
        saveGameData();
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        spawnFood();
    } else {
        snake.pop();
    }
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // Make sure food doesn't spawn on snake
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
            spawnFood();
            return;
        }
    }
}

function gameOver() {
    alert("Game Over! Score: " + score);
    saveGameData();
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    document.getElementById("score").innerText = score;
    spawnFood();
}

function saveGameData() {
    localStorage.setItem("snakeCoins", coins);
    localStorage.setItem("snakePurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snakeEquippedSkin", equippedSkin);
    localStorage.setItem("snakePurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snakeEquippedBackground", equippedBackground);
}

// Initial UI update
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("coins").innerText = coins;
    renderShop();
});

function renderShop() {
    const snakeShop = document.getElementById("snake-skins");
    const bgShop = document.getElementById("backgrounds");

    snakeShop.innerHTML = "";
    bgShop.innerHTML = "";

    snakeSkins.forEach(skin => {
        const item = createShopItem(skin, "skin");
        snakeShop.appendChild(item);
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
            if (coins >= data.price) {
                coins -= data.price;
                if (type === "skin") purchasedSkins.push(data.id);
                else purchasedBackgrounds.push(data.id);
                document.getElementById("coins").innerText = coins;
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

    // Draw food
    ctx.fillStyle = "red";
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);

    // Draw snake with equipped skin
    const skin = snakeSkins.find(s => s.id === equippedSkin) || snakeSkins[0];
    ctx.fillStyle = skin.color;
    snake.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
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
