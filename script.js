// Delay core initialization to DOMContentLoaded to prevent race conditions
document.addEventListener("DOMContentLoaded", () => {
    // Canvas setup
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const gridSize = 20;
    const tileCount = canvas.width / gridSize; // 20

    // Core states retrieved from LocalStorage with prefix 'snack'
    let coins = parseInt(localStorage.getItem("snackCoins")) || 0;
    let purchasedSkins = JSON.parse(localStorage.getItem("snackPurchasedSkins")) || ["default"];
    let equippedSkin = localStorage.getItem("snackEquippedSkin") || "default";
    let purchasedBackgrounds = JSON.parse(localStorage.getItem("snackPurchasedBackgrounds")) || ["black"];
    let equippedBackground = localStorage.getItem("snackEquippedBackground") || "black";

    let score = 0;

    // Snake Skins Definitions
    const snackSkins = [
        { id: "default", name: "Green", color: "lime", price: 0 },
        { id: "blue", name: "Blue", color: "#3498db", price: 10 },
        { id: "purple", name: "Purple", color: "#9b59b6", price: 20 },
        { id: "gold", name: "Gold", color: "#f1c40f", price: 50 },
    ];

    // Background Skins Definitions
    const backgrounds = [
        { id: "black", name: "Black", color: "black", price: 0 },
        { id: "grey", name: "Grey", color: "#7f8c8d", price: 10 },
        { id: "forest", name: "Forest", color: "#27ae60", price: 20 },
        { id: "navy", name: "Navy", color: "#2980b9", price: 30 },
    ];

    // Food Color Options for variety
    const foodColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

    // Snake game variables
    let snack = [{ x: 10, y: 10 }];
    let food = { x: 5, y: 5, color: foodColors[0] };

    // Movement vectors
    let dx = 0;
    let dy = 0;
    // previous frame direction to avoid 180-degree turns
    let lastDx = 0;
    let lastDy = 0;

    // UI elements references
    const scoreElement = document.getElementById("score");
    const coinsElement = document.getElementById("coins");
    const overlay = document.getElementById("game-over-overlay");
    const finalScoreElement = document.getElementById("final-score");
    const restartBtn = document.getElementById("restart-btn");

    // Initialize UI display values
    coinsElement.innerText = coins;
    scoreElement.innerText = score;

    // Game loop timing (10 FPS)
    let lastFrameTime = 0;
    const frameInterval = 1000 / 10; // 100ms

    function gameLoop(timestamp) {
        requestAnimationFrame(gameLoop);

        const delta = timestamp - lastFrameTime;
        if (delta >= frameInterval) {
            // Adjust lastFrameTime, retaining excess millisecond delta for accuracy
            lastFrameTime = timestamp - (delta % frameInterval);
            update();
            draw();
        }
    }

    // Logic updates
    function update() {
        // Pause logic until player initiates movement
        if (dx === 0 && dy === 0) return;

        // Remember the current movement vector as the last processed direction
        lastDx = dx;
        lastDy = dy;

        const head = { x: snack[0].x + dx, y: snack[0].y + dy };

        // Collision with walls
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            gameOver();
            return;
        }

        // Collision with self - checked BEFORE tail popping
        for (let i = 0; i < snack.length; i++) {
            if (head.x === snack[i].x && head.y === snack[i].y) {
                gameOver();
                return;
            }
        }

        snack.unshift(head);

        // Check food consumption
        if (head.x === food.x && head.y === food.y) {
            score++;
            coins++;
            saveGameData();
            scoreElement.innerText = score;
            coinsElement.innerText = coins;
            spawnFood();
        } else {
            snack.pop();
        }
    }

    // Spawn food on an empty tile iteratively
    function spawnFood() {
        if (snack.length >= tileCount * tileCount) {
            // Canvas completely filled by the snack body
            return;
        }

        let attempts = 0;
        let valid = false;
        let rx, ry;

        while (!valid && attempts < 2000) {
            rx = Math.floor(Math.random() * tileCount);
            ry = Math.floor(Math.random() * tileCount);
            valid = true;

            // Check if coordinates overlap snack body
            for (let i = 0; i < snack.length; i++) {
                if (snack[i].x === rx && snack[i].y === ry) {
                    valid = false;
                    break;
                }
            }
            attempts++;
        }

        // Fallback search to guarantee empty tile if random generation is slow
        if (!valid) {
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
                const choice = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
                rx = choice.x;
                ry = choice.y;
            } else {
                return; // Grid is full
            }
        }

        food.x = rx;
        food.y = ry;
        // Assign random color from array
        food.color = foodColors[Math.floor(Math.random() * foodColors.length)];
    }

    // Game over flow
    function gameOver() {
        dx = 0;
        dy = 0;
        lastDx = 0;
        lastDy = 0;
        saveGameData();

        finalScoreElement.innerText = score;
        overlay.style.display = "flex";
    }

    // Restart logic
    function restartGame() {
        snack = [{ x: 10, y: 10 }];
        dx = 0;
        dy = 0;
        lastDx = 0;
        lastDy = 0;
        score = 0;
        scoreElement.innerText = score;
        overlay.style.display = "none";
        spawnFood();
        draw();
    }

    restartBtn.addEventListener("click", restartGame);

    // Save state persistence to localStorage
    function saveGameData() {
        localStorage.setItem("snackCoins", coins);
        localStorage.setItem("snackPurchasedSkins", JSON.stringify(purchasedSkins));
        localStorage.setItem("snackEquippedSkin", equippedSkin);
        localStorage.setItem("snackPurchasedBackgrounds", JSON.stringify(purchasedBackgrounds));
        localStorage.setItem("snackEquippedBackground", equippedBackground);
    }

    // Shop Renderer
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

    // Create individual shop item elements
    function createShopItem(data, type) {
        const div = document.createElement("div");
        div.className = "shop-item";

        // Determine item states based on dynamic properties
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
                // Select and equip
                if (type === "skin") {
                    equippedSkin = data.id;
                } else {
                    equippedBackground = data.id;
                }
            } else {
                // Handle purchase flow
                if (coins >= data.price) {
                    coins -= data.price;
                    if (type === "skin") {
                        purchasedSkins.push(data.id);
                        equippedSkin = data.id; // Automatically equip upon purchase
                    } else {
                        purchasedBackgrounds.push(data.id);
                        equippedBackground = data.id; // Automatically equip upon purchase
                    }
                    coinsElement.innerText = coins;
                } else {
                    alert("Not enough coins!");
                    return;
                }
            }
            saveGameData();
            renderShop();
            draw(); // Update immediately on canvas
        };

        return div;
    }

    // Canvas drawing function
    function draw() {
        // Retrieve equipped background color
        const activeBg = backgrounds.find(b => b.id === equippedBackground) || backgrounds[0];
        ctx.fillStyle = activeBg.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw food as a circle
        ctx.beginPath();
        const centerX = food.x * gridSize + gridSize / 2;
        const centerY = food.y * gridSize + gridSize / 2;
        const radius = gridSize / 2 - 1;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = food.color;
        ctx.fill();

        // Draw snack with equipped skin
        const activeSkin = snackSkins.find(s => s.id === equippedSkin) || snackSkins[0];
        ctx.fillStyle = activeSkin.color;
        snack.forEach(part => {
            // Keep clear 1px visual border around individual segments (width/height: gridSize - 1)
            ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 1, gridSize - 1);
        });
    }

    // Event listeners
    window.addEventListener("keydown", e => {
        // Prevent default window scrolling when hitting arrow keys
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
            e.preventDefault();
        }

        // Ignore user input if the Game Over overlay is displayed
        if (overlay.style.display === "flex") {
            return;
        }

        switch (e.key) {
            case "ArrowUp":
                // Prevent 180-degree turn relative to last processed movement frame
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

    // Start rendering the shop and initial scene
    renderShop();
    spawnFood();
    draw();

    // Start 10 FPS game loop using requestAnimationFrame
    requestAnimationFrame(gameLoop);
});
