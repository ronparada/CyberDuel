import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer } from "node:http";
import { Server, type Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../shared/protocol.js";
import {
  calculatePoints,
  createRoomCode,
  REVEAL_DURATION_MS,
  ROUND_DURATION_MS,
  selectQuestions,
  toRoomView,
  TOTAL_ROUNDS,
  type Player,
  type Room,
} from "./game.js";

const app = express();
const httpServer = createServer(app);
interface SocketSessionData {
  roomCode?: string;
  playerToken?: string;
}

const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketSessionData>(httpServer);
const rooms = new Map<string, Room>();
const tokenRooms = new Map<string, string>();
const port = Number(process.env.PORT) || 3001;
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDirectory = path.resolve(serverDirectory, "../client");

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

if (existsSync(path.join(clientDirectory, "index.html"))) {
  app.use(express.static(clientDirectory));
  app.get("*", (_request, response) => response.sendFile(path.join(clientDirectory, "index.html")));
}

function normalizeName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 18);
}

function emitRoom(room: Room): void {
  for (const player of room.players) {
    if (player.socketId && player.connected) {
      io.to(player.socketId).emit("room_state", toRoomView(room, player.token));
    }
  }
}

function reportError(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketSessionData>,
  message: string,
): void {
  socket.emit("action_error", message);
}

function makePlayer(token: string, name: string, socketId: string): Player {
  return {
    token,
    name,
    connected: true,
    socketId,
    score: 0,
    answerIndex: null,
    answeredAt: null,
    pointsAwarded: 0,
  };
}

function attachPlayer(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketSessionData>,
  room: Room,
  player: Player,
): void {
  const previousSocketId = player.socketId;
  player.connected = true;
  player.socketId = socket.id;
  socket.data.roomCode = room.code;
  socket.data.playerToken = player.token;
  void socket.join(room.code);
  if (previousSocketId && previousSocketId !== socket.id) {
    io.sockets.sockets.get(previousSocketId)?.disconnect(true);
  }
  socket.emit("session_ready", { playerToken: player.token, roomCode: room.code });
  socket.emit("room_state", toRoomView(room, player.token));
  emitRoom(room);
}

function resetRoundPlayers(room: Room): void {
  for (const player of room.players) {
    player.answerIndex = null;
    player.answeredAt = null;
    player.pointsAwarded = 0;
  }
}

function startRound(room: Room): void {
  resetRoundPlayers(room);
  room.phase = "question";
  room.deadlineAt = Date.now() + ROUND_DURATION_MS;
  if (room.timer) clearTimeout(room.timer);
  room.timer = setTimeout(() => revealRound(room), ROUND_DURATION_MS);
  emitRoom(room);
}

function revealRound(room: Room): void {
  if (room.phase !== "question") return;
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
  const question = room.questions[room.roundIndex];
  for (const player of room.players) {
    player.pointsAwarded = calculatePoints(
      player.answerIndex,
      question.correctAnswerIndex,
      player.answeredAt,
      room.deadlineAt ?? Date.now(),
    );
    player.score += player.pointsAwarded;
  }
  room.phase = "reveal";
  room.deadlineAt = null;
  emitRoom(room);
  room.timer = setTimeout(() => {
    if (room.roundIndex + 1 >= TOTAL_ROUNDS) {
      room.phase = "results";
      room.timer = null;
      emitRoom(room);
      return;
    }
    room.roundIndex += 1;
    startRound(room);
  }, REVEAL_DURATION_MS);
}

function startGame(room: Room): void {
  if (room.timer) clearTimeout(room.timer);
  room.questions = selectQuestions();
  room.roundIndex = 0;
  room.players.forEach((player) => {
    player.score = 0;
    player.answerIndex = null;
    player.answeredAt = null;
    player.pointsAwarded = 0;
  });
  startRound(room);
}

function validPlayer(socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketSessionData>): {
  room: Room;
  player: Player;
} | null {
  const roomCode = socket.data.roomCode;
  const playerToken = socket.data.playerToken;
  if (!roomCode || !playerToken) return null;
  const room = rooms.get(roomCode);
  const player = room?.players.find((entry) => entry.token === playerToken);
  return room && player && player.socketId === socket.id ? { room, player } : null;
}

io.on("connection", (socket) => {
  socket.on("create_room", ({ name }) => {
    const cleanName = normalizeName(name);
    if (!cleanName) return reportError(socket, "Enter a name to create a room.");
    const token = randomBytes(24).toString("hex");
    const code = createRoomCode(rooms.keys());
    const room: Room = {
      code,
      players: [],
      phase: "lobby",
      questions: [],
      roundIndex: 0,
      deadlineAt: null,
      timer: null,
    };
    const player = makePlayer(token, cleanName, socket.id);
    room.players.push(player);
    rooms.set(code, room);
    tokenRooms.set(token, code);
    attachPlayer(socket, room, player);
  });

  socket.on("join_room", ({ roomCode, playerToken, name }) => {
    const cleanName = normalizeName(name);
    const code = typeof roomCode === "string" ? roomCode.trim().toUpperCase() : "";
    const room = rooms.get(code);
    if (!cleanName) return reportError(socket, "Enter a name to join the room.");
    if (!room) return reportError(socket, "That room was not found. Check the code and try again.");
    const existing = room.players.find((player) => player.token === playerToken);
    if (existing) {
      attachPlayer(socket, room, existing);
      return;
    }
    if (room.players.length >= 2) {
      return reportError(socket, "This room already has two players. Ask the host for another room code.");
    }
    if (room.phase !== "lobby") {
      return reportError(socket, "This game has already started. Ask the host to create a new room.");
    }
    const token = randomBytes(24).toString("hex");
    const player = makePlayer(token, cleanName, socket.id);
    room.players.push(player);
    tokenRooms.set(token, room.code);
    attachPlayer(socket, room, player);
  });

  socket.on("resume_session", ({ playerToken }) => {
    const roomCode = tokenRooms.get(playerToken);
    const room = roomCode ? rooms.get(roomCode) : undefined;
    const player = room?.players.find((entry) => entry.token === playerToken);
    if (!room || !player) return reportError(socket, "Your saved game session was not found. Join with a room code.");
    attachPlayer(socket, room, player);
  });

  socket.on("leave_room", () => {
    const session = validPlayer(socket);
    if (!session) return;
    session.player.connected = false;
    session.player.socketId = null;
    socket.data.roomCode = undefined;
    socket.data.playerToken = undefined;
    void socket.leave(session.room.code);
    emitRoom(session.room);
  });

  socket.on("start_game", () => {
    const session = validPlayer(socket);
    if (!session) return reportError(socket, "Reconnect to your room before starting.");
    const { room, player } = session;
    if (room.players[0]?.token !== player.token) return reportError(socket, "Only the host can start the game.");
    if (room.players.length !== 2 || room.players.some((entry) => !entry.connected)) {
      return reportError(socket, "Both players must be connected before the game can start.");
    }
    if (room.phase !== "lobby") {
      return reportError(socket, "A game is already in progress.");
    }
    startGame(room);
  });

  socket.on("submit_answer", ({ answerIndex }) => {
    const session = validPlayer(socket);
    if (!session) return reportError(socket, "Reconnect to your room before answering.");
    const { room, player } = session;
    const question = room.questions[room.roundIndex];
    if (room.phase !== "question") return reportError(socket, "This question is no longer accepting answers.");
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.choices.length) {
      return reportError(socket, "That answer is not valid.");
    }
    if (player.answerIndex !== null) return reportError(socket, "Your answer is locked for this question.");
    if (room.deadlineAt === null || Date.now() >= room.deadlineAt) {
      revealRound(room);
      return;
    }
    player.answerIndex = answerIndex;
    player.answeredAt = Date.now();
    emitRoom(room);
    if (room.players.every((entry) => entry.answerIndex !== null)) revealRound(room);
  });

  socket.on("rematch", () => {
    const session = validPlayer(socket);
    if (!session) return reportError(socket, "Reconnect to your room before starting a rematch.");
    const { room } = session;
    if (room.phase !== "results") return reportError(socket, "The current game must finish before a rematch.");
    if (room.players.length !== 2 || room.players.some((entry) => !entry.connected)) {
      return reportError(socket, "Both players must be connected to start a rematch.");
    }
    startGame(room);
  });

  socket.on("disconnect", () => {
    const session = validPlayer(socket);
    if (!session) return;
    session.player.connected = false;
    session.player.socketId = null;
    emitRoom(session.room);
  });
});

httpServer.listen(port, () => {
  console.log(`Cyber Duel server listening on port ${port}`);
});

export { rooms };
