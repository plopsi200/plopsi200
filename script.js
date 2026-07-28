document.addEventListener("DOMContentLoaded", () => {
    // Canvas & Context Setup
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

    // State Variables loaded from localStorage with 'snack' prefixes
    let score = 0;
    let coins = parseInt(localStorage.getItem("snackCoins")) || 0;
    let purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
    let equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    let purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
    let equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

    // Shop Item Definitions
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

    // Game Core Variables
    let snack = [{ x: 10, y: 10 }];
    let food = { x: 5, y: 5, color: foodColors[0] };

    // Direction variables
    let dx = 0;
    let dy = 0;
    let lastDx = 0;
    let lastDy = 0;

    // Game Loop Timing (10 FPS)
    let lastFrameTime = 0;
    const interval = 100; // 100ms per frame

    function gameLoop(timestamp) {
        if (!lastFrameTime) lastFrameTime = timestamp;
        const delta = timestamp - lastFrameTime;

        if (delta >= interval) {
            update();
            draw();
            lastFrameTime = timestamp - (delta % interval);
        }
        requestAnimationFrame(gameLoop);
    }

    function update() {
        // Pause logic if direction vectors are zero
        if (dx === 0 && dy === 0) return;

        // Save last directional vectors of this processed frame
        lastDx = dx;
        lastDy = dy;

        const head = { x: snack[0].x + dx, y: snack[0].y + dy };

        // Wall collisions
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
            return;
        }

        // Self collision check. Self-collision occurs before the tail segment is removed.
        // This ensures the snack cannot move into its tail cell.
        for (let i = 0; i < snack.length; i++) {
            if (head.x === snack[i].x && head.y === snack[i].y) {
                gameOver();
                return;
            }
        }

        snack.unshift(head);

        // Food consumption check
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
        // Prevent infinite loops if the canvas is full
        if (snack.length >= tileCount * tileCount) return;

        // Perform search for an empty cell to spawn food
        let emptyCells = [];
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
                    emptyCells.push({ x, y });
                }
            }
        }

        if (emptyCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const cell = emptyCells[randomIndex];
            food.x = cell.x;
            food.y = cell.y;
            food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
        }
    }

    function gameOver() {
        saveGameData();
        // Show overlay with score
        document.getElementById("final-score").innerText = score;
        document.getElementById("game-over-overlay").style.display = "flex";
    }

    function restartGame() {
        // Reset direction vectors, position, score, overlay
        dx = 0;
        dy = 0;
        lastDx = 0;
        lastDy = 0;
        snack = [{ x: 10, y: 10 }];
        score = 0;
        document.getElementById("score").innerText = score;
        document.getElementById("game-over-overlay").style.display = "none";
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

    function draw() {
        // Render equipped background
        const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
        ctx.fillStyle = bg.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render food as circle
        ctx.beginPath();
        const radius = gridSize / 2;
        const centerX = food.x * gridSize + radius;
        const centerY = food.y * gridSize + radius;
        ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI);
        ctx.fillStyle = food.color;
        ctx.fill();

        // Render snack segments with square blocks
        const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
        ctx.fillStyle = skin.color;
        snack.forEach(part => {
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
        });
    }

    function renderShop() {
        const snackShop = document.getElementById("snack-skins");
        const bgShop = document.getElementById("background-skins");

        snackShop.innerHTML = "";
        bgShop.innerHTML = "";

        snackSkins.forEach(skin => {
            snackShop.appendChild(createShopItem(skin, "skin"));
        });

        backgrounds.forEach(bg => {
            bgShop.appendChild(createShopItem(bg, "background"));
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
                // Already owned, equip it
                if (type === "skin") {
                    equippedSkin = data.id;
                } else {
                    equippedBackground = data.id;
                }
            } else {
                // Unowned, attempt purchase
                if (coins >= data.price) {
                    coins -= data.price;
                    document.getElementById("coins").innerText = coins;
                    if (type === "skin") {
                        purchasedSkins.push(data.id);
                        equippedSkin = data.id; // Auto-equip upon purchase
                    } else {
                        purchasedBackgrounds.push(data.id);
                        equippedBackground = data.id; // Auto-equip upon purchase
                    }
                } else {
                    alert("Not enough coins!");
                    return;
                }
            }
            // Save state, refresh UI, and visually draw canvas background immediately
            saveGameData();
            renderShop();
            draw();
        };

        return div;
    }

    // Keyboard Input Handling with scroll prevention and return early on GameOver overlay
    window.addEventListener("keydown", e => {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }

        // Return early if Game Over overlay is visible
        if (document.getElementById("game-over-overlay").style.display === "flex") {
            return;
        }

        // 180-degree turn prevention using lastDx and lastDy
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

    // Hook up Restart Button
    document.getElementById("restart-btn").onclick = restartGame;

    // Initial setup and draw
    document.getElementById("coins").innerText = coins;
    document.getElementById("score").innerText = score;
    spawnFood();
    renderShop();
    draw();

    // Start Game Loop
    requestAnimationFrame(gameLoop);
});
