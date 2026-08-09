let canvas;
let ctx;

const gridSize = 20;
const tileCount = 20; // 400px / 20px

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

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        lastFrameTime = timestamp - (elapsed % frameInterval);
        update();
        draw();
    }
}

function update() {
    // Pause game update logic until player initiates movement
    if (dx === 0 && dy === 0) return;

    // Save the movement direction used for this frame to prevent immediate 180-degree turns
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Collision with walls
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Collision with self
    // Check collision before removing (popping) the tail segment
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

    // Perform iterative search for empty tiles to avoid stack overflow issues
    let foodX, foodY;
    let onSnack = true;

    while (onSnack) {
        foodX = Math.floor(Math.random() * tileCount);
        foodY = Math.floor(Math.random() * tileCount);
        onSnack = false;

        for (let i = 0; i < snack.length; i++) {
            if (snack[i].x === foodX && snack[i].y === foodY) {
                onSnack = true;
                break;
            }
        }
    }

    food.x = foodX;
    food.y = foodY;
    // Choose a random food color
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    // Prevent further updates by resetting movement vectors
    dx = 0;
    dy = 0;

    // Save current session coins on game over
    saveGameData();

    // Set overlays and final score
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";
}

function restartGame() {
    // Reset vectors
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Reset snack position and score
    snack = [{ x: 10, y: 10 }];
    score = 0;
    document.getElementById("score").innerText = score;

    // Spawn new food
    spawnFood();

    // Hide overlay
    document.getElementById("game-over-overlay").style.display = "none";

    // Immediate draw of the initial state
    draw();
}

function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

// Initial UI and Canvas setup
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    document.getElementById("coins").innerText = coins;

    // Add event listener to the restart button
    document.getElementById("restart-btn").addEventListener("click", restartGame);

    renderShop();
    spawnFood();
    draw();

    // Start game loop
    requestAnimationFrame(gameLoop);
});

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
                    equippedSkin = data.id; // Auto-equip on purchase
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // Auto-equip on purchase
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Not enough coins!");
                return;
            }
        }
        saveGameData();
        renderShop();
        draw(); // Immediately update visuals
    };

    return div;
}

function draw() {
    // Clear canvas with equipped background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as a circle
    ctx.fillStyle = food.color;
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 1;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        // Draw square blocks with a 1px gap (gridSize - 1)
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

window.addEventListener("keydown", e => {
    // If game over overlay is visible, ignore keys
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case "ArrowUp":
            // Prevent 180-degree turn
            if (lastDy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
            // Prevent 180-degree turn
            if (lastDy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
            // Prevent 180-degree turn
            if (lastDx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
            // Prevent 180-degree turn
            if (lastDx !== -1) { dx = 1; dy = 0; }
            break;
    }
});
