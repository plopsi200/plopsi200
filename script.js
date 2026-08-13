let canvas, ctx;
const gridSize = 20;
let tileCount;

let score = 0;
let coins = 0;
let purchasedSkins = ["default"];
let equippedSkin = "default";
let purchasedBackgrounds = ["black"];
let equippedBackground = "black";

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

const foodColors = [
    "#e74c3c",
    "#e67e22",
    "#f1c40f",
    "#2ecc71",
    "#3498db",
    "#9b59b6"
];

let snack = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: "#e74c3c" };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

let lastFrameTime = 0;
const frameInterval = 100; // 10 FPS (100ms per frame)

function initGame() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Load persisted data
    coins = parseInt(localStorage.getItem("snackCoins")) || 0;
    purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
    equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
    equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    // Set up shop
    renderShop();

    // Spawn first food
    spawnFood();

    // Draw initial state (game will be paused until user moves)
    draw();

    // Set up restart button
    document.getElementById("restart-btn").addEventListener("click", () => {
        restartGame();
    });

    // Start game loop
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        // Adjust lastFrameTime to account for interval, keeping game speed constant
        lastFrameTime = timestamp - (elapsed % frameInterval);

        // Run game logic only if not over and initiated
        const overlay = document.getElementById("game-over-overlay");
        const isGameOver = overlay && overlay.style.display === "flex";

        if (!isGameOver) {
            update();
            draw();
        }
    }
}

function update() {
    // Pause game logic if movement hasn't started yet
    if (dx === 0 && dy === 0) return;

    // Record the direction currently executed for this frame to prevent immediate 180-degree turns
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Collision with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self-collision check occurs BEFORE tail segment is popped during move
    // This prevents the snack from moving into the tile currently occupied by its tail
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

function spawnFood() {
    // Safety check to prevent infinite loop when grid is full
    if (snack.length >= tileCount * tileCount) return;

    let valid = false;
    let attempts = 0;
    const maxAttempts = 1000;

    while (!valid && attempts < maxAttempts) {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        attempts++;

        let onSnack = false;
        for (let i = 0; i < snack.length; i++) {
            if (snack[i].x === food.x && snack[i].y === food.y) {
                onSnack = true;
                break;
            }
        }
        if (!onSnack) {
            valid = true;
        }
    }

    // Fallback search if random search fails or takes too long
    if (!valid) {
        for (let x = 0; x < tileCount; x++) {
            for (let y = 0; y < tileCount; y++) {
                let onSnack = false;
                for (let i = 0; i < snack.length; i++) {
                    if (snack[i].x === x && snack[i].y === y) {
                        onSnack = true;
                        break;
                    }
                }
                if (!onSnack) {
                    food.x = x;
                    food.y = y;
                    valid = true;
                    break;
                }
            }
            if (valid) break;
        }
    }

    // Pick random food color from foodColors array
    const randomColorIndex = Math.floor(Math.random() * foodColors.length);
    food.color = foodColors[randomColorIndex];
}

function gameOver() {
    // Display Game Over overlay
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) {
        overlay.style.display = "flex";
    }
    document.getElementById("final-score").innerText = score;

    // Reset movement vectors to zero immediately
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Persist session coins
    saveGameData();
}

function restartGame() {
    // Reset game state
    snack = [{ x: 10, y: 10 }];
    score = 0;
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    document.getElementById("score").innerText = score;

    // Hide overlay
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }

    // Spawn new food
    spawnFood();

    // Immediately draw the initial state
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

function createShopItem(data, type) {
    const div = document.createElement("div");
    div.className = "shop-item";

    // Use purchasedSkins or purchasedBackgrounds depending on item type
    const isOwned = type === "skin" ? purchasedSkins.includes(data.id) : purchasedBackgrounds.includes(data.id);
    const isEquipped = type === "skin" ? equippedSkin === data.id : equippedBackground === data.id;

    if (isOwned) div.classList.add("owned");
    if (isEquipped) div.classList.add("equipped");

    div.innerHTML = `
        <div class="skin-preview" style="background-color: ${data.color}"></div>
        <span class="item-name">${data.name}</span>
        <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : data.price + " Coins"}</span>
    `;

    div.addEventListener("click", () => {
        if (isOwned) {
            // Already owned, equip it
            if (type === "skin") {
                equippedSkin = data.id;
            } else {
                equippedBackground = data.id;
            }
        } else {
            // Unowned, attempt purchase and auto-equip
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

        // Save data immediately
        saveGameData();

        // Render shop to update states
        renderShop();

        // Visually update the canvas immediately after interaction (background or snack skin)
        draw();
    });

    return div;
}

function draw() {
    if (!ctx) return;

    // Draw equipped background color
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as a circle
    ctx.fillStyle = food.color || "#e74c3c";
    ctx.beginPath();
    const radius = gridSize / 2;
    const centerX = food.x * gridSize + radius;
    const centerY = food.y * gridSize + radius;
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack body with distinct visible gaps (gridSize - 1)
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// Global keydown event listener
window.addEventListener("keydown", e => {
    // If Game Over overlay is visible, disable inputs
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    // Movement prevention based on lastDx and lastDy to prevent 180-degree turns
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

// Start initialization on DOMContentLoaded
document.addEventListener("DOMContentLoaded", initGame);
