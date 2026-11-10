import { describe, expect, it } from "vitest";

import { advanceGame, BOARD_SIZE, createGame, queueDirection } from "../src/game.ts";

describe("Snake rules", () => {
  it("starts with a three-segment snake and places food on an empty cell", () => {
    const game = createGame(() => 0);
    expect(game.snake).toHaveLength(3);
    expect(game.phase).toBe("ready");
    expect(game.food).not.toBeNull();
    expect(game.snake).not.toContainEqual(game.food);
  });

  it("prevents reversing and only buffers one turn at a time", () => {
    const game = { ...createGame(), phase: "playing" };
    expect(queueDirection(game, "left")).toBe(game);

    const turned = queueDirection(game, "up");
    expect(turned.nextDirection).toBe("up");
    expect(queueDirection(turned, "left")).toBe(turned);
  });

  it("grows, scores, and places the next fruit after eating", () => {
    const game = {
      ...createGame(),
      snake: [
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 2, y: 5 },
      ],
      food: { x: 5, y: 5 },
      phase: "playing",
    };

    const next = advanceGame(game, () => 0);
    expect(next.snake).toHaveLength(4);
    expect(next.snake[0]).toEqual({ x: 5, y: 5 });
    expect(next.score).toBe(10);
    expect(next.food).not.toBeNull();
    expect(next.snake).not.toContainEqual(next.food);
  });

  it("ends the run at a wall or on the snake's body", () => {
    const atWall = {
      ...createGame(),
      snake: [{ x: BOARD_SIZE - 1, y: 4 }],
      direction: "right",
      nextDirection: "right",
      phase: "playing",
    };
    expect(advanceGame(atWall).phase).toBe("over");

    const atBody = {
      ...createGame(),
      snake: [
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 1, y: 3 },
        { x: 1, y: 2 },
      ],
      direction: "down",
      nextDirection: "down",
      phase: "playing",
    };
    expect(advanceGame(atBody).phase).toBe("over");
  });

  it("allows the snake to move into the cell its tail just left", () => {
    const game = {
      ...createGame(),
      snake: [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 0, y: 1 },
      ],
      direction: "left",
      nextDirection: "left",
      food: { x: 8, y: 8 },
      phase: "playing",
    };

    const next = advanceGame(game);
    expect(next.phase).toBe("playing");
    expect(next.snake).toHaveLength(4);
    expect(next.snake[0]).toEqual({ x: 0, y: 1 });
  });

  it("does not advance while paused", () => {
    const game = { ...createGame(), phase: "paused" };
    expect(advanceGame(game)).toBe(game);
  });
});
