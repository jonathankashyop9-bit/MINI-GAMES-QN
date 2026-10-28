const appArea = document.getElementById("appArea");
const gameArea = document.getElementById("gameArea");
const appPanel = document.getElementById("appPanel");
const gamePanel = document.getElementById("gamePanel");
const appTitle = document.getElementById("appTitle");
const gameTitle = document.getElementById("gameTitle");

let stopwatchInterval;
let stopwatchStartedAt = 0;
let stopwatchElapsed = 0;
let timerInterval;
let timerRemaining = 0;
let clickInterval;
let clickCount = 0;
let clickTimeLeft = 10;
let mathInterval;
let mathTimeLeft = 30;
let mathScore = 0;
let snakeInterval;
let memoryTimeout;
let activeGame = "";

function stopIntervals() {
  clearInterval(stopwatchInterval);
  clearInterval(timerInterval);
  clearInterval(clickInterval);
  clearInterval(mathInterval);
  clearInterval(snakeInterval);
  clearTimeout(memoryTimeout);
  stopwatchInterval = undefined;
  timerInterval = undefined;
  clickInterval = undefined;
  mathInterval = undefined;
  snakeInterval = undefined;
  memoryTimeout = undefined;
}

function showPanel(panel) {
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeApp() {
  stopIntervals();
  appPanel.hidden = true;
  appArea.replaceChildren();
}

function closeGame() {
  stopIntervals();
  activeGame = "";
  gamePanel.hidden = true;
  gameArea.replaceChildren();
}

function openApp(name) {
  stopIntervals();
  const apps = {
    calculator: {
      title: "Calculator",
      content: `<div class="inline-tools">
        <input id="calcFirst" class="tool-input" type="number" step="any" placeholder="First number" aria-label="First number">
        <select id="calcOperator" class="tool-select" aria-label="Operation">
          <option value="+">+</option><option value="-">−</option><option value="*">×</option><option value="/">÷</option>
        </select>
        <input id="calcSecond" class="tool-input" type="number" step="any" placeholder="Second number" aria-label="Second number">
        <button class="btn primary" data-action="calculate">Calculate</button>
      </div><p class="output" id="calcOutput" aria-live="polite">Enter two numbers.</p>`
    },
    stopwatch: {
      title: "Stopwatch",
      content: `<p class="big-number" id="stopwatchDisplay">00:00.0</p>
        <button class="btn primary" data-action="stopwatch-start">Start</button>
        <button class="btn secondary" data-action="stopwatch-pause">Pause</button>
        <button class="btn secondary" data-action="stopwatch-reset">Reset</button>`
    },
    timer: {
      title: "Countdown Timer",
      content: `<label for="timerSeconds">Duration in seconds</label><br>
        <input id="timerSeconds" class="tool-input" type="number" min="1" step="1" value="60">
        <button class="btn primary" data-action="timer-start">Start</button>
        <button class="btn secondary" data-action="timer-stop">Stop</button>
        <p class="output" id="timerDisplay" aria-live="polite">60 seconds remaining</p>`
    },
    todo: {
      title: "To-do List",
      content: `<form id="todoForm" data-form="todo">
        <label for="todoInput">New task</label><br>
        <input id="todoInput" class="tool-input" maxlength="200" required placeholder="What needs doing?">
        <button class="btn primary" type="submit">Add task</button>
      </form><ul id="todoList"></ul><p id="storageMessage" role="status"></p>`
    },
    notes: {
      title: "Notes",
      content: `<label for="notesText">Your notes</label><br>
        <textarea id="notesText" class="tool-textarea" placeholder="Write something..."></textarea><br>
        <button class="btn primary" data-action="save-notes">Save notes</button>
        <p id="storageMessage" role="status"></p>`
    },
    convert: {
      title: "Unit Converter",
      content: `<label for="kmInput">Kilometres</label><br>
        <input id="kmInput" class="tool-input" type="number" min="0" step="any" placeholder="Enter kilometres">
        <p class="output" id="mileOutput" aria-live="polite">Miles will appear here.</p>`
    },
    password: {
      title: "Password Generator",
      content: `<label for="passwordLength">Password length (8–128)</label><br>
        <input id="passwordLength" class="tool-input" type="number" min="8" max="128" value="16">
        <button class="btn primary" data-action="generate-password">Generate</button>
        <p class="output" id="passwordOutput" aria-live="polite">Your password will appear here.</p>`
    },
    words: {
      title: "Word Counter",
      content: `<label for="wordText">Text to count</label><br>
        <textarea id="wordText" class="tool-textarea" placeholder="Type or paste text here..."></textarea>
        <p class="output" id="wordOutput" aria-live="polite">0 words · 0 characters</p>`
    },
    age: {
      title: "Age Calculator",
      content: `<label for="birthDate">Date of birth</label><br>
        <input id="birthDate" class="tool-input" type="date">
        <button class="btn primary" data-action="calculate-age">Calculate age</button>
        <p class="output" id="ageOutput" aria-live="polite">Choose your date of birth.</p>`
    },
    percent: {
      title: "Percentage Calculator",
      content: `<div class="inline-tools">
        <input id="marksEarned" class="tool-input" type="number" min="0" step="any" placeholder="Marks earned" aria-label="Marks earned">
        <span>out of</span>
        <input id="marksTotal" class="tool-input" type="number" min="0" step="any" placeholder="Total marks" aria-label="Total marks">
        <button class="btn primary" data-action="calculate-percent">Calculate</button>
      </div><p class="output" id="percentOutput" aria-live="polite">Enter your marks.</p>`
    }
  };
  const app = apps[name];
  if (!app) throw new Error(`Unknown app: ${name}`);

  appTitle.textContent = app.title;
  appArea.innerHTML = app.content;
  appPanel.hidden = false;
  if (name === "todo") renderTodos();
  if (name === "notes") document.getElementById("notesText").value = readStorage("pixelport-notes", "");
  showPanel(appPanel);
}

function readStorage(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Unable to read saved data for ${key}.`, error);
    const message = document.getElementById("storageMessage");
    if (message) message.textContent = "Saved data could not be read.";
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    const message = document.getElementById("storageMessage");
    if (message) message.textContent = "Saved.";
  } catch (error) {
    console.error(`Unable to save data for ${key}.`, error);
    const message = document.getElementById("storageMessage");
    if (message) message.textContent = "Could not save. Check your browser storage settings.";
  }
}

function renderTodos() {
  const list = document.getElementById("todoList");
  if (!list) return;
  const todos = readStorage("pixelport-todos", []);
  if (!Array.isArray(todos)) {
    console.error("Saved to-do data is not a list.");
    document.getElementById("storageMessage").textContent = "Saved tasks could not be read.";
    return;
  }
  list.replaceChildren();
  todos.forEach((todo, index) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = todo;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn secondary";
    remove.dataset.action = "remove-todo";
    remove.dataset.index = String(index);
    remove.textContent = "Remove";
    item.append(label, " ", remove);
    list.append(item);
  });
}

function formatTime(milliseconds) {
  const tenths = Math.floor(milliseconds / 100) % 10;
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function calculate() {
  const firstInput = document.getElementById("calcFirst");
  const secondInput = document.getElementById("calcSecond");
  const first = Number(firstInput.value);
  const second = Number(secondInput.value);
  const operator = document.getElementById("calcOperator").value;
  const output = document.getElementById("calcOutput");
  if (firstInput.value === "" || secondInput.value === "") {
    output.textContent = "Enter both numbers.";
    return;
  }
  if (operator === "/" && second === 0) {
    output.textContent = "Cannot divide by zero.";
    return;
  }
  const operations = { "+": first + second, "-": first - second, "*": first * second, "/": first / second };
  output.textContent = `Result: ${operations[operator]}`;
}

function generatePassword() {
  const length = Number(document.getElementById("passwordLength").value);
  const output = document.getElementById("passwordOutput");
  if (!Number.isInteger(length) || length < 8 || length > 128) {
    output.textContent = "Choose a whole number between 8 and 128.";
    return;
  }
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  output.textContent = Array.from(randomValues, (value) => characters[value % characters.length]).join("");
}

function openGame(name) {
  stopIntervals();
  activeGame = name;
  const games = {
    tic: {
      title: "Tic-Tac-Toe",
      content: `<p id="ticStatus" aria-live="polite">Your turn (X).</p>
        <div class="board" id="ticBoard"></div>
        <button class="btn secondary" data-action="tic-reset">New game</button>`
    },
    snake: {
      title: "Snake",
      content: `<p>Use the arrow keys to move.</p><canvas id="snakeCanvas" class="game-canvas" width="300" height="300" aria-label="Snake game board"></canvas>
        <p id="snakeScore" aria-live="polite">Score: 0</p>
        <button class="btn primary" data-action="snake-start">Start / Restart</button>`
    },
    rps: {
      title: "Rock Paper Scissors",
      content: `<p>Choose your move.</p>
        <button class="btn primary" data-action="rps" data-choice="rock">Rock</button>
        <button class="btn primary" data-action="rps" data-choice="paper">Paper</button>
        <button class="btn primary" data-action="rps" data-choice="scissors">Scissors</button>
        <p class="output" id="rpsOutput" aria-live="polite"></p>`
    },
    guess: {
      title: "Number Guess",
      content: `<p>Guess the secret number between 1 and 100.</p>
        <form data-form="guess"><input id="guessInput" class="tool-input" type="number" min="1" max="100" required aria-label="Your guess">
        <button class="btn primary" type="submit">Guess</button></form>
        <p class="output" id="guessOutput" aria-live="polite"></p>`
    },
    memory: {
      title: "Memory Match",
      content: `<p>Find all four matching pairs.</p><div class="board" id="memoryBoard"></div>
        <p id="memoryStatus" aria-live="polite">Matches: 0 / 4</p>
        <button class="btn secondary" data-action="memory-reset">New game</button>`
    },
    click: {
      title: "Click Challenge",
      content: `<p>Click as many times as you can in 10 seconds.</p>
        <button class="btn primary" data-action="click-start">Start</button>
        <button class="btn secondary" data-action="click-target" disabled>Click me!</button>
        <p class="output" id="clickOutput" aria-live="polite">Clicks: 0 · Time: 10</p>`
    },
    math: {
      title: "Math Sprint",
      content: `<p>Solve as many questions as you can in 30 seconds.</p>
        <button class="btn primary" data-action="math-start">Start</button>
        <form data-form="math" hidden><label id="mathQuestion" for="mathAnswer"></label>
        <input id="mathAnswer" class="tool-input" type="number" required aria-label="Answer">
        <button class="btn primary" type="submit">Submit</button></form>
        <p class="output" id="mathOutput" aria-live="polite">Score: 0 · Time: 30</p>`
    },
    coin: {
      title: "Coin Flip",
      content: `<p>Choose heads or tails.</p>
        <button class="btn primary" data-action="coin-flip" data-choice="Heads">Heads</button>
        <button class="btn primary" data-action="coin-flip" data-choice="Tails">Tails</button>
        <p class="output" id="coinOutput" aria-live="polite"></p>`
    }
  };
  const game = games[name];
  if (!game) throw new Error(`Unknown game: ${name}`);

  gameTitle.textContent = game.title;
  gameArea.innerHTML = game.content;
  showPanel(gamePanel);
  if (name === "tic") resetTicTacToe();
  if (name === "memory") resetMemory();
  if (name === "guess") window.secretNumber = Math.floor(Math.random() * 100) + 1;
}

function resetTicTacToe() {
  const board = document.getElementById("ticBoard");
  if (!board) return;
  window.ticCells = Array(9).fill("");
  window.ticLocked = false;
  board.replaceChildren();
  window.ticCells.forEach((_, index) => {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.dataset.action = "tic-move";
    cell.dataset.index = String(index);
    cell.setAttribute("aria-label", `Square ${index + 1}`);
    board.append(cell);
  });
  document.getElementById("ticStatus").textContent = "Your turn (X).";
}

function ticWinner(cells) {
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  return lines.map((line) => line.every((index) => cells[index] === cells[line[0]]) && cells[line[0]] ? cells[line[0]] : "").find(Boolean) || "";
}

function playTicMove(index) {
  if (window.ticLocked || window.ticCells[index]) return;
  window.ticCells[index] = "X";
  document.querySelector(`#ticBoard [data-index="${index}"]`).textContent = "X";
  let winner = ticWinner(window.ticCells);
  const status = document.getElementById("ticStatus");
  if (winner || window.ticCells.every(Boolean)) {
    status.textContent = winner ? `${winner} wins!` : "It's a draw!";
    window.ticLocked = true;
    return;
  }
  window.ticLocked = true;
  status.textContent = "Computer's turn (O).";
  const available = window.ticCells.map((cell, cellIndex) => cell ? -1 : cellIndex).filter((cellIndex) => cellIndex >= 0);
  const move = available[Math.floor(Math.random() * available.length)];
  window.ticCells[move] = "O";
  document.querySelector(`#ticBoard [data-index="${move}"]`).textContent = "O";
  winner = ticWinner(window.ticCells);
  status.textContent = winner ? "Computer wins!" : window.ticCells.every(Boolean) ? "It's a draw!" : "Your turn (X).";
  window.ticLocked = Boolean(winner || window.ticCells.every(Boolean));
}

function resetMemory() {
  const board = document.getElementById("memoryBoard");
  if (!board) return;
  const cards = ["🎲", "🎲", "⭐", "⭐", "🍀", "🍀", "🚀", "🚀"];
  for (let index = cards.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [cards[index], cards[swap]] = [cards[swap], cards[index]];
  }
  window.memoryCards = cards;
  window.memoryOpen = [];
  window.memoryMatched = new Set();
  board.replaceChildren();
  cards.forEach((_, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.action = "memory-card";
    card.dataset.index = String(index);
    card.setAttribute("aria-label", `Card ${index + 1}`);
    card.textContent = "?";
    board.append(card);
  });
  document.getElementById("memoryStatus").textContent = "Matches: 0 / 4";
}

function drawSnake() {
  const canvas = document.getElementById("snakeCanvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw the Snake game.");
  context.fillStyle = "#10101c";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#35e0e8";
  window.snakeBody.forEach((part) => context.fillRect(part.x * 15 + 1, part.y * 15 + 1, 13, 13));
  context.fillStyle = "#9b5cff";
  context.fillRect(window.snakeFood.x * 15 + 1, window.snakeFood.y * 15 + 1, 13, 13);
}

function startSnake() {
  clearInterval(snakeInterval);
  window.snakeBody = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  window.snakeDirection = { x: 1, y: 0 };
  window.snakeFood = { x: 15, y: 10 };
  window.snakeScore = 0;
  document.getElementById("snakeScore").textContent = "Score: 0";
  drawSnake();
  snakeInterval = setInterval(() => {
    const head = {
      x: window.snakeBody[0].x + window.snakeDirection.x,
      y: window.snakeBody[0].y + window.snakeDirection.y
    };
    if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20 ||
        window.snakeBody.some((part) => part.x === head.x && part.y === head.y)) {
      clearInterval(snakeInterval);
      snakeInterval = undefined;
      document.getElementById("snakeScore").textContent += " · Game over";
      return;
    }
    window.snakeBody.unshift(head);
    if (head.x === window.snakeFood.x && head.y === window.snakeFood.y) {
      window.snakeScore++;
      document.getElementById("snakeScore").textContent = `Score: ${window.snakeScore}`;
      do {
        window.snakeFood = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) };
      } while (window.snakeBody.some((part) => part.x === window.snakeFood.x && part.y === window.snakeFood.y));
    } else {
      window.snakeBody.pop();
    }
    drawSnake();
  }, 140);
}

function setMathQuestion() {
  const left = Math.floor(Math.random() * 20) + 1;
  const right = Math.floor(Math.random() * 20) + 1;
  const subtract = Math.random() < 0.5;
  const first = subtract ? Math.max(left, right) : left;
  const second = subtract ? Math.min(left, right) : right;
  window.mathExpected = subtract ? first - second : first + second;
  document.getElementById("mathQuestion").textContent = `What is ${first} ${subtract ? "−" : "+"} ${second}?`;
  document.getElementById("mathAnswer").value = "";
  document.getElementById("mathAnswer").focus();
}

window.openApp = openApp;
window.closeApp = closeApp;
window.openGame = openGame;
window.closeGame = closeGame;

document.getElementById("appSearch")?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll(".app-card").forEach((card) => {
    card.hidden = !card.dataset.search.toLowerCase().includes(query);
  });
});

document.getElementById("gameSearch")?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  document.querySelectorAll(".game-card").forEach((card) => {
    card.hidden = !card.dataset.search.toLowerCase().includes(query);
  });
});

appArea?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const output = (id, value) => {
    document.getElementById(id).textContent = value;
  };
  switch (button.dataset.action) {
    case "calculate":
      calculate();
      break;
    case "stopwatch-start":
      if (!stopwatchInterval) {
        stopwatchStartedAt = Date.now() - stopwatchElapsed;
        stopwatchInterval = setInterval(() => {
          stopwatchElapsed = Date.now() - stopwatchStartedAt;
          output("stopwatchDisplay", formatTime(stopwatchElapsed));
        }, 100);
      }
      break;
    case "stopwatch-pause":
      clearInterval(stopwatchInterval);
      stopwatchInterval = undefined;
      break;
    case "stopwatch-reset":
      clearInterval(stopwatchInterval);
      stopwatchInterval = undefined;
      stopwatchElapsed = 0;
      output("stopwatchDisplay", "00:00.0");
      break;
    case "timer-start": {
      const duration = Number(document.getElementById("timerSeconds").value);
      if (!Number.isInteger(duration) || duration < 1) {
        output("timerDisplay", "Enter a whole number of seconds greater than zero.");
        return;
      }
      clearInterval(timerInterval);
      timerRemaining = duration;
      output("timerDisplay", `${timerRemaining} seconds remaining`);
      timerInterval = setInterval(() => {
        timerRemaining--;
        output("timerDisplay", timerRemaining ? `${timerRemaining} seconds remaining` : "Time's up!");
        if (timerRemaining <= 0) {
          clearInterval(timerInterval);
          timerInterval = undefined;
        }
      }, 1000);
      break;
    }
    case "timer-stop":
      clearInterval(timerInterval);
      timerInterval = undefined;
      break;
    case "save-notes":
      writeStorage("pixelport-notes", document.getElementById("notesText").value);
      break;
    case "generate-password":
      generatePassword();
      break;
    case "calculate-age": {
      const value = document.getElementById("birthDate").value;
      if (!value) {
        output("ageOutput", "Choose your date of birth.");
        return;
      }
      const birth = new Date(`${value}T00:00:00`);
      const today = new Date();
      if (birth > today) {
        output("ageOutput", "Date of birth cannot be in the future.");
        return;
      }
      let age = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() ||
          (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
      output("ageOutput", `You are ${age} years old.`);
      break;
    }
    case "calculate-percent": {
      const earned = Number(document.getElementById("marksEarned").value);
      const total = Number(document.getElementById("marksTotal").value);
      if (!Number.isFinite(earned) || !Number.isFinite(total) || earned < 0 || total <= 0 || earned > total) {
        output("percentOutput", "Enter valid marks; earned marks must be between zero and the total.");
        return;
      }
      output("percentOutput", `Percentage: ${(earned / total * 100).toFixed(2)}%`);
      break;
    }
    case "remove-todo": {
      const todos = readStorage("pixelport-todos", []);
      if (!Array.isArray(todos)) return;
      todos.splice(Number(button.dataset.index), 1);
      writeStorage("pixelport-todos", todos);
      renderTodos();
      break;
    }
    default:
      break;
  }
});

appArea?.addEventListener("submit", (event) => {
  const form = event.target;
  event.preventDefault();
  if (form.dataset.form === "todo") {
    const input = document.getElementById("todoInput");
    const todo = input.value.trim();
    if (!todo) return;
    const todos = readStorage("pixelport-todos", []);
    if (!Array.isArray(todos)) return;
    todos.push(todo);
    writeStorage("pixelport-todos", todos);
    renderTodos();
  }
});

appArea?.addEventListener("input", (event) => {
  if (event.target.id === "kmInput") {
    const value = event.target.value;
    document.getElementById("mileOutput").textContent = value === "" ? "Miles will appear here." : `${(Number(value) * 0.621371).toFixed(3)} miles`;
  }
  if (event.target.id === "wordText") {
    const text = event.target.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById("wordOutput").textContent = `${words} words · ${text.length} characters`;
  }
});

gameArea?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "tic-reset") resetTicTacToe();
  if (action === "tic-move") playTicMove(Number(button.dataset.index));
  if (action === "snake-start") startSnake();
  if (action === "rps") {
    const computer = ["rock", "paper", "scissors"][Math.floor(Math.random() * 3)];
    const player = button.dataset.choice;
    const result = player === computer ? "It's a tie!" :
      (player === "rock" && computer === "scissors") ||
      (player === "paper" && computer === "rock") ||
      (player === "scissors" && computer === "paper") ? "You win!" : "Computer wins!";
    document.getElementById("rpsOutput").textContent = `You chose ${player}; computer chose ${computer}. ${result}`;
  }
  if (action === "memory-reset") resetMemory();
  if (action === "memory-card") {
    const index = Number(button.dataset.index);
    if (window.memoryMatched.has(index) || window.memoryOpen.includes(index) || window.memoryOpen.length === 2) return;
    window.memoryOpen.push(index);
    button.textContent = window.memoryCards[index];
    if (window.memoryOpen.length === 2) {
      const [first, second] = window.memoryOpen;
      if (window.memoryCards[first] === window.memoryCards[second]) {
        window.memoryMatched.add(first);
        window.memoryMatched.add(second);
        window.memoryOpen = [];
        document.getElementById("memoryStatus").textContent = `Matches: ${window.memoryMatched.size / 2} / 4`;
      } else {
        memoryTimeout = setTimeout(() => {
          [first, second].forEach((cardIndex) => {
            const card = document.querySelector(`#memoryBoard [data-index="${cardIndex}"]`);
            if (card) card.textContent = "?";
          });
          window.memoryOpen = [];
        }, 700);
      }
    }
  }
  if (action === "click-start") {
    clearInterval(clickInterval);
    clickCount = 0;
    clickTimeLeft = 10;
    const target = gameArea.querySelector('[data-action="click-target"]');
    target.disabled = false;
    document.getElementById("clickOutput").textContent = "Clicks: 0 · Time: 10";
    clickInterval = setInterval(() => {
      clickTimeLeft--;
      document.getElementById("clickOutput").textContent = `Clicks: ${clickCount} · Time: ${clickTimeLeft}`;
      if (clickTimeLeft <= 0) {
        clearInterval(clickInterval);
        clickInterval = undefined;
        target.disabled = true;
        document.getElementById("clickOutput").textContent = `Time's up! You clicked ${clickCount} times.`;
      }
    }, 1000);
  }
  if (action === "click-target" && clickInterval) {
    clickCount++;
    document.getElementById("clickOutput").textContent = `Clicks: ${clickCount} · Time: ${clickTimeLeft}`;
  }
  if (action === "math-start") {
    clearInterval(mathInterval);
    mathScore = 0;
    mathTimeLeft = 30;
    const form = gameArea.querySelector('[data-form="math"]');
    form.hidden = false;
    document.getElementById("mathOutput").textContent = `Score: 0 · Time: ${mathTimeLeft}`;
    setMathQuestion();
    mathInterval = setInterval(() => {
      mathTimeLeft--;
      document.getElementById("mathOutput").textContent = `Score: ${mathScore} · Time: ${mathTimeLeft}`;
      if (mathTimeLeft <= 0) {
        clearInterval(mathInterval);
        mathInterval = undefined;
        form.hidden = true;
        document.getElementById("mathOutput").textContent = `Time's up! Final score: ${mathScore}.`;
      }
    }, 1000);
  }
  if (action === "coin-flip") {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    document.getElementById("coinOutput").textContent = `It landed on ${result}. ${result === button.dataset.choice ? "You guessed correctly!" : "Try again!"}`;
  }
});

gameArea?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (event.target.dataset.form === "guess") {
    const value = Number(document.getElementById("guessInput").value);
    const output = document.getElementById("guessOutput");
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      output.textContent = "Enter a whole number from 1 to 100.";
    } else if (value === window.secretNumber) {
      output.textContent = "Correct! You found the number. Open the game again to play again.";
    } else {
      output.textContent = value < window.secretNumber ? "Too low. Try again!" : "Too high. Try again!";
    }
  }
  if (event.target.dataset.form === "math" && mathInterval) {
    const answer = Number(document.getElementById("mathAnswer").value);
    if (answer === window.mathExpected) mathScore++;
    document.getElementById("mathOutput").textContent = `Score: ${mathScore} · Time: ${mathTimeLeft}`;
    setMathQuestion();
  }
});

document.addEventListener("keydown", (event) => {
  if (activeGame !== "snake" || gamePanel.hidden || !window.snakeDirection) return;
  const directions = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }
  };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  if (direction.x !== -window.snakeDirection.x || direction.y !== -window.snakeDirection.y) {
    window.snakeDirection = direction;
  }
});
