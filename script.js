// Snack Game 2.0 Logic

let canvas;
let ctx;

const gridSize = 20;
let tileCount;

let score = 0;
let coins = 0;

// Collections and equipped configurations
let purchasedSkins = ["default"];
let equippedSkin = "default";
let purchasedBackgrounds = ["black"];
let equippedBackground = "black";

// Shop items configurations
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
    "#e74c3c", // Red
    "#e67e22", // Orange
    "#f1c40f", // Yellow
    "#2ecc71", // Green
    "#3498db", // Blue
    "#9b59b6"  // Purple
];

// Game State Variables
let snack = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: "#e74c3c" };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

let lastFrameTime = 0;
const frameInterval = 100; // 10 FPS (100ms per frame)

// DOMContentLoaded Initialisation
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Load data from localStorage
    coins = parseInt(localStorage.getItem("snackCoins")) || 0;
    purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
    equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
    equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    // Set up restart button
    document.getElementById("restart-btn").addEventListener("click", () => {
        restartGame();
    });

    spawnFood();
    renderShop();
    draw();

    // Start Game Loop
    requestAnimationFrame(gameLoop);
});

// Game loop handling fixed frame rate (10 FPS)
function gameLoop(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        lastFrameTime = timestamp - (elapsed % frameInterval);
        update();
        draw();
    }

    requestAnimationFrame(gameLoop);
}

// Update game mechanics
function update() {
    // If movement hasn't started yet, keep in idle state
    if (dx === 0 && dy === 0) return;

    // Track direction of the frame that is being processed
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision
    // Since collision detection is executed BEFORE the tail segment is popped,
    // we must check the entire snack length.
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);

    // Food eating logic
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
    // Apply equipped background color
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circular food item
    ctx.beginPath();
    const radius = gridSize / 2;
    const centerX = food.x * gridSize + radius;
    const centerY = food.y * gridSize + radius;
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();
    ctx.closePath();

    // Draw snack blocks with gridSize - 1 dimension for visible gap
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// Spawn food iteratively
function spawnFood() {
    // Safety check: if snack covers the entire grid, stop spawning to avoid infinite loops
    if (snack.length >= tileCount * tileCount) return;

    let possibleX, possibleY;
    let validLocation = false;

    // Iterative search for empty tiles to avoid stack overflow or deep recursion
    while (!validLocation) {
        possibleX = Math.floor(Math.random() * tileCount);
        possibleY = Math.floor(Math.random() * tileCount);
        validLocation = true;

        for (let i = 0; i < snack.length; i++) {
            if (snack[i].x === possibleX && snack[i].y === possibleY) {
                validLocation = false;
                break;
            }
        }
    }

    food.x = possibleX;
    food.y = possibleY;

    // Choose random color from foodColors array
    const randIndex = Math.floor(Math.random() * foodColors.length);
    food.color = foodColors[randIndex];
}

// Handle Game Over
function gameOver() {
    // Display the game over overlay
    const overlay = document.getElementById("game-over-overlay");
    document.getElementById("final-score").innerText = score;
    overlay.style.display = "flex";

    // Reset movement vectors
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Persist current session coins
    saveGameData();
}

// Restart Game
function restartGame() {
    // Reset vectors
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Reset properties
    snack = [{ x: 10, y: 10 }];
    score = 0;
    document.getElementById("score").innerText = score;

    // Hide game-over overlay
    document.getElementById("game-over-overlay").style.display = "none";

    spawnFood();
    draw();
}

// Save data helper
function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

// Render shop UI container
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

// Create individual shop item element
function createShopItem(data, type) {
    const div = document.createElement("div");
    div.className = "shop-item";

    // Select collections based on item type
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
                    equippedSkin = data.id; // Automatically equip purchased item
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // Automatically equip purchased item
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Insufficient funds!");
                return;
            }
        }

        saveGameData();
        renderShop();
        draw(); // Ensure canvas updates background/snack skin immediately
    };

    return div;
}

// Keyboard input and 180-degree turn prevention
window.addEventListener("keydown", e => {
    // If Game Over overlay is visible, disable movement inputs
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") return;

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
