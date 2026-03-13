const canvas = document.getElementById('snakeGame');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const coinsElement = document.getElementById('coins');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const snakeSkinsContainer = document.getElementById('snake-skins');
const bgSkinsContainer = document.getElementById('bg-skins');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let coins = parseInt(localStorage.getItem('snakeCoins')) || 0;
let snake = [{ x: 10, y: 10 }];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let gameInterval;
let gameSpeed = 100;

const snakeSkins = [
    { id: 'green', name: 'Green', color: '#27ae60', price: 0 },
    { id: 'blue', name: 'Blue', color: '#2980b9', price: 10 },
    { id: 'red', name: 'Red', color: '#c0392b', price: 20 },
    { id: 'purple', name: 'Purple', color: '#8e44ad', price: 30 },
    { id: 'gold', name: 'Gold', color: '#f1c40f', price: 50 },
];

const bgSkins = [
    { id: 'black', name: 'Black', color: '#000000', price: 0 },
    { id: 'dark-grey', name: 'Dark Grey', color: '#2c3e50', price: 10 },
    { id: 'navy', name: 'Navy', color: '#1a2a6c', price: 20 },
    { id: 'forest', name: 'Forest', color: '#0B3D1B', price: 30 },
];

let ownedSkins = JSON.parse(localStorage.getItem('snakeOwnedSkins')) || ['green'];
let ownedBgs = JSON.parse(localStorage.getItem('snakeOwnedBgs')) || ['black'];
let currentSkin = localStorage.getItem('snakeCurrentSkin') || 'green';
let currentBg = localStorage.getItem('snakeCurrentBg') || 'black';

function initShop() {
    snakeSkinsContainer.innerHTML = '';
    snakeSkins.forEach(skin => {
        const item = document.createElement('div');
        item.className = `skin-item ${ownedSkins.includes(skin.id) ? 'owned' : ''} ${currentSkin === skin.id ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="skin-preview" style="background-color: ${skin.color}"></div>
            <div class="price">${ownedSkins.includes(skin.id) ? '' : skin.price}</div>
        `;
        item.onclick = () => buyOrSelectSkin(skin, 'snake');
        snakeSkinsContainer.appendChild(item);
    });

    bgSkinsContainer.innerHTML = '';
    bgSkins.forEach(bg => {
        const item = document.createElement('div');
        item.className = `skin-item ${ownedBgs.includes(bg.id) ? 'owned' : ''} ${currentBg === bg.id ? 'selected' : ''}`;
        item.innerHTML = `
            <div class="skin-preview" style="background-color: ${bg.color}"></div>
            <div class="price">${ownedBgs.includes(bg.id) ? '' : bg.price}</div>
        `;
        item.onclick = () => buyOrSelectSkin(bg, 'bg');
        bgSkinsContainer.appendChild(item);
    });
}

function buyOrSelectSkin(item, type) {
    if (type === 'snake') {
        if (ownedSkins.includes(item.id)) {
            currentSkin = item.id;
        } else if (coins >= item.price) {
            coins -= item.price;
            ownedSkins.push(item.id);
            currentSkin = item.id;
        }
    } else {
        if (ownedBgs.includes(item.id)) {
            currentBg = item.id;
        } else if (coins >= item.price) {
            coins -= item.price;
            ownedBgs.push(item.id);
            currentBg = item.id;
        }
    }
    saveData();
    updateUI();
    initShop();
    drawGame(); // Redraw to show changes
}

function saveData() {
    localStorage.setItem('snakeCoins', coins);
    localStorage.setItem('snakeOwnedSkins', JSON.stringify(ownedSkins));
    localStorage.setItem('snakeOwnedBgs', JSON.stringify(ownedBgs));
    localStorage.setItem('snakeCurrentSkin', currentSkin);
    localStorage.setItem('snakeCurrentBg', currentBg);
}

function updateUI() {
    scoreElement.innerText = score;
    coinsElement.innerText = coins;
}

function startGame() {
    if (gameInterval) clearInterval(gameInterval);
    resetGame();
    dx = 1;
    dy = 0;
    gameInterval = setInterval(main, gameSpeed);
    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
}

function resetGame() {
    score = 0;
    snake = [{ x: 10, y: 10 }];
    generateFood();
    updateUI();
}

function main() {
    if (didGameEnd()) {
        clearInterval(gameInterval);
        restartBtn.style.display = 'inline-block';
        return;
    }

    advanceSnake();
    drawGame();
}

function drawGame() {
    // Draw background
    const bg = bgSkins.find(b => b.id === currentBg);
    ctx.fillStyle = bg ? bg.color : '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    const skin = snakeSkins.find(s => s.id === currentSkin);
    ctx.fillStyle = skin ? skin.color : '#27ae60';
    snake.forEach(part => {
        ctx.fillRect(part.x * gridSize, part.y * gridSize, gridSize - 2, gridSize - 2);
    });

    // Draw food
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function advanceSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        coins += 1;
        saveData();
        updateUI();
        generateFood();
    } else {
        snake.pop();
    }
}

function didGameEnd() {
    for (let i = 4; i < snake.length; i++) {
        if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) return true;
    }
    const hitLeftWall = snake[0].x < 0;
    const hitRightWall = snake[0].x > tileCount - 1;
    const hitTopWall = snake[0].y < 0;
    const hitBottomWall = snake[0].y > tileCount - 1;
    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    // Ensure food doesn't spawn on snake body
    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) generateFood();
    });
}

function changeDirection(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy === -1;
    const goingDown = dy === 1;
    const goingRight = dx === 1;
    const goingLeft = dx === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -1;
        dy = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = 1;
        dy = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = 1;
    }
}

document.addEventListener('keydown', changeDirection);
startBtn.onclick = startGame;
restartBtn.onclick = startGame;

initShop();
updateUI();
drawGame();
