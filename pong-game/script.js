// ==================== Game Configuration ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreDisplay = document.getElementById('playerScore');
const computerScoreDisplay = document.getElementById('computerScore');
const gameStatusDisplay = document.getElementById('gameStatus');

// Game variables
let playerScore = 0;
let computerScore = 0;
let gameActive = true;
const winCondition = 5;

// ==================== Paddle Object ====================
class Paddle {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.dy = 0;
        this.maxSpeed = 6;
    }

    update() {
        this.y += this.dy;

        // Boundary checking
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
        }
    }

    draw() {
        // Paddle body with gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, this.color + 'cc');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Paddle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// ==================== Ball Object ====================
class Ball {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 8;
        this.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
        this.dy = (Math.random() * 2 - 1) * 5;
        this.speed = 5;
        this.maxSpeed = 8;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // ==================== Wall Collision ====================
        // Top wall
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy = -this.dy;
        }

        // Bottom wall
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.dy = -this.dy;
        }

        // Left wall (player scores)
        if (this.x - this.radius < 0) {
            computerScore++;
            updateScore();
            this.reset();
        }

        // Right wall (computer scores)
        if (this.x + this.radius > canvas.width) {
            playerScore++;
            updateScore();
            this.reset();
        }
    }

    draw() {
        // Ball with glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // ==================== Paddle Collision Detection ====================
    checkPaddleCollision(paddle) {
        // Check if ball is within paddle x range
        if (this.x - this.radius < paddle.x + paddle.width &&
            this.x + this.radius > paddle.x) {

            // Check if ball is within paddle y range
            if (this.y - this.radius < paddle.y + paddle.height &&
                this.y + this.radius > paddle.y) {

                // Bounce the ball
                this.dx = -this.dx;

                // Calculate impact position (0 to 1, where 0.5 is center)
                const impactPos = (this.y - paddle.y) / paddle.height;

                // Add spin based on impact position
                this.dy = (impactPos - 0.5) * 10;

                // Increase ball speed slightly (up to max)
                this.speed = Math.min(this.speed + 0.5, this.maxSpeed);
                this.dx *= (this.speed / 5);
                this.dy *= (this.speed / 5);

                // Push ball out of paddle to prevent multiple collisions
                this.x = paddle.x + (paddle.width / 2) + (this.radius * (this.dx > 0 ? 1 : -1));
            }
        }
    }
}

// ==================== Computer AI ====================
class ComputerAI {
    constructor(paddle) {
        this.paddle = paddle;
        this.difficulty = 0.5; // 0-1, higher = harder
    }

    update(ball) {
        const paddleCenter = this.paddle.y + this.paddle.height / 2;
        const ballCenter = ball.y;
        const deadZone = 15; // Small zone where AI doesn't move

        // Predictive movement: look ahead to where ball will be
        const timeToReach = Math.abs(ball.x - this.paddle.x) / Math.abs(ball.dx || 1);
        const predictedY = ball.y + ball.dy * timeToReach * 0.8;

        // AI decides to move
        if (Math.abs(ballCenter - paddleCenter) > deadZone) {
            if (predictedY < paddleCenter - 30) {
                this.paddle.dy = -this.paddle.maxSpeed;
            } else if (predictedY > paddleCenter + 30) {
                this.paddle.dy = this.paddle.maxSpeed;
            } else {
                this.paddle.dy = 0;
            }
        } else {
            this.paddle.dy = 0;
        }
    }
}

// ==================== Initialize Game Objects ====================
const player = new Paddle(10, canvas.height / 2 - 50, 10, 100, '#4ade80');
const computer = new Paddle(canvas.width - 20, canvas.height / 2 - 50, 10, 100, '#ef4444');
const ball = new Ball();
const ai = new ComputerAI(computer);

// ==================== Input Handling ====================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Arrow Keys
    if (e.key === 'ArrowUp' && player.y > 0) {
        player.dy = -player.maxSpeed;
    }
    if (e.key === 'ArrowDown' && player.y < canvas.height - player.height) {
        player.dy = player.maxSpeed;
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;

    // Stop paddle when key is released
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        player.dy = 0;
    }
});

// ==================== Mouse Control (Optional) ====================
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    // Move paddle to follow mouse
    const paddleCenter = player.y + player.height / 2;
    const deadZone = 20;

    if (mouseY < paddleCenter - deadZone) {
        player.dy = -player.maxSpeed;
    } else if (mouseY > paddleCenter + deadZone) {
        player.dy = player.maxSpeed;
    } else {
        player.dy = 0;
    }
});

// ==================== Score Update ====================
function updateScore() {
    playerScoreDisplay.textContent = playerScore;
    computerScoreDisplay.textContent = computerScore;

    // Check win condition
    if (playerScore >= winCondition) {
        gameStatusDisplay.textContent = '🎉 YOU WIN! Well played!';
        gameActive = false;
    } else if (computerScore >= winCondition) {
        gameStatusDisplay.textContent = '🤖 Computer Wins! Try Again!';
        gameActive = false;
    }
}

// ==================== Reset Game ====================
function resetGame() {
    playerScore = 0;
    computerScore = 0;
    gameActive = true;
    gameStatusDisplay.textContent = '';
    playerScoreDisplay.textContent = '0';
    computerScoreDisplay.textContent = '0';
    ball.reset();
    player.y = canvas.height / 2 - 50;
    computer.y = canvas.height / 2 - 50;
}

// ==================== Game Loop ====================
function gameLoop() {
    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    if (gameActive) {
        // Update game state
        player.update();
        computer.update();
        ball.update();

        // Collision detection
        ball.checkPaddleCollision(player);
        ball.checkPaddleCollision(computer);

        // Computer AI
        ai.update(ball);
    }

    // Draw game objects
    player.draw();
    computer.draw();
    ball.draw();

    // Continue loop
    requestAnimationFrame(gameLoop);
}

// ==================== Start Game ====================
gameLoop();
