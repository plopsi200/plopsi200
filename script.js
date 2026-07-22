// Globals and configuration
let canvas;
let ctx;
const gridSize = 20;
let tileCount;

let score = 0;
let coins = parseInt(localStorage.getItem("snackCoins")) || 0;
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
    { id: "grey", name: "Grey", color: "#7f8c8d", price: 10 },
    { id: "forest", name: "Forest", color: "#27ae60", price: 20 },
    { id: "navy", name: "Navy", color: "#2980b9", price: 30 },
];

const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];
let foodColor = foodColors[0];

let snack = [
    { x: 10, y: 10 },
];

let food = { x: 5, y: 5 };

// Movement vectors
let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

// Timing variables for fixed 10 FPS game loop
let lastFrameTime = 0;
const frameInterval = 100; // 10 FPS = 100ms per frame

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Display initial values
    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    // Setup restart button
    document.getElementById("restart-btn").addEventListener("click", restartGame);

    // Initial state setup
    spawnFood();
    renderShop();
    draw();

    // Start fixed 10 FPS game loop
    requestAnimationFrame(gameLoop);
});

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        // Adjust for potential lag spikes
        lastFrameTime = timestamp - (elapsed % frameInterval);

        update();
        draw();
    }
}

function update() {
    // If movement hasn't started yet, pause the logic
    if (dx === 0 && dy === 0) return;

    // Save current movement vector direction for 180 turn checks
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Collision with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Collision with self
    // In Snack Game 2.0, self-collision occurs before the tail segment is removed (popped) during a move.
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
        saveGameData();
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        spawnFood();
    } else {
        snack.pop();
    }
}

function spawnFood() {
    // Safety check to prevent infinite loops when the game grid is completely filled
    if (snack.length >= tileCount * tileCount) return;

    // Iterative search for an empty tile to spawn food, avoiding deep recursion
    let foundEmpty = false;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!foundEmpty && attempts < maxAttempts) {
        attempts++;
        const rx = Math.floor(Math.random() * tileCount);
        const ry = Math.floor(Math.random() * tileCount);

        let onSnack = false;
        for (let i = 0; i < snack.length; i++) {
            if (snack[i].x === rx && snack[i].y === ry) {
                onSnack = true;
                break;
            }
        }

        if (!onSnack) {
            food.x = rx;
            food.y = ry;
            foundEmpty = true;
        }
    }

    // Select a random food color
    foodColor = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    // Show final score and bring up overlay
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";

    // Reset movement vectors
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Persist current session coins
    saveGameData();
}

function restartGame() {
    // Reset state variables
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;

    document.getElementById("score").innerText = score;

    // Hide game over overlay
    document.getElementById("game-over-overlay").style.display = "none";

    // Re-spawn food and draw immediately
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
            if (type === "skin") {
                equippedSkin = data.id;
            } else {
                equippedBackground = data.id;
            }
        } else {
            if (coins >= data.price) {
                coins -= data.price;
                if (type === "skin") {
                    purchasedSkins.push(data.id);
                    equippedSkin = data.id; // Automatically equip upon purchase
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // Automatically equip upon purchase
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Not enough coins!");
                return;
            }
        }
        saveGameData();
        renderShop();
        draw(); // Instantly update canvas
    };

    return div;
}

function draw() {
    if (!ctx) return;

    // Clear canvas with equipped background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as a circle
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    const radius = gridSize / 2;
    const centerX = food.x * gridSize + radius;
    const centerY = food.y * gridSize + radius;
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack with equipped skin, maintaining visual gaps
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

window.addEventListener("keydown", e => {
    // If game over overlay is visible, ignore keyboard inputs
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case "ArrowUp":
            // Prevent 180 turn relative to last frame direction
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
