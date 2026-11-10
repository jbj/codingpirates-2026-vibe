export const BOARD_SIZE = 22;
export const POINTS_PER_FRUIT = 10;

export interface Point {
  x: number;
  y: number;
}

export type Direction = "up" | "right" | "down" | "left";
export type GamePhase = "ready" | "playing" | "paused" | "over" | "won";

export interface GameState {
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point | null;
  score: number;
  phase: GamePhase;
}

const vectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

function samePoint(first: Point, second: Point): boolean {
  return first.x === second.x && first.y === second.y;
}

function placeFood(snake: Point[], random: () => number): Point | null {
  const freeCells: Point[] = [];
  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const cell = { x, y };
      if (!snake.some((segment) => samePoint(segment, cell))) freeCells.push(cell);
    }
  }
  if (freeCells.length === 0) return null;
  const index = Math.min(freeCells.length - 1, Math.floor(random() * freeCells.length));
  return freeCells[index] ?? null;
}

export function createGame(random: () => number = Math.random): GameState {
  const middle = Math.floor(BOARD_SIZE / 2);
  const snake = [
    { x: middle - 6, y: middle + 4 },
    { x: middle - 7, y: middle + 4 },
    { x: middle - 8, y: middle + 4 },
  ];
  return {
    snake,
    direction: "right",
    nextDirection: "right",
    food: placeFood(snake, random),
    score: 0,
    phase: "ready",
  };
}

export function queueDirection(state: GameState, direction: Direction): GameState {
  if (state.nextDirection !== state.direction) return state;
  const current = vectors[state.direction];
  const next = vectors[direction];
  if (current.x + next.x === 0 && current.y + next.y === 0) return state;
  return { ...state, nextDirection: direction };
}

export function advanceGame(state: GameState, random: () => number = Math.random): GameState {
  if (state.phase !== "playing") return state;

  const direction = state.nextDirection;
  const vector = vectors[direction];
  const head = {
    x: state.snake[0]!.x + vector.x,
    y: state.snake[0]!.y + vector.y,
  };
  const grows = state.food !== null && samePoint(head, state.food);
  const body = grows ? state.snake : state.snake.slice(0, -1);
  const hitsWall = head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE;
  if (hitsWall || body.some((segment) => samePoint(segment, head))) {
    return { ...state, direction, nextDirection: direction, phase: "over" };
  }

  const snake = [head, ...state.snake];
  if (!grows) snake.pop();
  const food = grows ? placeFood(snake, random) : state.food;
  return {
    ...state,
    snake,
    direction,
    nextDirection: direction,
    food,
    score: state.score + (grows ? POINTS_PER_FRUIT : 0),
    phase: grows && food === null ? "won" : state.phase,
  };
}
