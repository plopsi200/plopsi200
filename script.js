// Game constants
const gridSize = 20;
let canvas, ctx, tileCount;

// Persistence Keys & Game State variables
let score = 0;
let coins = 0;
let purchasedSkins = [];
let equippedSkin = "";
let purchasedBackgrounds = [];
let equippedBackground = "";

// Shop Definitions
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

// Game movement and positioning variables
let snack = [];
let food = { x: 5, y: 5, color: "#e74c3c" };
let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

// Game timing variables
let lastFrameTime = 0;
const frameInterval = 100; // 10 FPS (100ms per frame)

// Initializing the application inside the DOMContentLoaded event listener to prevent race conditions
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Load data from localStorage
    loadGameData();

    // Setup input listeners
    setupInputListeners();

    // Setup restart button listener
    document.getElementById("restart-btn").addEventListener("click", restartGame);

    // Initial Spawning & Shop Rendering
    spawnFood();
    renderShop();

    // Set UI elements
    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    // Start the game loop
    requestAnimationFrame(gameLoop);
});

function loadGameData() {
    coins = parseInt(localStorage.getItem("snackCoins")) || 0;

    // Parse purchased skins and backgrounds (or default arrays)
    try {
        purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins"));
        if (!Array.isArray(purchasedSkins) || purchasedSkins.length === 0) {
            purchasedSkins = ["default"];
        }
    } catch (e) {
        purchasedSkins = ["default"];
    }

    try {
        purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds"));
        if (!Array.isArray(purchasedBackgrounds) || purchasedBackgrounds.length === 0) {
            purchasedBackgrounds = ["black"];
        }
    } catch (e) {
        purchasedBackgrounds = ["black"];
    }

    equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

    // Fallbacks if loaded ids are invalid
    if (!snackSkins.some(s => s.id === equippedSkin)) {
        equippedSkin = "default";
    }
    if (!backgrounds.some(b => b.id === equippedBackground)) {
        equippedBackground = "black";
    }

    // Reset snack and direction
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
}

function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        // Correctly calculate overflow frames or reset timestamp
        lastFrameTime = timestamp - (elapsed % frameInterval);

        update();
        draw();
    }
}

function update() {
    // If movement hasn't started yet, don't advance snack position
    if (dx === 0 && dy === 0) return;

    // Save the current moving direction as the last executed direction
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision check
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self-collision check occurs before tail is removed (popped)
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    // Add head to snack
    snack.unshift(head);

    // Food collision check
    if (head.x === food.x && head.y === food.y) {
        score++;
        coins++;
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        saveGameData();
        spawnFood();
    } else {
        // Move forward by popping tail
        snack.pop();
    }
}

function spawnFood() {
    // Check if grid is completely full to avoid infinite loop
    if (snack.length >= tileCount * tileCount) return;

    // Iterative search for empty tiles
    let emptyTiles = [];
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

    if (emptyTiles.length === 0) return;

    // Select random empty tile
    const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    food.x = randomTile.x;
    food.y = randomTile.y;

    // Pick a random food color
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    // Stop movement and persistence immediately
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    saveGameData();

    // Show game over overlay
    document.getElementById("final-score").innerText = score;
    const overlay = document.getElementById("game-over-overlay");
    overlay.style.display = "flex";
}

function restartGame() {
    // Hide overlay
    document.getElementById("game-over-overlay").style.display = "none";

    // Reset game state variables
    score = 0;
    document.getElementById("score").innerText = score;

    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    spawnFood();
    draw();
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
                    equippedSkin = data.id; // Auto-equip upon purchase
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // Auto-equip upon purchase
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Not enough coins!");
                return;
            }
        }
        saveGameData();
        renderShop();
        draw(); // Refresh background or snake color immediately
    };

    return div;
}

function draw() {
    if (!ctx) return;

    // Get color for equipped background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as circle
    ctx.fillStyle = food.color;
    ctx.beginPath();
    const radius = gridSize / 2;
    const centerX = food.x * gridSize + radius;
    const centerY = food.y * gridSize + radius;
    ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
    ctx.fill();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        // Draw squares with gaps
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

function setupInputListeners() {
    window.addEventListener("keydown", e => {
        // Check if game-over-overlay is currently visible
        const overlay = document.getElementById("game-over-overlay");
        if (overlay && overlay.style.display === "flex") {
            return; // Ignore keyboard inputs when game over
        }

        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }

        switch (e.key) {
            case "ArrowUp":
                // Prevent 180-degree turn using last executed direction (lastDy)
                if (lastDy !== 1) {
                    dx = 0;
                    dy = -1;
                }
                break;
            case "ArrowDown":
                if (lastDy !== -1) {
                    dx = 0;
                    dy = 1;
                }
                break;
            case "ArrowLeft":
                if (lastDx !== 1) {
                    dx = -1;
                    dy = 0;
                }
                break;
            case "ArrowRight":
                if (lastDx !== -1) {
                    dx = 1;
                    dy = 0;
                }
                break;
        }
    });
}
