import { useCallback, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  RoomView,
  ServerToClientEvents,
} from "../../shared/protocol";

const TOKEN_KEY = "cyber-duel-player-token";
const NAME_KEY = "cyber-duel-player-name";

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function getStoredToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

function rulesMarkup() {
  return (
    <ul>
      <li>Five random cybersecurity questions per game.</li>
      <li>Each question has a 20-second timer. Your first answer is locked.</li>
      <li>Correct answers earn 100 points, plus up to 50 for speed.</li>
      <li>No answer or an incorrect answer earns zero points.</li>
      <li>Answers and a short explanation appear after both players answer or time runs out.</li>
      <li>Both players need to be connected to start or play a rematch.</li>
    </ul>
  );
}

function App() {
  const [socket, setSocket] = useState<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomView | null>(null);
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? "");
  const [roomCodeInput, setRoomCodeInput] = useState(() => new URLSearchParams(location.search).get("room") ?? "");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const connection = io();
    setSocket(connection);
    connection.on("connect", () => {
      setConnected(true);
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) connection.emit("resume_session", { playerToken: token });
    });
    connection.on("disconnect", () => setConnected(false));
    connection.on("room_state", (state) => {
      setRoom(state);
      setError("");
    });
    connection.on("session_ready", ({ playerToken, roomCode }) => {
      localStorage.setItem(TOKEN_KEY, playerToken);
      const url = new URL(window.location.href);
      url.searchParams.set("room", roomCode);
      window.history.replaceState({}, "", url);
    });
    connection.on("action_error", (message) => setError(message));
    return () => connection.disconnect();
  }, []);

  useEffect(() => {
    if (!room || room.phase !== "question" || room.deadlineAt === null) return;
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [room?.phase, room?.deadlineAt]);

  useEffect(() => {
    localStorage.setItem(NAME_KEY, name);
  }, [name]);

  const timeLeft = room?.deadlineAt
    ? Math.max(0, (room.deadlineAt - now) / 1000)
    : 0;
  const timePercent = Math.min(100, (timeLeft / 20) * 100);
  const isHost = room?.isHost ?? false;
  const joiningRoom = Boolean(roomCodeInput.trim() || new URLSearchParams(location.search).get("room"));
  const inviteUrl = (() => {
    if (!room) return "";
    const url = new URL(window.location.href);
    url.search = new URLSearchParams({ room: room.roomCode }).toString();
    return url.toString();
  })();

  const begin = useCallback(() => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter your name first.");
      return;
    }
    if (!socket?.connected) {
      setError("Connecting to the game server. Try again in a moment.");
      return;
    }
    setError("");
    localStorage.setItem(NAME_KEY, cleanName);
    const inviteRoom = roomCodeInput.trim() || new URLSearchParams(location.search).get("room") || "";
    if (inviteRoom) {
      socket.emit("join_room", { roomCode: inviteRoom, playerToken: getStoredToken(), name: cleanName });
    } else {
      socket.emit("create_room", { name: cleanName });
    }
  }, [name, roomCodeInput, socket]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the invite link. Copy it from the address bar instead.");
    }
  }

  function returnToStart() {
    socket?.emit("leave_room");
    localStorage.removeItem(TOKEN_KEY);
    setRoom(null);
    setRoomCodeInput("");
    setError("");
    const url = new URL(window.location.href);
    url.searchParams.delete("room");
    window.history.replaceState({}, "", url);
  }

  function startGame() {
    socket?.emit("start_game");
  }

  function submitAnswer(answerIndex: number) {
    socket?.emit("submit_answer", { answerIndex });
  }

  function requestRematch() {
    socket?.emit("rematch");
  }

  const sortedPlayers = room ? [...room.players].sort((a, b) => b.score - a.score) : [];

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); returnToStart(); }}>
          <span className="brand-mark">CD</span>
          <span>CYBER DUEL</span>
        </a>
        <div className="topbar-right">
          {room && <span className="room-chip">ROOM {room.roomCode}</span>}
          <button className="text-button" onClick={() => setShowRules((visible) => !visible)} aria-expanded={showRules}>
            {showRules ? "Hide rules" : "Rules"}
          </button>
          <span className={`connection ${connected ? "online" : ""}`}>
            <i /> {connected ? "ONLINE" : "CONNECTING"}
          </span>
        </div>
      </header>

      {showRules && <aside className="rules-panel"><strong>HOW TO PLAY</strong>{rulesMarkup()}</aside>}
      {error && <div className="toast-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Dismiss">×</button></div>}

      {!room ? (
        <section className="landing">
          <div className="hero-copy">
            <span className="eyebrow"><i /> TWO PLAYERS. FIVE ROUNDS. ZERO PHISHING.</span>
            <h1>Think fast.<br /><span>Stay safe.</span></h1>
            <p className="lede">A head-to-head cybersecurity showdown. Spot the scams, outsmart the threats, and prove you know your way around the digital world.</p>
            <div className="feature-row"><span>⌁ QUICK MATCH</span><span>◈ REAL-WORLD TIPS</span><span>⏱ 2 MINUTES</span></div>
          </div>
          <section className="join-card">
            <div className="card-kicker">PLAYER SETUP <span>01 / 02</span></div>
            <label htmlFor="player-name">YOUR CALLSIGN</label>
            <input id="player-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={18} placeholder="e.g. ByteBandit" autoComplete="nickname" />
            <label htmlFor="room-code">{new URLSearchParams(location.search).get("room") ? "ROOM CODE" : "ROOM CODE (OPTIONAL)"}</label>
            <input id="room-code" value={roomCodeInput} onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())} maxLength={4} placeholder="JOIN WITH A CODE" />
            <button className="primary-button" onClick={begin} disabled={!connected}>
              {joiningRoom ? "JOIN THE DUEL" : "CREATE A DUEL"} <span>↗</span>
            </button>
            <p className="card-footnote">No accounts. No tracking. Just you and your rival.</p>
          </section>
          <div className="landing-rules"><span className="rule-icon">i</span><div><strong>FAIR PLAY, FAST ROUNDS</strong><p>Both players get the same five questions. Correct answers score points; quicker correct answers earn a small bonus.</p></div><button onClick={() => setShowRules(true)}>FULL RULES ↗</button></div>
        </section>
      ) : (
        <section className="game-layout">
          <div className="game-main">
            {room.phase === "lobby" && (
              <section className="game-card lobby-card">
                <div className="card-kicker">MATCH LOBBY <span>01 / 02</span></div>
                <p className="section-label">ROOM CODE</p>
                <div className="big-room-code">{room.roomCode}</div>
                <button className="secondary-button" onClick={() => void copyInvite()}>{copied ? "LINK COPIED ✓" : "COPY INVITE LINK ↗"}</button>
                <div className="player-list">
                  {room.players.map((player, index) => (
                    <div className="player-row" key={`${player.name}-${index}`}>
                      <span className={`player-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span>
                      <span className="player-row-name">{player.name}<small>{index === 0 ? "HOST" : "CHALLENGER"}</small></span>
                      <span className="player-status"><i className={player.connected ? "is-online" : ""} />{player.connected ? "READY" : "OFFLINE"}</span>
                    </div>
                  ))}
                  {room.players.length < 2 && <div className="waiting-slot"><span>···</span> Waiting for challenger to join</div>}
                </div>
                {isHost ? (
                  <button className="primary-button" disabled={room.players.length !== 2 || room.players.some((player) => !player.connected)} onClick={startGame}>
                    {room.players.length !== 2 ? "WAITING FOR CHALLENGER" : "START THE DUEL"} <span>↗</span>
                  </button>
                ) : (
                  <p className="waiting-note">The host will start the duel when ready.</p>
                )}
              </section>
            )}

            {room.phase === "question" && room.question && (
              <section className="game-card question-card">
                <div className="question-meta"><span>ROUND {String(room.roundNumber).padStart(2, "0")} <b>/ {String(room.totalRounds).padStart(2, "0")}</b></span><span className={`timer ${timeLeft < 6 ? "urgent" : ""}`}>◷ {Math.ceil(timeLeft)}s</span></div>
                <div className="timer-track"><span style={{ width: `${timePercent}%` }} /></div>
                <p className="section-label">QUICK CHECK</p>
                <h2>{room.question.prompt}</h2>
                <div className="answer-grid">
                  {room.question.choices.map((choice, index) => (
                    <button
                      className={`answer-button ${room.ownAnswerIndex === index ? "selected" : ""}`}
                      key={choice}
                      onClick={() => submitAnswer(index)}
                      disabled={room.ownAnswerIndex !== null}
                    >
                      <span className="answer-letter">{String.fromCharCode(65 + index)}</span><span>{choice}</span>
                    </button>
                  ))}
                </div>
                <p className={`answer-lock ${room.ownAnswerIndex !== null ? "locked" : ""}`}>
                  {room.ownAnswerIndex !== null ? "✓ ANSWER LOCKED — waiting for your rival" : "Choose carefully. Your first answer is final."}
                </p>
              </section>
            )}

            {room.phase === "reveal" && room.question && (
              <section className="game-card reveal-card">
                <div className="card-kicker">ROUND {String(room.roundNumber).padStart(2, "0")} RECAP <span>ANSWER REVEALED</span></div>
                <p className="section-label">{room.question.prompt}</p>
                <div className="revealed-choice"><span>✓</span>{room.question.choices[room.correctAnswerIndex ?? 0]}</div>
                <p className="explanation">{room.explanation}</p>
                <div className="round-points">
                  {room.players.map((player, index) => {
                    const answer = room.revealedAnswers?.[index];
                    return <div className="round-point" key={player.name}><span>{player.name}</span><strong>+{answer?.pointsAwarded ?? 0}</strong></div>;
                  })}
                </div>
                <div className="next-round">NEXT ROUND IN A MOMENT <span>⌁</span></div>
              </section>
            )}

            {room.phase === "results" && (
              <section className="game-card results-card">
                <div className="card-kicker">DUEL COMPLETE <span>05 / 05</span></div>
                <div className="trophy">✦</div>
                <h2>{sortedPlayers.length > 1 && sortedPlayers[0].score === sortedPlayers[1].score ? "A PERFECT TIE" : `${sortedPlayers[0]?.name ?? "PLAYER"} WINS`}</h2>
                <p className="results-subtitle">Sharp instincts. Safer clicks. Nice work.</p>
                <div className="final-scores">
                  {sortedPlayers.map((player, index) => (
                    <div className={`final-score ${index === 0 ? "leader" : ""}`} key={player.name}>
                      <span className={`player-avatar avatar-${room.players.findIndex((entry) => entry.name === player.name)}`}>{player.name.slice(0, 1).toUpperCase()}</span>
                      <span>{player.name}<small>{index === 0 ? "TOP DEFENDER" : "PLAYER"}</small></span>
                      <strong>{player.score}<small>PTS</small></strong>
                    </div>
                  ))}
                </div>
                <button className="primary-button" onClick={requestRematch}>RUN IT BACK — NEW QUESTIONS <span>↗</span></button>
              </section>
            )}
          </div>

          <aside className="game-sidebar">
            <section className="score-card">
              <div className="sidebar-heading">LIVE SCORE <span>● LIVE</span></div>
              {room.players.map((player, index) => (
                <div className="score-row" key={player.name}>
                  <span className={`player-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span>
                  <span className="score-name">{player.name}<small>{player.connected ? "IN THE DUEL" : "RECONNECTING"}</small></span>
                  <strong>{player.score}</strong>
                </div>
              ))}
              {room.players.length < 2 && <p className="sidebar-waiting">Waiting for player two to join...</p>}
            </section>
            <section className="rules-mini"><div className="sidebar-heading">QUICK RULES <button onClick={() => setShowRules((visible) => !visible)}>VIEW ALL ↗</button></div>{rulesMarkup()}</section>
            <div className="sidebar-tip"><span>⛨</span><p><strong>DEFENDER TIP</strong><br />Real organizations will never ask you to share a one-time login code over the phone.</p></div>
            {room.phase !== "lobby" && <div className="progress-card"><span>DUEL PROGRESS</span><div className="progress-dots">{Array.from({ length: room.totalRounds }, (_, index) => <i className={index < room.roundNumber ? "complete" : ""} key={index} />)}</div><small>ROUND {String(room.roundNumber).padStart(2, "0")} OF {String(room.totalRounds).padStart(2, "0")}</small></div>}
            <button className="leave-link" onClick={returnToStart}>← BACK TO HOME</button>
          </aside>
        </section>
      )}

      <footer className="footer"><span>CYBER DUEL <b>•</b> THINK BEFORE YOU CLICK</span><span>BUILT FOR BETTER DIGITAL INSTINCTS</span></footer>
    </main>
  );
}

export default App;
