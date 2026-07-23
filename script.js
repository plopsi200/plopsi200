// Global variables and state
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

let snack = [
    { x: 10, y: 10 },
];

let food = { x: 5, y: 5, color: "#e74c3c" };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

let lastFrameTime = 0;
const frameInterval = 100; // 10 FPS (100ms)

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Display loaded coins and score
    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    // Setup restart button listener
    document.getElementById("restart-btn").addEventListener("click", restartGame);

    // Initial render of shop and canvas
    renderShop();
    spawnFood();
    draw();

    // Start loop
    requestAnimationFrame(gameLoop);
});

// Game Loop: fixed speed (10 FPS) using requestAnimationFrame
function gameLoop(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        // Adjust for drift
        lastFrameTime = timestamp - (elapsed % frameInterval);
        update();
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// Update game state
function update() {
    // Pause movement logic if snake isn't moving
    if (dx === 0 && dy === 0) return;

    // Save actual previous movement direction before changing
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision check
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision check (before popping the tail)
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);

    // Check if food eaten
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

// Draw elements on canvas
function draw() {
    if (!ctx) return;

    // Draw background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as circle
    ctx.beginPath();
    const radius = gridSize / 2;
    const centerX = food.x * gridSize + radius;
    const centerY = food.y * gridSize + radius;
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();
    ctx.closePath();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// Spawning food with random color on an empty tile
function spawnFood() {
    if (!tileCount) return;

    // Safety check: if canvas is completely full, avoid infinite loops
    if (snack.length >= tileCount * tileCount) return;

    let valid = false;
    let newX, newY;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!valid && attempts < maxAttempts) {
        newX = Math.floor(Math.random() * tileCount);
        newY = Math.floor(Math.random() * tileCount);
        attempts++;

        valid = true;
        for (let i = 0; i < snack.length; i++) {
            if (snack[i].x === newX && snack[i].y === newY) {
                valid = false;
                break;
            }
        }
    }

    if (valid) {
        food.x = newX;
        food.y = newY;
        // Assign random color from array
        food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
    }
}

// Save data to localStorage
function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

// Handle Game Over
function gameOver() {
    // Reset vectors so game pauses
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Display overlay
    document.getElementById("final-score").innerText = score;
    const overlay = document.getElementById("game-over-overlay");
    overlay.style.display = "flex";

    // Persist current session coins
    saveGameData();
}

// Restart game state
function restartGame() {
    snack = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;
    document.getElementById("score").innerText = score;

    // Hide overlay
    const overlay = document.getElementById("game-over-overlay");
    overlay.style.display = "none";

    spawnFood();
    draw();
}

// Render the shop dynamically
function renderShop() {
    const snackShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("background-skins");

    if (!snackShop || !bgShop) return;

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

// Create individual shop item element
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
        draw();
    };

    return div;
}

// Keydown event listener for inputs and preventing scroll
window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    // Ignore keydown if game over overlay is open
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return;
    }

    switch (e.key) {
        case "ArrowUp":
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
