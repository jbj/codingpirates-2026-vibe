import "./style.css";
import { advanceGame, BOARD_SIZE, createGame, queueDirection } from "./game";
import type { Direction, GamePhase, GameState, Point } from "./game";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("The page is missing its #app main element.");
const appRoot = app;

appRoot.innerHTML = `
  <div class="game-shell">
    <header class="topbar">
      <a class="wordmark" href="./" aria-label="Field Notes Arcade home">
        <span class="wordmark-icon" aria-hidden="true">✳</span>
        <span>FIELD NOTES <span class="wordmark-light">ARCADE</span></span>
      </a>
      <span class="edition"><span class="edition-dot"></span> ISSUE NO. 01 <span class="edition-divider">/</span> THE CLASSICS</span>
    </header>

    <section class="hero" aria-labelledby="game-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="eyebrow-line"></span> A LITTLE ARCADE FAVORITE</p>
        <h1 id="game-title">Snake<span class="title-period">.</span></h1>
        <p class="game-intro">One more apple. One more turn. Don't get in your own way.</p>
      </div>
      <p class="hero-note"><span class="note-spark" aria-hidden="true">✳</span> MADE FOR<br />THE IN-BETWEEN</p>
    </section>

    <div class="game-layout">
      <section class="board-panel" aria-label="Snake game">
        <div class="board-heading">
          <span class="board-label"><span class="board-label-dot"></span> THE GARDEN</span>
          <span class="game-status" id="game-status" role="status" aria-live="polite"></span>
        </div>
        <div class="board-wrap">
          <canvas
            class="game-board"
            id="game-board"
            width="528"
            height="528"
            role="img"
            aria-label="Snake game board"
            tabindex="0"
          ></canvas>
          <div class="game-overlay" id="game-overlay">
            <span class="overlay-kicker" id="overlay-kicker">A CLASSIC, IN GOOD COMPANY</span>
            <h2 id="overlay-title">Ready when you are.</h2>
            <p id="overlay-copy">Eat the apples. Grow a little. Try not to meet yourself coming back.</p>
            <button class="button button-primary overlay-button" id="overlay-action" type="button">
              Start a run <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
        <div class="board-caption">
          <span><span class="caption-key">ARROWS</span> OR <span class="caption-key">WASD</span> TO MOVE</span>
          <span><span class="caption-key">SPACE</span> TO PAUSE</span>
        </div>
      </section>

      <aside class="game-sidebar" aria-label="Game details and controls">
        <section class="score-card" aria-label="Score">
          <div class="score-main">
            <span class="stat-label">YOUR SCORE</span>
            <strong class="score-value" id="score-value">000</strong>
            <span class="score-caption" id="score-caption">Every apple is worth 10.</span>
          </div>
          <div class="score-divider"></div>
          <div class="score-secondary">
            <div class="small-stat">
              <span class="stat-label">PERSONAL BEST</span>
              <strong id="best-value">000</strong>
            </div>
            <div class="small-stat">
              <span class="stat-label">PACE</span>
              <strong><span id="level-value">01</span><span class="pace-unit"> / 05</span></strong>
            </div>
          </div>
        </section>

        <section class="how-to">
          <div class="section-heading">
            <span class="section-index">01</span>
            <h2>How to play</h2>
          </div>
          <p>Guide your little green friend to the apple. Each bite makes you longer — and the garden a bit smaller.</p>
          <div class="control-guide">
            <span class="control-label">YOUR CONTROLS</span>
            <div class="key-row" aria-label="Use arrow keys or W A S D to move">
              <kbd>↑</kbd>
              <kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd>
              <span class="or-label">OR</span>
              <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
            </div>
          </div>
          <div class="swipe-note"><span class="swipe-icon" aria-hidden="true">↔</span> ON A PHONE? SWIPE THE BOARD OR USE THE PAD.</div>
          <div class="touch-pad" role="group" aria-label="Touch direction controls">
            <span class="touch-pad-label">DIRECTION PAD</span>
            <div class="pad-grid">
              <span></span>
              <button type="button" class="pad-button" data-direction="up" aria-label="Move up">↑</button>
              <span></span>
              <button type="button" class="pad-button" data-direction="left" aria-label="Move left">←</button>
              <button type="button" class="pad-button" data-direction="down" aria-label="Move down">↓</button>
              <button type="button" class="pad-button" data-direction="right" aria-label="Move right">→</button>
            </div>
          </div>
        </section>

        <div class="action-row">
          <button class="button button-primary" id="start-button" type="button">Start a run <span aria-hidden="true">↗</span></button>
          <button class="button button-quiet" id="pause-button" type="button" aria-pressed="false" disabled>Pause <span aria-hidden="true">Ⅱ</span></button>
        </div>
        <p class="save-note" id="save-note">YOUR BEST IS SAVED ON THIS DEVICE.</p>
      </aside>
    </div>

    <footer class="page-footer">
      <span>TAKE YOUR TIME. <span class="footer-star" aria-hidden="true">✳</span> THEN TAKE YOUR TURN.</span>
      <span>NO HIGH SCORES, JUST YOURS.</span>
    </footer>
  </div>
`;

function requiredElement<T extends Element>(selector: string): T {
  const element = appRoot.querySelector<T>(selector);
  if (!element) throw new Error(`The game is missing its ${selector} element.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>("#game-board");
const context = canvas.getContext("2d");
if (!context) throw new Error("The game board could not create a 2D canvas context.");

const status = requiredElement<HTMLElement>("#game-status");
const overlay = requiredElement<HTMLDivElement>("#game-overlay");
const overlayKicker = requiredElement<HTMLElement>("#overlay-kicker");
const overlayTitle = requiredElement<HTMLElement>("#overlay-title");
const overlayCopy = requiredElement<HTMLElement>("#overlay-copy");
const overlayAction = requiredElement<HTMLButtonElement>("#overlay-action");
const startButton = requiredElement<HTMLButtonElement>("#start-button");
const pauseButton = requiredElement<HTMLButtonElement>("#pause-button");
const scoreValue = requiredElement<HTMLElement>("#score-value");
const scoreCaption = requiredElement<HTMLElement>("#score-caption");
const bestValue = requiredElement<HTMLElement>("#best-value");
const levelValue = requiredElement<HTMLElement>("#level-value");
const saveNote = requiredElement<HTMLElement>("#save-note");
const directionButtons = appRoot.querySelectorAll<HTMLButtonElement>("[data-direction]");

let state = createGame();
let bestScore = 0;
let saveNotice = "";
let timer: number | undefined;
let pointerStart: Point | null = null;

try {
  const storedBest = Number(window.localStorage.getItem("field-notes-snake-best") ?? 0);
  if (Number.isFinite(storedBest) && storedBest >= 0) bestScore = storedBest;
} catch {
  saveNotice = "BEST SCORE STORAGE IS UNAVAILABLE IN THIS BROWSER.";
}

function fitCanvas(): void {
  const size = canvas.getBoundingClientRect().width || 528;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * pixelRatio);
  canvas.height = Math.round(size * pixelRatio);
  context!.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function drawBoard(game: GameState): void {
  const size = canvas.getBoundingClientRect().width || 528;
  const cellSize = size / BOARD_SIZE;
  const background = context!.createLinearGradient(0, 0, size, size);
  background.addColorStop(0, "#102720");
  background.addColorStop(1, "#0b1c19");
  context!.fillStyle = background;
  context!.fillRect(0, 0, size, size);

  context!.strokeStyle = "rgba(187, 225, 178, 0.075)";
  context!.lineWidth = 1;
  context!.beginPath();
  for (let line = 1; line < BOARD_SIZE; line += 1) {
    const position = line * cellSize;
    context!.moveTo(position, 0);
    context!.lineTo(position, size);
    context!.moveTo(0, position);
    context!.lineTo(size, position);
  }
  context!.stroke();

  if (game.food) {
    const centerX = (game.food.x + 0.5) * cellSize;
    const centerY = (game.food.y + 0.5) * cellSize;
    const glow = context!.createRadialGradient(centerX, centerY, 1, centerX, centerY, cellSize);
    glow.addColorStop(0, "rgba(255, 139, 107, 0.28)");
    glow.addColorStop(1, "rgba(255, 139, 107, 0)");
    context!.fillStyle = glow;
    context!.fillRect(centerX - cellSize, centerY - cellSize, cellSize * 2, cellSize * 2);
    context!.fillStyle = "#ff896e";
    context!.beginPath();
    context!.arc(centerX, centerY + cellSize * 0.04, cellSize * 0.27, 0, Math.PI * 2);
    context!.fill();
    context!.fillStyle = "#f5b963";
    context!.beginPath();
    context!.ellipse(
      centerX + cellSize * 0.13,
      centerY - cellSize * 0.27,
      cellSize * 0.12,
      cellSize * 0.07,
      -0.5,
      0,
      Math.PI * 2,
    );
    context!.fill();
  }

  game.snake.forEach((segment, index) => {
    const inset = index === 0 ? 2 : 3;
    const x = segment.x * cellSize + inset;
    const y = segment.y * cellSize + inset;
    const width = cellSize - inset * 2;
    context!.fillStyle = index === 0 ? "#cbf26b" : `hsl(91 58% ${48 - Math.min(index, 10) * 1.5}%)`;
    context!.beginPath();
    context!.roundRect(x, y, width, width, index === 0 ? cellSize * 0.34 : cellSize * 0.28);
    context!.fill();
    if (index === 0) {
      const forward: Point = {
        up: { x: 0, y: -1 },
        right: { x: 1, y: 0 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
      }[game.direction];
      const sideways = { x: -forward.y, y: forward.x };
      const eyeForward = cellSize * 0.13;
      const eyeSide = cellSize * 0.16;
      context!.fillStyle = "#183327";
      for (const side of [-1, 1]) {
        const eyeX = x + width / 2 + forward.x * eyeForward + sideways.x * eyeSide * side;
        const eyeY = y + width / 2 + forward.y * eyeForward + sideways.y * eyeSide * side;
        context!.beginPath();
        context!.arc(eyeX, eyeY, cellSize * 0.055, 0, Math.PI * 2);
        context!.fill();
      }
    }
  });
}

function phaseMessage(phase: GamePhase): string {
  if (phase === "ready") return "A fresh little adventure.";
  if (phase === "playing") return "Your move. Find the apple.";
  if (phase === "paused") return "Taking a breather.";
  if (phase === "won") return "You grew the whole garden. Lovely.";
  return "A close encounter. Give it another go.";
}

function render(): void {
  drawBoard(state);
  const level = Math.min(5, Math.floor(state.score / 50) + 1);
  const score = String(state.score).padStart(3, "0");
  status.textContent = `${phaseMessage(state.phase)}${saveNotice ? ` ${saveNotice}` : ""}`;
  canvas.setAttribute(
    "aria-label",
    `Snake game board. Score ${state.score}. ${phaseMessage(state.phase)}`,
  );
  scoreValue.textContent = score;
  bestValue.textContent = String(bestScore).padStart(3, "0");
  levelValue.textContent = String(level).padStart(2, "0");
  scoreCaption.textContent =
    state.phase === "playing" ? "Keep your eyes on the next turn." : "Every apple is worth 10.";
  saveNote.textContent = saveNotice || "YOUR BEST IS SAVED ON THIS DEVICE.";
  overlay.hidden = state.phase === "playing";
  pauseButton.disabled = state.phase !== "playing" && state.phase !== "paused";
  pauseButton.setAttribute("aria-pressed", String(state.phase === "paused"));
  pauseButton.innerHTML =
    state.phase === "paused"
      ? 'Resume <span aria-hidden="true">↗</span>'
      : 'Pause <span aria-hidden="true">Ⅱ</span>';
  startButton.innerHTML =
    state.phase === "ready"
      ? 'Start a run <span aria-hidden="true">↗</span>'
      : state.phase === "playing"
        ? 'New run <span aria-hidden="true">↗</span>'
        : state.phase === "paused"
          ? 'Resume run <span aria-hidden="true">↗</span>'
          : 'Play again <span aria-hidden="true">↗</span>';

  const overlayContent: Record<
    Exclude<GamePhase, "playing">,
    { kicker: string; title: string; copy: string; action: string }
  > = {
    ready: {
      kicker: "A CLASSIC, IN GOOD COMPANY",
      title: "Ready when you are.",
      copy: "Eat the apples. Grow a little. Try not to meet yourself coming back.",
      action: "Start a run",
    },
    paused: {
      kicker: "THE GARDEN CAN WAIT",
      title: "Take your time.",
      copy: "Your little green friend isn't going anywhere.",
      action: "Back to it",
    },
    over: {
      kicker: "THAT WAS A GOOD RUN",
      title: "One more turn?",
      copy: `You gathered ${state.score} points. The garden is ready when you are.`,
      action: "Play again",
    },
    won: {
      kicker: "A GARDEN WELL GROWN",
      title: "Lovely work.",
      copy: "You filled every last corner. Fancy another little adventure?",
      action: "Play again",
    },
  };
  if (state.phase !== "playing") {
    const content = overlayContent[state.phase];
    overlayKicker.textContent = content.kicker;
    overlayTitle.textContent = content.title;
    overlayCopy.textContent = content.copy;
    overlayAction.innerHTML = `${content.action} <span aria-hidden="true">↗</span>`;
  }
}

function clearTimer(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  timer = undefined;
}

function tickDelay(): number {
  const level = Math.floor(state.score / 50);
  return Math.max(82, 166 - level * 17);
}

function scheduleTick(): void {
  clearTimer();
  if (state.phase !== "playing") return;
  timer = window.setTimeout(() => {
    timer = undefined;
    state = advanceGame(state);
    if (state.score > bestScore) {
      bestScore = state.score;
      try {
        window.localStorage.setItem("field-notes-snake-best", String(bestScore));
      } catch {
        saveNotice = "BEST SCORE COULD NOT BE SAVED IN THIS BROWSER.";
      }
    }
    render();
    scheduleTick();
  }, tickDelay());
}

function startOrResume(): void {
  clearTimer();
  if (state.phase === "ready" || state.phase === "over" || state.phase === "won") {
    state = { ...createGame(), phase: "playing" };
  } else if (state.phase === "paused") {
    state = { ...state, phase: "playing" };
  }
  render();
  scheduleTick();
}

function pauseGame(): void {
  if (state.phase !== "playing") return;
  clearTimer();
  state = { ...state, phase: "paused" };
  render();
}

function submitDirection(direction: Direction): void {
  if (state.phase === "ready") state = { ...state, phase: "playing" };
  if (state.phase !== "playing") return;
  state = queueDirection(state, direction);
  render();
  scheduleTick();
  canvas.focus({ preventScroll: true });
}

overlayAction.addEventListener("click", startOrResume);
startButton.addEventListener("click", () => {
  if (state.phase === "playing") {
    state = { ...createGame(), phase: "playing" };
    render();
    scheduleTick();
  } else {
    startOrResume();
  }
});
pauseButton.addEventListener("click", () => {
  if (state.phase === "paused") startOrResume();
  else pauseGame();
});
directionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const direction = button.dataset.direction;
    if (
      direction === "up" ||
      direction === "right" ||
      direction === "down" ||
      direction === "left"
    ) {
      submitDirection(direction);
    }
  });
});

const directionByKey: Record<string, Direction> = {
  arrowup: "up",
  w: "up",
  arrowright: "right",
  d: "right",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
};

window.addEventListener("keydown", (event) => {
  const direction = directionByKey[event.key.toLowerCase()];
  if (direction) {
    event.preventDefault();
    submitDirection(direction);
    return;
  }
  if (event.code === "Space" && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault();
    if (state.phase === "playing") pauseGame();
    else startOrResume();
  } else if (event.key === "Escape") {
    pauseGame();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 18) return;
  const direction =
    Math.abs(deltaX) > Math.abs(deltaY)
      ? deltaX > 0
        ? "right"
        : "left"
      : deltaY > 0
        ? "down"
        : "up";
  submitDirection(direction);
});
canvas.addEventListener("pointercancel", () => {
  pointerStart = null;
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseGame();
});
window.addEventListener("resize", () => {
  fitCanvas();
  render();
});

fitCanvas();
render();
