/**
 * Neon Brick Breaker - Game Logic
 */

// Game Constants and Configuration
const CONFIG = {
    PADDLE_WIDTH: 100,
    PADDLE_HEIGHT: 15,
    PADDLE_OFFSET: 50, // Distance from bottom
    BALL_RADIUS: 8,
    BALL_SPEED_BASE: 6,
    BALL_SPEED_MAX: 12,
    BRICK_ROWS: 5,
    BRICK_COLS: 8,
    BRICK_GAP: 10,
    BRICK_HEIGHT: 25,
    COLORS: [
        '#bc13fe', // Purple
        '#00f3ff', // Cyan
        '#00ff88', // Green
        '#ffff00', // Yellow
        '#ff0055'  // Red
    ]
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.life = 1.0; // Opacity/Life
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.globalAlpha = 1.0;
    }
}

class Paddle {
    constructor(game) {
        this.game = game;
        this.width = CONFIG.PADDLE_WIDTH;
        this.height = CONFIG.PADDLE_HEIGHT;
        this.x = (game.width - this.width) / 2;
        this.y = game.height - CONFIG.PADDLE_OFFSET;
        this.color = '#fff';
    }

    update(mouseX) {
        // Center paddle on mouse, clamped to screen bounds
        this.x = mouseX - this.width / 2;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
    }

    draw(ctx) {
        // Glow effect
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 20;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.shadowBlur = 0; // Reset
    }
}

class Ball {
    constructor(game) {
        this.game = game;
        this.radius = CONFIG.BALL_RADIUS;
        this.reset();
    }

    reset() {
        this.x = this.game.width / 2;
        this.y = this.game.height - 100;
        this.speed = CONFIG.BALL_SPEED_BASE;
        // Random initial angle mostly upwards
        const angle = -Math.PI / 2 + (Math.random() * 0.8 - 0.4);
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
        this.active = false; // Waiting for launch
    }

    launch() {
        if (!this.active) {
            this.active = true;
        }
    }

    update() {
        if (!this.active) {
            // Stick to paddle if not launched
            this.x = this.game.paddle.x + this.game.paddle.width / 2;
            this.y = this.game.paddle.y - this.radius - 2;
            return;
        }

        this.x += this.dx;
        this.y += this.dy;

        // Wall collisions
        if (this.x + this.radius > this.game.width) {
            this.x = this.game.width - this.radius;
            this.dx *= -1;
            this.game.playSound('bounce');
        } else if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.dx *= -1;
            this.game.playSound('bounce');
        }

        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.dy *= -1;
            this.game.playSound('bounce');
        } else if (this.y + this.radius > this.game.height) {
            // Game Over / Life Lost
            this.game.loseLife();
        }

        // Paddle collision
        const p = this.game.paddle;
        if (
            this.x > p.x &&
            this.x < p.x + p.width &&
            this.y + this.radius > p.y &&
            this.y - this.radius < p.y + p.height
        ) {
            // Basic reflection
            this.dy *= -1;
            this.y = p.y - this.radius;

            // Add some "english" based on where it hit the paddle
            const hitPoint = this.x - (p.x + p.width / 2);
            this.dx = hitPoint * 0.15;

            // Speed up slightly
            this.speed = Math.min(this.speed * 1.05, CONFIG.BALL_SPEED_MAX);

            // Normalize velocity to keep consistent speed
            const mag = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx = (this.dx / mag) * this.speed;
            this.dy = (this.dy / mag) * this.speed;

            this.game.playSound('paddle');
            this.game.createParticles(this.x, this.y, '#ffffff');
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();

        // Trail effect (optional simple glow)
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Brick {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.status = 1; // 1 = active, 0 = destroyed
    }

    draw(ctx) {
        if (this.status === 1) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.fillStyle = this.color;
            // Rounded rectangle for style
            this.roundRect(ctx, this.x, this.y, this.width, this.height, 4);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Inner shine
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            this.roundRect(ctx, this.x, this.y, this.width, this.height / 2, 4);
            ctx.fill();
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.uiLayer = {
            start: document.getElementById('start-screen'),
            gameOver: document.getElementById('game-over-screen'),
            win: document.getElementById('win-screen'),
            hud: document.getElementById('hud'),
            score: document.getElementById('score'),
            lives: document.getElementById('lives'),
            finalScore: document.getElementById('final-score'),
            btns: {
                start: document.getElementById('start-btn'),
                restart: document.getElementById('restart-btn'),
                playAgain: document.getElementById('play-again-btn')
            }
        };

        this.updateDimensions();

        this.paddle = new Paddle(this);
        this.ball = new Ball(this);
        this.bricks = [];
        this.particles = [];

        this.initAudio();

        this.score = 0;
        this.lives = 3;
        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER, WIN

        this.initListeners();
        this.generateBricks();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initListeners() {
        window.addEventListener('resize', () => this.updateDimensions());

        window.addEventListener('mousemove', (e) => {
            if (this.state === 'PLAYING' || this.state === 'MENU') {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                this.paddle.update(mouseX);
            }
        });

        window.addEventListener('click', () => {
            if (this.state === 'PLAYING' && !this.ball.active) {
                this.ball.launch();
            }
        });

        this.uiLayer.btns.start.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Start Button Clicked');
            this.startGame();
        });
        this.uiLayer.btns.restart.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startGame();
        });
        this.uiLayer.btns.playAgain.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startGame();
        });
    }

    updateDimensions() {
        this.width = this.canvas.parentElement.offsetWidth;
        this.height = this.canvas.parentElement.offsetHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        console.log(`Dimensions updated: ${this.width}x${this.height}`);

        // Re-position paddle if game is running to avoid getting stuck
        if (this.paddle) this.paddle.y = this.height - CONFIG.PADDLE_OFFSET;
    }

    generateBricks() {
        this.bricks = [];
        const cols = CONFIG.BRICK_COLS;
        const rows = CONFIG.BRICK_ROWS;

        // Calculate dynamic width to fit screen
        const padding = 20;
        const availableWidth = this.width - (padding * 2);
        const brickWidth = (availableWidth - (cols - 1) * CONFIG.BRICK_GAP) / cols;
        const startX = padding;
        const startY = 80;

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const x = startX + (c * (brickWidth + CONFIG.BRICK_GAP));
                const y = startY + (r * (CONFIG.BRICK_HEIGHT + CONFIG.BRICK_GAP));
                const color = CONFIG.COLORS[r % CONFIG.COLORS.length];
                this.bricks.push(new Brick(x, y, brickWidth, CONFIG.BRICK_HEIGHT, color));
            }
        }
    }

    startGame() {
        this.score = 0;
        this.lives = 3;
        this.ball.reset();
        this.generateBricks();
        this.particles = [];
        this.state = 'PLAYING';

        this.uiLayer.start.classList.add('hidden');
        this.uiLayer.start.classList.remove('active');
        this.uiLayer.gameOver.classList.add('hidden');
        this.uiLayer.gameOver.classList.remove('active');
        this.uiLayer.win.classList.add('hidden');
        this.uiLayer.win.classList.remove('active');
        this.uiLayer.hud.classList.remove('hidden');

        this.updateUI();
    }

    loseLife() {
        this.lives--;
        this.updateUI();
        this.createParticles(this.ball.x, this.ball.y, '#ff0055', 20); // Death explosion

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.ball.reset();
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.uiLayer.hud.classList.add('hidden');
        this.uiLayer.gameOver.classList.remove('hidden');
        this.uiLayer.gameOver.classList.add('active');
        this.uiLayer.finalScore.textContent = `Score: ${this.score}`;
    }

    checkWin() {
        const activeBricks = this.bricks.filter(b => b.status === 1);
        if (activeBricks.length === 0) {
            this.state = 'WIN';
            this.uiLayer.hud.classList.add('hidden');
            this.uiLayer.win.classList.remove('hidden');
            this.uiLayer.win.classList.add('active');
            this.createParticles(this.width / 2, this.height / 2, '#00ff88', 100); // Celebration
        }
    }

    updateUI() {
        this.uiLayer.score.textContent = this.score;
        this.uiLayer.lives.textContent = this.lives;
    }

    createParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    // Simple sound synthesis so we don't need external assets
    initAudio() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioCtx = new AudioContext();
        }
    }

    playSound(type) {
        try {
            if (!this.audioCtx) return;

            // Resume context if suspended (browser policy)
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const now = this.audioCtx.currentTime;

            if (type === 'bounce') {
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'brick') {
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'paddle') {
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            }
        } catch (e) {
            console.error('Audio Error:', e);
            // Don't crash the game just because sound failed
        }
    }

    detectCollisions() {
        for (const b of this.bricks) {
            if (b.status === 1) {
                if (
                    this.ball.x + this.ball.radius > b.x &&
                    this.ball.x - this.ball.radius < b.x + b.width &&
                    this.ball.y + this.ball.radius > b.y &&
                    this.ball.y - this.ball.radius < b.y + b.height
                ) {
                    console.log(`Collision: Brick at ${b.x.toFixed(0)},${b.y.toFixed(0)}`);
                    this.ball.dy *= -1;
                    b.status = 0;
                    this.score += 10;
                    this.updateUI();

                    try {
                        this.createParticles(b.x + b.width / 2, b.y + b.height / 2, b.color, 12);
                        this.playSound('brick');
                    } catch (e) {
                        console.error('Effect Error:', e);
                    }

                    this.checkWin();
                }
            }
        }
    }

    loop() {
        // Clear screen
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.state === 'PLAYING') {
            this.ball.update();
            this.detectCollisions();
        }

        // Draw everything
        if (this.state !== 'MENU') {
            this.bricks.forEach(b => b.draw(this.ctx));
            this.paddle.draw(this.ctx);
            this.ball.draw(this.ctx);
        }

        // Draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            p.draw(this.ctx);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // If in Menu, maybe draw a simple attract mode / idle animation in background
        // For now, we leave it clear or show static bricks

        requestAnimationFrame(this.loop);
    }
}

// Start Game
window.onload = () => {
    window.game = new Game();
    console.log('Game instance created and exposed to window.game');
};
