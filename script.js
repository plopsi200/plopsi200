// Snack Game 2.0 Configuration and Logic

// Food colors variety
const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

// Shop configurables
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

// Core state variables (will be initialized or loaded within DOMContentLoaded)
let canvas, ctx;
const gridSize = 20;
let tileCount;

let score = 0;
let coins = 0;
let purchasedSkins = ["default"];
let equippedSkin = "default";
let purchasedBackgrounds = ["black"];
let equippedBackground = "black";

let snack = [];
let food = { x: 5, y: 5 };
let foodColor = foodColors[0];

// Movement vectors
let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

// Game loop timing (10 FPS)
let lastFrameTime = 0;
const gameInterval = 100; // ms

function initGame() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Load persisted state
    coins = parseInt(localStorage.getItem("snackCoins")) || 0;
    purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
    equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
    equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

    // Setup initial DOM content
    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    resetGameVariables();
    spawnFood();
    renderShop();

    // Bind buttons
    document.getElementById("restart-btn").addEventListener("click", restartGame);

    // Initial draw to render starting state immediately
    draw();

    // Start game loop using requestAnimationFrame
    requestAnimationFrame(gameLoop);
}

function resetGameVariables() {
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;
    document.getElementById("score").innerText = score;
}

function gameLoop(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= gameInterval) {
        // Only run updates if user has started moving
        if (dx !== 0 || dy !== 0) {
            update();
        }
        draw();
        lastFrameTime = timestamp - (elapsed % gameInterval);
    }

    requestAnimationFrame(gameLoop);
}

function update() {
    // Record direction used in this logic step to prevent rapid double-taps causing 180s
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision (before tail is popped)
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);

    // Food collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        coins++;
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        saveGameData();
        spawnFood();
    } else {
        snack.pop();
    }
}

function spawnFood() {
    // Grid-fill safety check
    if (snack.length >= tileCount * tileCount) {
        return;
    }

    // Iterative search for empty tiles to avoid deep recursion
    const emptyTiles = [];
    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            let occupied = false;
            for (let i = 0; i < snack.length; i++) {
                if (snack[i].x === x && snack[i].y === y) {
                    occupied = true;
                    break;
                }
            }
            if (!occupied) {
                emptyTiles.push({ x, y });
            }
        }
    }

    if (emptyTiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyTiles.length);
        food = emptyTiles[randomIndex];
        // Assign a random color
        const randomColorIndex = Math.floor(Math.random() * foodColors.length);
        foodColor = foodColors[randomColorIndex];
    }
}

function gameOver() {
    // Persist current session coins
    saveGameData();

    // Show Game Over Overlay
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";

    // Reset movement so snake stops
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
}

function restartGame() {
    document.getElementById("game-over-overlay").style.display = "none";
    resetGameVariables();
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
                    equippedSkin = data.id; // Automatically equip on purchase
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // Automatically equip on purchase
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Insufficient funds!");
                return;
            }
        }
        saveGameData();
        renderShop();
        draw(); // Redraw immediately to apply visual changes without a tick delay
    };

    return div;
}

function draw() {
    // Clear canvas with equipped background color
    const currentBg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = currentBg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circular food item
    ctx.fillStyle = foodColor;
    ctx.beginPath();
    const radius = (gridSize - 1) / 2;
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw snack with equipped skin color
    const currentSkin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = currentSkin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// Global Key Listeners
window.addEventListener("keydown", e => {
    // Prevent scrolling with arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    // Ignore key presses if game over overlay is active
    const gameOverOverlay = document.getElementById("game-over-overlay");
    if (gameOverOverlay && gameOverOverlay.style.display === "flex") {
        return;
    }

    switch (e.key) {
        case "ArrowUp":
            // Prevent 180-degree turn
            if (lastDy !== 1) {
                dx = 0;
                dy = -1;
            }
            break;
        case "ArrowDown":
            // Prevent 180-degree turn
            if (lastDy !== -1) {
                dx = 0;
                dy = 1;
            }
            break;
        case "ArrowLeft":
            // Prevent 180-degree turn
            if (lastDx !== 1) {
                dx = -1;
                dy = 0;
            }
            break;
        case "ArrowRight":
            // Prevent 180-degree turn
            if (lastDx !== -1) {
                dx = 1;
                dy = 0;
            }
            break;
    }
});

// Start initialization once DOM is fully parsed
document.addEventListener("DOMContentLoaded", initGame);
