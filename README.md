# Cyber Duel

A small, real-time cybersecurity quiz for two players. The server owns room membership, question selection, timers, answer locking, scoring, reveals, and rematches. Rooms and player sessions are held in memory; no account or database is used.

## Run locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in two browser windows on the same computer. Create a duel in one, then open the copied invite URL (or enter the room code) in the other. To run checks and a production build:

```bash
npm test
npm run build
npm start
```

`npm start` serves the built app and Socket.IO on `http://localhost:3001`. Set `PORT` to use another port. For a two-device test on the same Wi-Fi network, run these in separate terminals:

```bash
npm run dev:server
npm run dev:client -- --host 0.0.0.0
```

Open `http://<computer-LAN-IP>:5173` on both devices (allow the Vite server through the computer's firewall if prompted). Vite forwards Socket.IO traffic to the local server on port 3001.

## Deploy to Render

Create a **Web Service** for this repository and configure:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Environment variable | `NODE_ENV=production` (optional) |

Render supplies `PORT`; the service listens on that port and serves the Vite build and WebSocket endpoint from the same origin. Deploy the service as a single instance. No database, static-site service, or additional environment variables are required. After deploy, open the Render URL on two devices and use the invite link or four-character room code.

## Rules and limitations

- Each match uses five randomly selected questions from a built-in set of 20 general-audience cybersecurity questions.
- Players have 20 seconds per question. The first submitted answer locks; correct answers earn 100 points and up to 50 extra points for speed. Incorrect or unanswered questions earn no points.
- The correct answer and explanation are sent only when the server enters the reveal phase, after both answers arrive or time expires. Each reveal lasts four seconds.
- Either connected player can start a rematch after results. It selects five new questions and resets the scores without leaving the room.
- A browser stores a lightweight player token in local storage to reclaim the same seat after a reconnect. Treat the browser profile as your session; clearing local storage loses that automatic resume token.
- Rooms, timers, and tokens are in process memory. A server restart loses all active rooms, and the service is designed for one Render instance (not horizontal scaling). There are no accounts, persistent history, moderation tools, or room expiry.
- Reconnection restores the current server state and the clock keeps running while a player is disconnected. A disconnected seat cannot be taken by a third player.
- There is no host migration. If a host abandons a lobby, create a new room rather than trying to start that abandoned room.
- This is a first playable prototype, not a security-training certification tool. Questions are educational general guidance; follow your organization's policies for real incidents.

## Two-device smoke test

1. Open the deployed URL on device A, enter a callsign, create a duel, and share the invite URL.
2. Open that URL on device B and join with a different callsign. Verify a third browser is rejected with a room-full message.
3. Start from device A. Submit once from each device and verify answers lock, the correct answer and explanation appear, and scores update.
4. On a later round, leave one player unanswered and let the timer expire; verify the round advances and that player earns zero.
5. Refresh one browser mid-match and verify it resumes its seat with the current round and scores; complete the duel and run a rematch without either player leaving.
