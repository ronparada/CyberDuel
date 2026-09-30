import { describe, expect, it } from "vitest";
import { calculatePoints, createRoomCode, selectQuestions, toRoomView, type Room } from "./game.js";
import { QUESTIONS } from "./questions.js";

describe("game rules", () => {
  it("selects five distinct questions from the full question set", () => {
    const selected = selectQuestions();
    expect(selected).toHaveLength(5);
    expect(new Set(selected).size).toBe(5);
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(15);
  });

  it("creates a short code that is not already in use", () => {
    const first = createRoomCode([]);
    const second = createRoomCode([first]);
    expect(first).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    expect(second).not.toBe(first);
  });

  it("awards a base score plus a bounded speed bonus only for a correct answer", () => {
    expect(calculatePoints(1, 1, 0, 20_000)).toBe(150);
    expect(calculatePoints(1, 1, 10_000, 20_000)).toBe(125);
    expect(calculatePoints(1, 1, 20_000, 20_000)).toBe(100);
    expect(calculatePoints(0, 1, 1_000, 20_000)).toBe(0);
    expect(calculatePoints(null, 1, null, 20_000)).toBe(0);
  });

  it("withholds the correct answer until the reveal phase", () => {
    const room: Room = {
      code: "ABCD",
      players: [{
        token: "player-token",
        name: "Player",
        connected: true,
        socketId: "socket-id",
        score: 0,
        answerIndex: null,
        answeredAt: null,
        pointsAwarded: 0,
      }],
      phase: "question",
      questions: [QUESTIONS[0]],
      roundIndex: 0,
      deadlineAt: 20_000,
      timer: null,
    };
    expect(toRoomView(room, "player-token").correctAnswerIndex).toBeNull();
    room.phase = "reveal";
    expect(toRoomView(room, "player-token").correctAnswerIndex).toBe(1);
  });
});
