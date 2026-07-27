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
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameInterval) {
        // Adjust for any lag to keep interval close to 100ms
        lastFrameTime = timestamp - (elapsed % frameInterval);
        update();
        draw();
    }
}

function update() {
    // Game logic is paused until first movement is initiated
    if (dx === 0 && dy === 0) return;

    // Update last input direction to prevent 180-degree turns
    lastDx = dx;
    lastDy = dy;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Self collision (before tail pop to prevent entering tail segment)
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
    if (snack.length >= tileCount * tileCount) {
        // Grid is completely full
        return;
    }

    let found = false;
    let newX, newY;

    // Iterative search for empty tiles to avoid deep recursion
    while (!found) {
        newX = Math.floor(Math.random() * tileCount);
        newY = Math.floor(Math.random() * tileCount);

        let onSnack = false;
        for (let i = 0; i < snack.length; i++) {
            if (snack[i].x === newX && snack[i].y === newY) {
                onSnack = true;
                break;
            }
        }

        if (!onSnack) {
            found = true;
        }
    }

    food.x = newX;
    food.y = newY;
    food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
}

function gameOver() {
    // Reset vectors first
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Display overlay and score
    document.getElementById("final-score").innerText = score;
    document.getElementById("game-over-overlay").style.display = "flex";

    saveGameData();
}

function restartGame() {
    // Reset core stats
    score = 0;
    document.getElementById("score").innerText = score;

    // Clear vectors
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;

    // Reset position
    snack = [{ x: 10, y: 10 }];

    // Hide overlay
    document.getElementById("game-over-overlay").style.display = "none";

    // Re-spawn food and draw initial state
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
    const skinShop = document.getElementById("snack-skins");
    const bgShop = document.getElementById("background-skins");

    skinShop.innerHTML = "";
    bgShop.innerHTML = "";

    snackSkins.forEach(skin => {
        const item = createShopItem(skin, "skin");
        skinShop.appendChild(item);
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
        draw(); // Redraw canvas background/skin changes immediately
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

    // Draw snack body with distinct visible gaps (using gridSize - 1 for size)
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    // Load elements & register handlers
    document.getElementById("coins").innerText = coins;
    document.getElementById("restart-btn").addEventListener("click", restartGame);

    // Prevent scrolling for arrows
    window.addEventListener("keydown", e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }

        // Return early if game over overlay is active
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

    renderShop();
    spawnFood();
    draw();
    requestAnimationFrame(gameLoop);
});
