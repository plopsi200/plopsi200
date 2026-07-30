// Let's declare our variables first. They will be initialized inside DOMContentLoaded.
let canvas;
let ctx;
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

let snack = [
    { x: 10, y: 10 },
];

let food = { x: 5, y: 5, color: "#e74c3c" };
const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

// Variables for 10 FPS game loop
let lastFrameTime = 0;
const frameInterval = 100; // 100ms = 10 FPS

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        // Adjust for any lag while maintaining interval
        lastFrameTime = timestamp - (elapsed % frameInterval);

        update();
        draw();
    }
}

function update() {
    // If movement is zero, pause game logic execution (e.g. at start or after restart)
    if (dx === 0 && dy === 0) return;

    // Track last direction to prevent immediate 180-degree turns
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collisions
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self-collision (check before tail popped/removed to prevent entering the tile occupied by tail)
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
    // Prevent infinite loop if entire board is full of snack
    if (snack.length >= tileCount * tileCount) return;

    let emptyTiles = [];
    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            let isOccupied = false;
            for (let i = 0; i < snack.length; i++) {
                if (snack[i].x === x && snack[i].y === y) {
                    isOccupied = true;
                    break;
                }
            }
            if (!isOccupied) {
                emptyTiles.push({ x, y });
            }
        }
    }

    if (emptyTiles.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyTiles.length);
        const tile = emptyTiles[randomIndex];
        food.x = tile.x;
        food.y = tile.y;
        food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
    }
}

function gameOver() {
    saveGameData();
    // Display Game Over overlay
    const overlay = document.getElementById("game-over-overlay");
    const finalScoreSpan = document.getElementById("final-score");
    if (finalScoreSpan) finalScoreSpan.innerText = score;
    if (overlay) overlay.style.display = "flex";

    // Stop movement
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
}

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
    if (overlay) overlay.style.display = "none";

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

function loadGameData() {
    coins = parseInt(localStorage.getItem("snackCoins")) || 0;
    purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
    equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
    equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";
}

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

    // Determine ownership and equipment based on specific shop item type
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
            // If already owned, just equip
            if (type === "skin") {
                equippedSkin = data.id;
            } else {
                equippedBackground = data.id;
            }
        } else {
            // Purchase flow
            if (coins >= data.price) {
                coins -= data.price;
                if (type === "skin") {
                    purchasedSkins.push(data.id);
                    equippedSkin = data.id; // automatically equip on purchase
                } else {
                    purchasedBackgrounds.push(data.id);
                    equippedBackground = data.id; // automatically equip on purchase
                }
                document.getElementById("coins").innerText = coins;
            } else {
                alert("Not enough coins!");
                return;
            }
        }
        saveGameData();
        renderShop();
        draw(); // Ensure canvas visual changes update immediately
    };

    return div;
}

function draw() {
    if (!ctx || !canvas) return;

    // Apply background color associated with equippedBackground
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw circular food item
    ctx.beginPath();
    const radius = gridSize / 2;
    const foodCenterX = food.x * gridSize + radius;
    const foodCenterY = food.y * gridSize + radius;
    ctx.arc(foodCenterX, foodCenterY, radius - 1, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();
    ctx.closePath();

    // Draw square snack body with visible gaps (gridSize - 1)
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

// Initial UI and Setup within DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    loadGameData();

    document.getElementById("coins").innerText = coins;

    // Wire up restart button
    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) {
        restartBtn.addEventListener("click", () => {
            restartGame();
        });
    }

    renderShop();
    spawnFood();
    draw();

    // Start 10 FPS game loop via requestAnimationFrame
    requestAnimationFrame(gameLoop);
});

// Key listener to control movement and prevent scrolling
window.addEventListener("keydown", e => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    // Disable input if game-over-overlay is currently displayed
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return;
    }

    switch (e.key) {
        case "ArrowUp":
            // Prevent moving Up directly if headed Down
            if (lastDy !== 1) { dx = 0; dy = -1; }
            break;
        case "ArrowDown":
            // Prevent moving Down directly if headed Up
            if (lastDy !== -1) { dx = 0; dy = 1; }
            break;
        case "ArrowLeft":
            // Prevent moving Left directly if headed Right
            if (lastDx !== 1) { dx = -1; dy = 0; }
            break;
        case "ArrowRight":
            // Prevent moving Right directly if headed Left
            if (lastDx !== -1) { dx = 1; dy = 0; }
            break;
    }
});
