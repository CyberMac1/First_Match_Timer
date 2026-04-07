# FRC Match Dashboard

A real-time web dashboard for FIRST Robotics Competition (FRC) teams to monitor match status during competition events. Displays last match results, next match countdown, bumper color, team ranking, and event schedule — all pulled live from the official FRC Events API.

---

## Features

- **Event & Team Header** — Event name, team name, and live ranking chips (rank, W-L-T record, average score)
- **Currently On Field** — Shows the match number currently being played at the event
- **Last Match** — Your team's most recent result: alliance, win/loss/tie, team score vs opponent, auto points, fouls received
- **Next Match** — Bumper color (RED/BLUE), scheduled start time, estimated start time with delay calculation, and a live countdown timer
- **Following Match** — The match after next: bumper color and estimated start time
- **Queuing Alert** — The Next Match card glows orange with a pulsing "Queuing" badge when the field is within 2 matches of your team's next match
- **Auto-Refresh** — Data refreshes automatically every 60 seconds with a visible countdown in the status bar
- **Test Mode** — Simulate any prior match as "current" with a fake clock to verify dashboard behavior (enabled via `.env`)

---

## How It Works

The dashboard is a Node.js/Express server that:
1. Serves the single-page HTML dashboard
2. Proxies requests to the [FRC Events API](https://frc-events.firstinspires.org/services/API) so credentials never leave the server

**Delay estimation** — The server fetches the hybrid schedule (scheduled + actual start times) for all matches. It averages the difference between `actualStartTime` and `startTime` across the last N played matches (configurable) and adds that offset to the next match's scheduled time to produce an estimated start.

**Queuing detection** — Compares the array position of the current field match against the team's next match in the merged qualification + playoff schedule. Triggers when the gap is ≤ 2 matches.

---

## Requirements

- Node.js 16 or higher
- FRC Events API credentials ([register here](https://frc-events.firstinspires.org/services/API))

---

## Setup

### 1. Clone the repository

```bash
git clone git@github.com:CyberMac1/First_Match_Timer.git
cd First_Match_Timer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# FRC API Credentials (never committed to git)
FRC_USERNAME=your_username
FRC_API_KEY=your_api_key

# Show the Test Mode panel in the dashboard (true/false)
TEST_MODE_ENABLED=false

# Server port (optional, defaults to 3000)
PORT=3000
```

Get your FRC API credentials at **frc-events.firstinspires.org/services/API**.

### 4. Start the server

```bash
npm start
```

Open **http://localhost:3000** in your browser.

---

## Configuration (Settings Panel)

Open the **⚙ Settings** panel in the dashboard and fill in:

| Field | Description |
|---|---|
| Team Number | Your FRC team number (e.g. `1234`) |
| Season Year | Competition year (e.g. `2026`) |
| Event | Dropdown auto-populated from the API once team + season are entered |
| Delay Sample Size | Number of recent matches used to calculate the schedule delay (default: 5) |

API credentials are **not** in the settings UI — set them in `.env` only.

---

## Deploying to Railway (recommended)

[Railway](https://railway.app) offers a free tier that keeps the app running without sleeping — ideal for competition day.

1. Push this repo to GitHub
2. Sign in at railway.app → **New Project** → **Deploy from GitHub repo**
3. Select this repository
4. Go to the **Variables** tab and add:
   - `FRC_USERNAME`
   - `FRC_API_KEY`
   - `TEST_MODE_ENABLED` (`false` for production)
5. Railway auto-detects the `npm start` script and deploys

You'll get a public URL (e.g. `your-app.up.railway.app`) with no additional configuration.

---

## Project Structure

```
├── server.js          # Express server — proxies FRC API, serves dashboard, exposes /config
├── public/
│   └── index.html     # Single-page dashboard (HTML + CSS + JS)
├── .env               # Your credentials (git-ignored)
├── .env.example       # Template for .env
├── package.json
└── README.md
```

---

## API Endpoints Used

All calls go through the server proxy at `/api/frc/*` → `https://frc-api.firstinspires.org/v2.0/*`

| Endpoint | Purpose |
|---|---|
| `GET /{season}/schedule/{event}/qual/hybrid` | Qualification schedule with actual start times |
| `GET /{season}/schedule/{event}/playoff/hybrid` | Playoff schedule with actual start times |
| `GET /{season}/events?teamNumber={team}` | All events a team is registered in (settings dropdown) |
| `GET /{season}/events?eventCode={code}` | Event name and details for the header |
| `GET /{season}/teams?teamNumber={team}` | Team name |
| `GET /{season}/rankings/{event}` | Team ranking, W-L-T record, average score |

---

## Test Mode

Enable in `.env` by setting `TEST_MODE_ENABLED=true` and restarting the server. The Test Mode panel appears at the bottom of the dashboard.

**How to use:**
1. Select any previously-played match from the dropdown as the "last played" match
2. Set a simulated current time
3. Click **Apply** — the dashboard recalculates delays, countdown, and queuing status as if it were that moment in time

The simulated clock ticks forward in real time from the moment you apply it, so the countdown timer is live.

---

## License

MIT
