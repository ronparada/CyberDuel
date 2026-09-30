export type GamePhase = "lobby" | "question" | "reveal" | "results";

export interface PlayerView {
  name: string;
  connected: boolean;
  score: number;
  answered: boolean;
}

export interface QuestionView {
  prompt: string;
  choices: string[];
}

export interface RevealedAnswer {
  name: string;
  answerIndex: number | null;
  pointsAwarded: number;
}

export interface RoomView {
  roomCode: string;
  phase: GamePhase;
  isHost: boolean;
  players: PlayerView[];
  roundNumber: number;
  totalRounds: number;
  question: QuestionView | null;
  deadlineAt: number | null;
  ownAnswerIndex: number | null;
  correctAnswerIndex: number | null;
  explanation: string | null;
  revealedAnswers: RevealedAnswer[] | null;
}

export interface ClientToServerEvents {
  create_room: (payload: { name: string }) => void;
  join_room: (payload: { roomCode: string; playerToken: string; name: string }) => void;
  resume_session: (payload: { playerToken: string }) => void;
  leave_room: () => void;
  start_game: () => void;
  submit_answer: (payload: { answerIndex: number }) => void;
  rematch: () => void;
}

export interface ServerToClientEvents {
  room_state: (state: RoomView) => void;
  session_ready: (payload: { playerToken: string; roomCode: string }) => void;
  action_error: (message: string) => void;
}
