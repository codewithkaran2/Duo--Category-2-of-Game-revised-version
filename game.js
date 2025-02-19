const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Prompt for player names and update labels
let p1Name = prompt("Enter name for Player 1:", "Player 1") || "Player 1";
let p2Name = prompt("Enter name for Player 2:", "Player 2") || "Player 2";
document.querySelector('.p1-label').textContent = "🟦 " + p1Name;
document.querySelector('.p2-label').textContent = "🟥 " + p2Name;

// Set game speed and state
const speed = 5;
let gameRunning = true;

// Modified starting positions so players are always visible on canvas (y starts at 0)
// Added property canShoot to manage firing cooldown.
const player1 = { x: 100, y: 0, width: 40, height: 40, color: "blue", health: 100, shield: 100, shieldActive: false, message: "", canShoot: true };
const player2 = { x: 600, y: 0, width: 40, height: 40, color: "red", health: 100, shield: 100, shieldActive: false, message: "", canShoot: true };

let bullets = [];

// Extended keys object to include shooting and shield keys:
// For Player 1: Shoot - SPACE (" "), Shield - Q (q)
// For Player 2: Shoot - ENTER, Shield - M (m)
const keys = {
  w: false, a: false, s: false, d: false,  // Player 1 movement
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false, // Player 2 movement
  " ": false, q: false, Enter: false, m: false // Shooting and shield keys
};

// 🎮 Event listeners – also locking the CapsLock key and handling shooting cooldown.
document.addEventListener("keydown", (e) => {
  if (e.key === "CapsLock") {
    e.preventDefault();
    return;
  }
  if (keys.hasOwnProperty(e.key)) {
    // Handle shooting for Player 1 and Player 2
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
    // Reset shooting cooldown when the shoot key is released
    if(e.key === " ") {
      player1.canShoot = true;
    } else if(e.key === "Enter") {
      player2.canShoot = true;
    }
  }
});

// 🎮 Move Player Function
function movePlayers() {
  if (keys.a && player1.x > 0) player1.x -= speed;
  if (keys.d && player1.x + player1.width < canvas.width) player1.x += speed;
  if (keys.w && player1.y > 0) player1.y -= speed;
  if (keys.s && player1.y + player1.height < canvas.height) player1.y += speed;

  if (keys.ArrowLeft && player2.x > 0) player2.x -= speed;
  if (keys.ArrowRight && player2.x + player2.width < canvas.width) player2.x += speed;
  if (keys.ArrowUp && player2.y > 0) player2.y -= speed;
  if (keys.ArrowDown && player2.y + player2.height < canvas.height) player2.y += speed;
  
  // Update shield activation based on key press:
  player1.shieldActive = keys.q;
  player2.shieldActive = keys.m;
}

// 🕹️ Game Loop
function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  movePlayers();
  updateBullets();
  drawPlayer(player1);
  drawPlayer(player2);
  drawMessage(player1);
  drawMessage(player2);
  requestAnimationFrame(gameLoop);
}

// 🎭 Draw Player (with shield effect if active)
function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  if (player.shieldActive) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// 🎭 Draw Player Messages
function drawMessage(player) {
  if (player.message) {
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.fillText(player.message, player.x - 10, player.y - 10);
  }
}

// 🔫 Shoot Bullet Function
function shootBullet(player, owner) {
  // For simplicity, bullets are fired horizontally:
  // Player 1 shoots to the right; Player 2 shoots to the left.
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

// 🔄 Update Bullets: move, draw, and handle collisions.
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.speedX;
    bullet.y += bullet.speedY;
    
    // Draw bullet (different color for each player)
    ctx.fillStyle = bullet.owner === 1 ? "cyan" : "orange";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    
    // Remove bullet if off screen
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }
    
    // Check collision with opponent (ignoring the owner)
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

// Helper function to detect rectangle collision
function rectCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

// Update health bars based on current health values
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

// 🔄 Restart Game & Drop Players
function restartGame() {
  // Fix for Full Screen glitch: exit full screen if active
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  // Reset positions so players are visible (y is set to 0)
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
  dropPlayers();
}

// 🎬 Drop Players with Animation (players drop from y=0 to y=300)
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

// 🚀 Start Game
dropPlayers();
