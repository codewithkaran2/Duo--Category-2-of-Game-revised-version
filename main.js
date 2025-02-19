// Full screen toggle function
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

// Get canvas and context
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Default player names
const defaultP1Name = "Player 1";
const defaultP2Name = "Player 2";
let p1Name = defaultP1Name;
let p2Name = defaultP2Name;

// Set initial labels
document.querySelector('.p1-label').textContent = "🟦 " + p1Name;
document.querySelector('.p2-label').textContent = "🟥 " + p2Name;

// Game speed and state
const speed = 5;
let gameRunning = true;

// Player objects with initial positions and properties
const player1 = {
  x: 100,
  y: 0,
  width: 40,
  height: 40,
  color: "blue",
  health: 100,
  shield: 100,
  shieldActive: false,
  message: "",
  canShoot: true
};
const player2 = {
  x: 600,
  y: 0,
  width: 40,
  height: 40,
  color: "red",
  health: 100,
  shield: 100,
  shieldActive: false,
  message: "",
  canShoot: true
};

let bullets = [];

// Keys object for movement, shooting, and shield activation
const keys = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
  " ": false, q: false, Enter: false, m: false
};

// Event listeners for keydown and keyup
document.addEventListener("keydown", (e) => {
  if (e.key === "CapsLock") {
    e.preventDefault();
    return;
  }
  if (keys.hasOwnProperty(e.key)) {
    // Handle shooting: Player 1 uses SPACE; Player 2 uses ENTER
    if (e.key === " " && player1.canShoot) {
      shootBullet(player1, 1);
      player1.canShoot = false;
    } else if (e.key === "Enter" && player2.canShoot) {
      shootBullet(player2, 2);
      player2.canShoot = false;
    }
    keys[e.key] = true;
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "CapsLock") {
    e.preventDefault();
    return;
  }
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
    // Reset shooting cooldown on keyup
    if (e.key === " ") {
      player1.canShoot = true;
    } else if (e.key === "Enter") {
      player2.canShoot = true;
    }
  }
});

// Function to move players based on pressed keys
function movePlayers() {
  if (keys.a && player1.x > 0) player1.x -= speed;
  if (keys.d && player1.x + player1.width < canvas.width) player1.x += speed;
  if (keys.w && player1.y > 0) player1.y -= speed;
  if (keys.s && player1.y + player1.height < canvas.height) player1.y += speed;

  if (keys.ArrowLeft && player2.x > 0) player2.x -= speed;
  if (keys.ArrowRight && player2.x + player2.width < canvas.width) player2.x += speed;
  if (keys.ArrowUp && player2.y > 0) player2.y -= speed;
  if (keys.ArrowDown && player2.y + player2.height < canvas.height) player2.y += speed;

  // Update shield activation based on keys pressed
  player1.shieldActive = keys.q;
  player2.shieldActive = keys.m;
}

// Main game loop
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  movePlayers();
  updateBullets();
  drawPlayer(player1);
  drawPlayer(player2);
  drawMessage(player1);
  drawMessage(player2);
  checkGameOver();
  requestAnimationFrame(gameLoop);
}

// Draw a player and, if active, their shield
function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  if (player.shieldActive) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Draw a message (if any) above the player
function drawMessage(player) {
  if (player.message) {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(player.message, player.x - 10, player.y - 10);
  }
}

// Shoot bullet function
function shootBullet(player, owner) {
  const bullet = {
    x: owner === 1 ? player.x + player.width : player.x - 10,
    y: player.y + player.height / 2 - 2,
    width: 10,
    height: 4,
    speedX: owner === 1 ? 10 : -10,
    speedY: 0,
    owner: owner
  };
  bullets.push(bullet);
}

// Update bullets: move them, draw them, and handle collisions.
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;
    
    // Draw the bullet
    ctx.fillStyle = bullet.owner === 1 ? "cyan" : "orange";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    
    // Remove bullet if off-screen
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Check collision with opponent
    if (bullet.owner === 1 && rectCollision(bullet, player2)) {
      if (player2.shieldActive && player2.shield > 0) {
        player2.shield -= 10;
        if (player2.shield < 0) player2.shield = 0;
      } else {
        player2.health -= 10;
        if (player2.health < 0) player2.health = 0;
      }
      bullets.splice(i, 1);
      updateHealthBars();
      continue;
    } else if (bullet.owner === 2 && rectCollision(bullet, player1)) {
      if (player1.shieldActive && player1.shield > 0) {
        player1.shield -= 10;
        if (player1.shield < 0) player1.shield = 0;
      } else {
        player1.health -= 10;
        if (player1.health < 0) player1.health = 0;
      }
      bullets.splice(i, 1);
      updateHealthBars();
      continue;
    }
  }
}

// Helper function: rectangle collision detection
function rectCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Update health bar elements in the DOM
function updateHealthBars() {
  const p1HealthBar = document.getElementById("p1HealthBar");
  const p2HealthBar = document.getElementById("p2HealthBar");
  const p1HealthText = document.getElementById("p1HealthText");
  const p2HealthText = document.getElementById("p2HealthText");

  p1HealthBar.style.width = player1.health + "%";
  p2HealthBar.style.width = player2.health + "%";
  p1HealthText.textContent = player1.health + "%";
  p2HealthText.textContent = player2.health + "%";
}

// Check if the game is over and display the winner
function checkGameOver() {
  if (player1.health <= 0 || player2.health <= 0) {
    gameRunning = false;
    let winnerText = "";
    if (player1.health <= 0 && player2.health <= 0) {
      winnerText = "It's a draw!";
    } else if (player1.health <= 0) {
      winnerText = (document.getElementById("p2NameDisplay") ? document.getElementById("p2NameDisplay").textContent : "Player 2") + " wins!";
    } else if (player2.health <= 0) {
      winnerText = (document.getElementById("p1NameDisplay") ? document.getElementById("p1NameDisplay").textContent : "Player 1") + " wins!";
    }
    document.getElementById("winner").textContent = winnerText;
  }
}

// Restart Game & Reset Players and Names
function restartGame() {
  // Exit full screen if active
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  // Reset positions and stats
  player1.x = 100;
  player1.y = 0;
  player2.x = 600;
  player2.y = 0;
  player1.health = 100;
  player2.health = 100;
  player1.shield = 100;
  player2.shield = 100;
  gameRunning = false;
  bullets = [];
  document.getElementById("winner").textContent = "";

  // Reset player names
  document.getElementById("p1Name").value = "";
  document.getElementById("p2Name").value = "";
  p1Name = defaultP1Name;
  p2Name = defaultP2Name;
  document.querySelector('.p1-label').textContent = "🟦 " + p1Name;
  document.querySelector('.p2-label').textContent = "🟥 " + p2Name;
  const p1NameDisplay = document.getElementById("p1NameDisplay");
  if (p1NameDisplay) p1NameDisplay.textContent = "🟦 " + p1Name;
  const p2NameDisplay = document.getElementById("p2NameDisplay");
  if (p2NameDisplay) p2NameDisplay.textContent = "🟥 " + p2Name;

  dropPlayers();
}

// Drop players with animation (from y=0 to y=300)
function dropPlayers() {
  let dropSpeed = 5;
  function animateDrop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (player1.y < 300) player1.y += dropSpeed;
    if (player2.y < 300) player2.y += dropSpeed;
    drawPlayer(player1);
    drawPlayer(player2);
    if (player1.y >= 300 && player2.y >= 300) {
      player1.message = "Player 1!";
      player2.message = "Player 2!";
      setTimeout(() => {
        player1.message = "";
        player2.message = "";
      }, 2000);
      gameRunning = true;
      gameLoop();
      return;
    }
    requestAnimationFrame(animateDrop);
  }
  animateDrop();
}

// Start the game with drop animation
dropPlayers();

// Automatic Name Update on Input
document.getElementById("p1Name").addEventListener("input", function() {
  let newName = this.value.trim();
  if(newName === "") newName = defaultP1Name;
  document.querySelector('.p1-label').textContent = "🟦 " + newName;
  const nameDisplay = document.getElementById("p1NameDisplay");
  if (nameDisplay) {
    nameDisplay.textContent = "🟦 " + newName;
  }
});

document.getElementById("p2Name").addEventListener("input", function() {
  let newName = this.value.trim();
  if(newName === "") newName = defaultP2Name;
  document.querySelector('.p2-label').textContent = "🟥 " + newName;
  const nameDisplay = document.getElementById("p2NameDisplay");
  if (nameDisplay) {
    nameDisplay.textContent = "🟥 " + newName;
  }
});
