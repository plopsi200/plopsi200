const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let coins = parseInt(localStorage.getItem("snackCoins")) || 0;
let highScore = parseInt(localStorage.getItem("snackHighScore")) || 0;
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
    { id: "darkgrey", name: "Grey", color: "#2c3e50", price: 10 },
    { id: "darkgreen", name: "Forest", color: "#1b262c", price: 20 },
    { id: "navy", name: "Navy", color: "#0f3460", price: 30 },
];

const snackColors = ["#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FFF333", "#33FFF3"];

let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: "red" };
let dx = 0;
let dy = 0;
let gameStarted = false;

function gameLoop() {
    update();
    draw();
    setTimeout(gameLoop, 100);
}

function update() {
    if (!gameStarted) return;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        coins++;
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        saveGameData();
        spawnFood();
    } else {
        snake.pop();
    }
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    food.color = snackColors[Math.floor(Math.random() * snackColors.length)];

    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === food.x && snake[i].y === food.y) {
            spawnFood();
            return;
        }
    }
}

function gameOver() {
    alert("Game Over! Score: " + score);
    if (score > highScore) {
        highScore = score;
        document.getElementById("high-score").innerText = highScore;
    }
    saveGameData();
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    score = 0;
    gameStarted = false;
    document.getElementById("score").innerText = score;
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

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("coins").innerText = coins;
    document.getElementById("high-score").innerText = highScore;
    spawnFood();
    renderShop();
});

function renderShop() {
    const snackShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("snack-backgrounds");

    snackShop.innerHTML = "";
    bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        snackShop.appendChild(createShopItem(skin, "skin"));
    });

    backgrounds.forEach(bg => {
        bgShop.appendChild(createShopItem(bg, "background"));
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
                if (type === "skin") {
                    purchasedSkins.push(data.id);
                    equippedSkin = data.id;
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id;
                }
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
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snake.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });
}

window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        gameStarted = true;
    }
    switch (e.key) {
        case "ArrowUp": if (dy !== 1) { dx = 0; dy = -1; } break;
        case "ArrowDown": if (dy !== -1) { dx = 0; dy = 1; } break;
        case "ArrowLeft": if (dx !== 1) { dx = -1; dy = 0; } break;
        case "ArrowRight": if (dx !== -1) { dx = 1; dy = 0; } break;
    }
});

gameLoop();
