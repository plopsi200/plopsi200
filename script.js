let canvas, ctx;
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

// Food variety colors
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
const frameInterval = 100; // 10 FPS (100ms per frame)

function gameLoop(timestamp) {
    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }
    const delta = timestamp - lastFrameTime;

    if (delta >= frameInterval) {
        update();
        draw();
        lastFrameTime = timestamp - (delta % frameInterval);
    }
    requestAnimationFrame(gameLoop);
}

function update() {
    // Game is paused until user starts moving
    if (dx === 0 && dy === 0) return;

    // Record last direction to handle 180-degree turn checks properly
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision
    // Detect collision with occupied tiles BEFORE popping the tail
    for (let i = 0; i < snack.length; i++) {
        if (head.x === snack[i].x && head.y === snack[i].y) {
            gameOver();
            return;
        }
    }

    snack.unshift(head);

    // Consume food logic
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
    // Safety check to prevent infinite loops when the canvas is full
    if (snack.length >= tileCount * tileCount) return;

    let foodX, foodY;
    let onSnack = true;

    // Iterative search for an empty tile
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
    // Assign random color from array
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    // Display the Game Over overlay
    const overlay = document.getElementById("game-over-overlay");
    const finalScoreSpan = document.getElementById("final-score");
    if (finalScoreSpan) finalScoreSpan.innerText = score;
    if (overlay) overlay.style.display = "flex";

    // Reset movement vectors
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Persist current session coins
    saveGameData();
}

function restartGame() {
    // Reset vectors and positions
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    snack = [{ x: 10, y: 10 }];
    score = 0;

    // Reset score UI
    document.getElementById("score").innerText = score;

    // Spawn new food
    spawnFood();

    // Hide overlay
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) overlay.style.display = "none";

    // Immediately render first frame
    draw();
}

function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Display coin count immediately
    document.getElementById("coins").innerText = coins;

    // Setup restart button listener
    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) {
        restartBtn.addEventListener("click", restartGame);
    }

    // Keyboard handlers
    window.addEventListener("keydown", e => {
        // Prevent default window scrolling behavior for arrows
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }

        // Disable input if the game over overlay is visible
        const overlay = document.getElementById("game-over-overlay");
        if (overlay && overlay.style.display === "flex") {
            return;
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

    // Render shop initial state
    renderShop();

    // Spawn food and render initial frame immediately
    spawnFood();
    draw();

    // Run fixed 10 FPS game loop via requestAnimationFrame
    requestAnimationFrame(gameLoop);
});

function renderShop() {
    const snackShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("background-skins");

    if (snackShop) snackShop.innerHTML = "";
    if (bgShop) bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        const item = createShopItem(skin, "skin");
        if (snackShop) snackShop.appendChild(item);
    });

    backgrounds.forEach(bg => {
        const item = createShopItem(bg, "background");
        if (bgShop) bgShop.appendChild(item);
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
                    equippedSkin = data.id; // auto-equip upon purchase
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // auto-equip upon purchase
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Not enough coins!");
                return;
            }
        }

        saveGameData();
        renderShop();

        // Ensure immediate canvas updates without requiring ticks or restarting
        draw();
    };

    return div;
}

function draw() {
    if (!ctx) return;

    // Apply equipped background skin
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as a circle
    const radius = gridSize / 2;
    const centerX = food.x * gridSize + radius;
    const centerY = food.y * gridSize + radius;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 1, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();
    ctx.closePath();

    // Draw snack with equipped skin
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;

    // Draw snack body with grid-gaps
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}
