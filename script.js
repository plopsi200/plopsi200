document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    const gridSize = 20;
    const tileCount = canvas.width / gridSize;

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

    let snack = [{ x: 10, y: 10 }];
    let food = { x: 5, y: 5, color: foodColors[0] };

    let dx = 0;
    let dy = 0;
    let lastDx = 0;
    let lastDy = 0;

    const overlay = document.getElementById("game-over-overlay");
    const finalScoreEl = document.getElementById("final-score");
    const restartBtn = document.getElementById("restart-btn");

    restartBtn.addEventListener("click", restartGame);

    function gameLoop(currentTime) {
        if (!lastRenderTime) lastRenderTime = currentTime;
        const delta = currentTime - lastRenderTime;

        if (delta > 100) { // ~10 FPS
            update();
            draw();
            lastRenderTime = currentTime;
        }

        requestAnimationFrame(gameLoop);
    }

    let lastRenderTime = 0;

    function update() {
        if (dx === 0 && dy === 0) return;

        lastDx = dx;
        lastDy = dy;

        const head = { x: snack[0].x + dx, y: snack[0].y + dy };

        // Collision with walls
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
            return;
        }

        // Collision with self
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
            updateUI();
            spawnFood();
        } else {
            snack.pop();
        }
    }

    function spawnFood() {
        if (snack.length >= tileCount * tileCount) return;

        const emptyTiles = [];
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

        if (emptyTiles.length > 0) {
            const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            food.x = randomTile.x;
            food.y = randomTile.y;
            food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
        }
    }

    function gameOver() {
        dx = 0;
        dy = 0;
        lastDx = 0;
        lastDy = 0;
        saveGameData();
        finalScoreEl.innerText = score;
        overlay.style.display = "flex";
    }

    function restartGame() {
        overlay.style.display = "none";
        snack = [{ x: 10, y: 10 }];
        dx = 0;
        dy = 0;
        lastDx = 0;
        lastDy = 0;
        score = 0;
        updateUI();
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

    function updateUI() {
        document.getElementById("score").innerText = score;
        document.getElementById("coins").innerText = coins;
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
            if (isOwned) {
                if (type === "skin") equippedSkin = data.id;
                else equippedBackground = data.id;
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
                    updateUI();
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

    function draw() {
        // Clear canvas with equipped background
        const bg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
        ctx.fillStyle = bg.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw food as circle
        ctx.fillStyle = food.color || "#e74c3c";
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2,
            gridSize / 2 - 1,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Draw snack with equipped skin
        const skin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
        ctx.fillStyle = skin.color;
        snack.forEach(part => {
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
        });
    }

    window.addEventListener("keydown", e => {
        if (overlay.style.display === "flex") return;

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

    // Initialize UI and Game State
    updateUI();
    renderShop();
    spawnFood();
    draw();
    requestAnimationFrame(gameLoop);
});
