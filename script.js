// Global game configurations and assets
const gridSize = 20;

const snackSkins = [
    { id: "default", name: "Green", color: "lime", price: 0 },
    { id: "blue", name: "Blue", color: "#3498db", price: 10 },
    { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
    { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
];

const backgrounds = [
    { id: "black", name: "Black", color: "black", price: 0 },
    { id: "gray", name: "Gray", color: "#7f8c8d", price: 10 },
    { id: "forest", name: "Forest", color: "#27ae60", price: 20 },
    { id: "navy", name: "Navy", color: "#2980b9", price: 30 },
];

const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

let canvas;
let ctx;
let tileCount;

let score = 0;
let coins = 0;
let purchasedSkins = ["default"];
let equippedSkin = "default";
let purchasedBackgrounds = ["black"];
let equippedBackground = "black";

let snack = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5, color: foodColors[0] };

let dx = 0;
let dy = 0;
let lastDx = 0;
let lastDy = 0;

let lastFrameTime = 0;
const frameInterval = 100; // 10 FPS (100ms)

function loadGameData() {
    coins = parseInt(localStorage.getItem("snackCoins"), 10) || 0;
    try {
        const storedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins"));
        if (Array.isArray(storedSkins) && storedSkins.length > 0) {
            purchasedSkins = storedSkins;
        }
    } catch (e) {
        purchasedSkins = ["default"];
    }

    equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    if (!purchasedSkins.includes(equippedSkin)) {
        equippedSkin = "default";
    }

    try {
        const storedBgs = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds"));
        if (Array.isArray(storedBgs) && storedBgs.length > 0) {
            purchasedBackgrounds = storedBgs;
        }
    } catch (e) {
        purchasedBackgrounds = ["black"];
    }

    equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";
    if (!purchasedBackgrounds.includes(equippedBackground)) {
        equippedBackground = "black";
    }
}

function saveGameData() {
    localStorage.setItem("snackCoins", coins);
    localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
    localStorage.setItem("snackEquippedSkin", equippedSkin);
    localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
    localStorage.setItem("snackEquippedBackground", equippedBackground);
}

function spawnFood() {
    if (snack.length >= tileCount * tileCount) return;

    // Build list of empty tiles to avoid infinite recursion or stack overflow
    const occupied = new Set();
    for (let i = 0; i < snack.length; i++) {
        occupied.add(`${snack[i].x},${snack[i].y}`);
    }

    const available = [];
    for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
            if (!occupied.has(`${x},${y}`)) {
                available.push({ x, y });
            }
        }
    }

    if (available.length > 0) {
        const choice = available[Math.floor(Math.random() * available.length)];
        food.x = choice.x;
        food.y = choice.y;
        food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
    }
}

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if (!lastFrameTime) {
        lastFrameTime = timestamp;
    }

    const delta = timestamp - lastFrameTime;

    if (delta >= frameInterval) {
        lastFrameTime = timestamp - (delta % frameInterval);
        update();
        draw();
    }
}

function update() {
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return;
    }

    // Pause game logic if not yet started moving
    if (dx === 0 && dy === 0) return;

    const head = { x: snack[0].x + dx, y: snack[0].y + dy };
    lastDx = dx;
    lastDy = dy;

    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    // Check self-collision before tail is removed (per specification)
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
        saveGameData();
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
        spawnFood();
    } else {
        snack.pop();
    }
}

function gameOver() {
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    saveGameData();

    document.getElementById("final-score").innerText = score;
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) {
        overlay.style.display = "flex";
    }
}

function restartGame() {
    dx = 0;
    dy = 0;
    lastDx = 0;
    lastDy = 0;
    score = 0;
    snack = [{ x: 10, y: 10 }];

    document.getElementById("score").innerText = score;
    document.getElementById("coins").innerText = coins;

    const overlay = document.getElementById("game-over-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }

    spawnFood();
    draw();
}

function draw() {
    if (!ctx) return;

    // Draw background
    const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw food as circle
    ctx.fillStyle = food.color || "#e74c3c";
    ctx.beginPath();
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 1;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw snack segments with gaps (gridSize - 1)
    const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
    ctx.fillStyle = skin.color;
    snack.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
    });
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

    const isOwned = type === "skin"
        ? purchasedSkins.includes(data.id)
        : purchasedBackgrounds.includes(data.id);

    const isEquipped = type === "skin"
        ? equippedSkin === data.id
        : equippedBackground === data.id;

    if (isOwned) div.classList.add("owned");
    if (isEquipped) div.classList.add("equipped");

    div.innerHTML = `
        <div class="skin-preview" style="background-color: ${data.color}"></div>
        <span class="item-name">${data.name}</span>
        <span class="item-price">${isOwned ? (isEquipped ? "Equipped" : "Owned") : data.price + " Coins"}</span>
    `;

    div.onclick = () => {
        const currentlyOwned = type === "skin"
            ? purchasedSkins.includes(data.id)
            : purchasedBackgrounds.includes(data.id);

        if (currentlyOwned) {
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

window.addEventListener("keydown", e => {
    const overlay = document.getElementById("game-over-overlay");
    if (overlay && overlay.style.display === "flex") {
        return; // Disable movement inputs when game is over
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
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

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    tileCount = canvas.width / gridSize;

    loadGameData();

    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;

    const restartBtn = document.getElementById("restart-btn");
    if (restartBtn) {
        restartBtn.addEventListener("click", restartGame);
    }

    spawnFood();
    renderShop();
    draw();

    requestAnimationFrame(gameLoop);
});
