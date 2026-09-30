import { randomInt } from "node:crypto";
import type { RevealedAnswer, RoomView } from "../shared/protocol.js";
import { QUESTIONS, type Question } from "./questions.js";

export const TOTAL_ROUNDS = 5;
export const ROUND_DURATION_MS = 20_000;
export const REVEAL_DURATION_MS = 4_000;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface Player {
  token: string;
  name: string;
  connected: boolean;
  socketId: string | null;
  score: number;
  answerIndex: number | null;
  answeredAt: number | null;
  pointsAwarded: number;
}

export interface Room {
  code: string;
  players: Player[];
  phase: "lobby" | "question" | "reveal" | "results";
  questions: Question[];
  roundIndex: number;
  deadlineAt: number | null;
  timer: ReturnType<typeof setTimeout> | null;
}

export function createRoomCode(existingCodes: Iterable<string>): string {
  const existing = new Set(existingCodes);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    let code = "";
    for (let digit = 0; digit < 4; digit += 1) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    if (!existing.has(code)) return code;
  }
  throw new Error("Unable to allocate a unique room code");
}

export function selectQuestions(source: Question[] = QUESTIONS, count = TOTAL_ROUNDS): Question[] {
  if (count > source.length) throw new Error("Not enough questions available");
  const pool = [...source];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, count);
}

export function calculatePoints(
  answerIndex: number | null,
  correctAnswerIndex: number,
  answeredAt: number | null,
  deadlineAt: number,
  durationMs = ROUND_DURATION_MS,
): number {
  if (answerIndex !== correctAnswerIndex || answeredAt === null) return 0;
  const remaining = Math.max(0, deadlineAt - answeredAt);
  return 100 + Math.floor((50 * remaining) / durationMs);
}

export function toRoomView(room: Room, playerToken: string): RoomView {
  const currentQuestion = room.questions[room.roundIndex];
  const ownPlayer = room.players.find((player) => player.token === playerToken);
  let revealedAnswers: RevealedAnswer[] | null = null;
  if (room.phase === "reveal" || room.phase === "results") {
    revealedAnswers = room.players.map((player) => ({
      name: player.name,
      answerIndex: player.answerIndex,
      pointsAwarded: player.pointsAwarded,
    }));
  }
  const revealIsVisible = room.phase === "reveal" || room.phase === "results";
  return {
    roomCode: room.code,
    phase: room.phase,
    isHost: room.players[0]?.token === playerToken,
    players: room.players.map((player) => ({
      name: player.name,
      connected: player.connected,
      score: player.score,
      answered: player.answerIndex !== null,
    })),
    roundNumber: room.phase === "lobby" ? 0 : Math.min(room.roundIndex + 1, TOTAL_ROUNDS),
    totalRounds: TOTAL_ROUNDS,
    question: currentQuestion
      ? { prompt: currentQuestion.prompt, choices: [...currentQuestion.choices] }
      : null,
    deadlineAt: room.phase === "question" ? room.deadlineAt : null,
    ownAnswerIndex: ownPlayer?.answerIndex ?? null,
    correctAnswerIndex: revealIsVisible ? currentQuestion?.correctAnswerIndex ?? null : null,
    explanation: revealIsVisible ? currentQuestion?.explanation ?? null : null,
    revealedAnswers,
  };
}
