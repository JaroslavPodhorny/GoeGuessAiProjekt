import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { nanoid } from "nanoid";
import path from "path";

const db = new Database("geoquest.db");

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    creator_id TEXT,
    region TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    type TEXT NOT NULL, -- pinpoint, capital, flag, feature
    location_name TEXT NOT NULL,
    lat REAL,
    lng REAL,
    options TEXT, -- JSON array for multiple choice
    correct_answer TEXT,
    image_url TEXT,
    time_limit INTEGER DEFAULT 30,
    points INTEGER DEFAULT 1000,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'waiting',
    current_question_index INTEGER DEFAULT 0,
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT,
    name TEXT NOT NULL,
    score INTEGER DEFAULT 0,
    last_answer_distance REAL,
    last_answer_time INTEGER,
    FOREIGN KEY(session_id) REFERENCES game_sessions(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS quiz_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(quiz_id) REFERENCES quizzes(id)
  );
`);

// API Routes
app.post("/api/users/register", (req, res) => {
  const { username } = req.body;
  const studentId = "STU-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const id = nanoid();
  try {
    db.prepare("INSERT INTO users (id, username, student_id) VALUES (?, ?, ?)").run(id, username, studentId);
    res.json({ id, username, studentId });
  } catch (e) {
    res.status(400).json({ error: "Username already exists" });
  }
});

app.get("/api/users/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  
  const history = db.prepare(`
    SELECT qh.*, q.title as quiz_title 
    FROM quiz_history qh 
    JOIN quizzes q ON qh.quiz_id = q.id 
    WHERE qh.user_id = ? 
    ORDER BY qh.played_at DESC
  `).all(req.params.id);
  
  res.json({ ...user, history });
});

app.get("/api/leaderboard", (req, res) => {
  const leaderboard = db.prepare(`
    SELECT u.username, SUM(qh.score) as total_score, COUNT(qh.id) as games_played
    FROM users u
    JOIN quiz_history qh ON u.id = qh.user_id
    GROUP BY u.id
    ORDER BY total_score DESC
    LIMIT 10
  `).all();
  res.json(leaderboard);
});

app.post("/api/quizzes", (req, res) => {
  const { title, description, imageUrl, creatorId, region, questions } = req.body;
  const quizId = nanoid();
  
  const insertQuiz = db.prepare("INSERT INTO quizzes (id, title, description, image_url, creator_id, region) VALUES (?, ?, ?, ?, ?, ?)");
  const insertQuestion = db.prepare("INSERT INTO questions (id, quiz_id, type, location_name, lat, lng, options, correct_answer, image_url, time_limit, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.transaction(() => {
    insertQuiz.run(quizId, title, description, imageUrl, creatorId, region);
    for (const q of questions) {
      insertQuestion.run(
        nanoid(),
        quizId,
        q.type,
        q.location_name,
        q.lat || null,
        q.lng || null,
        q.options ? JSON.stringify(q.options) : null,
        q.correct_answer || null,
        q.image_url || null,
        q.timeLimit || 30,
        q.points || 1000
      );
    }
  })();
  
  res.json({ id: quizId });
});

// Seed some data if empty
const quizCount = db.prepare("SELECT COUNT(*) as count FROM quizzes").get() as { count: number };
if (quizCount.count === 0) {
  const worldCapitalsId = nanoid();
  db.prepare("INSERT INTO quizzes (id, title, description, image_url) VALUES (?, ?, ?, ?)").run(
    worldCapitalsId,
    "World Capitals",
    "How well do you know where the world's capitals are?",
    "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80"
  );

  const capitals = [
    { name: "Paris", lat: 48.8566, lng: 2.3522 },
    { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
    { name: "Washington D.C.", lat: 38.9072, lng: -77.0369 },
    { name: "Brasília", lat: -15.7975, lng: -47.8919 },
    { name: "Canberra", lat: -35.2809, lng: 149.1300 },
    { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
  ];

  const insertQuestionSeed = db.prepare("INSERT INTO questions (id, quiz_id, type, location_name, lat, lng, time_limit, points) VALUES (?, ?, 'pinpoint', ?, ?, ?, 30, 1000)");
  capitals.forEach(c => insertQuestionSeed.run(nanoid(), worldCapitalsId, c.name, c.lat, c.lng));

  const landmarksId = nanoid();
  db.prepare("INSERT INTO quizzes (id, title, description, image_url) VALUES (?, ?, ?, ?)").run(
    landmarksId,
    "Famous Landmarks",
    "Pinpoint these iconic structures around the globe.",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80"
  );

  const landmarks = [
    { name: "Eiffel Tower", lat: 48.8584, lng: 2.2945 },
    { name: "Statue of Liberty", lat: 40.6892, lng: -74.0445 },
    { name: "Great Wall of China", lat: 40.4319, lng: 116.5704 },
    { name: "Machu Picchu", lat: -13.1631, lng: -72.5450 },
    { name: "Sydney Opera House", lat: -33.8568, lng: 151.2153 },
  ];
  landmarks.forEach(l => insertQuestionSeed.run(nanoid(), landmarksId, l.name, l.lat, l.lng));
}

// API Routes
app.get("/api/quizzes", (req, res) => {
  const quizzes = db.prepare("SELECT * FROM quizzes").all();
  res.json(quizzes);
});

app.post("/api/games", (req, res) => {
  const { quizId } = req.body;
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sessionId = nanoid();
  
  db.prepare("INSERT INTO game_sessions (id, quiz_id, join_code) VALUES (?, ?, ?)").run(
    sessionId,
    quizId,
    joinCode
  );
  
  res.json({ sessionId, joinCode });
});

// WebSocket logic
const clients = new Map<string, Set<WebSocket>>(); // sessionId -> clients

function broadcast(sessionId: string, message: any) {
  const sessionClients = clients.get(sessionId);
  if (sessionClients) {
    const data = JSON.stringify(message);
    sessionClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

wss.on("connection", (ws) => {
  let currentSessionId: string | null = null;
  let currentPlayerId: string | null = null;

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "join": {
        const { joinCode, playerName, isHost, userId } = message;
        const session = db.prepare("SELECT * FROM game_sessions WHERE join_code = ?").get(joinCode) as any;
        
        if (!session) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid join code" }));
          return;
        }

        currentSessionId = session.id;
        if (!clients.has(currentSessionId!)) {
          clients.set(currentSessionId!, new Set());
        }
        clients.get(currentSessionId!)!.add(ws);

        if (!isHost) {
          currentPlayerId = nanoid();
          db.prepare("INSERT INTO players (id, session_id, user_id, name) VALUES (?, ?, ?, ?)").run(
            currentPlayerId,
            currentSessionId,
            userId || null,
            playerName
          );
        }

        const players = db.prepare("SELECT * FROM players WHERE session_id = ?").all(currentSessionId);
        broadcast(currentSessionId!, { type: "player_joined", players });
        
        const response: any = { type: "joined", sessionId: currentSessionId, playerId: currentPlayerId };
        
        // If game is already playing, send current question
        if (session.status === 'playing') {
          const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(session.quiz_id) as any[];
          const currentQuestion = questions[session.current_question_index];
          if (currentQuestion) {
            response.question = {
              ...currentQuestion,
              options: currentQuestion.options ? JSON.parse(currentQuestion.options) : null
            };
            response.totalQuestions = questions.length;
            response.currentIndex = session.current_question_index;
          }
        }
        
        ws.send(JSON.stringify(response));
        break;
      }

      case "start_game": {
        if (!currentSessionId) {
          ws.send(JSON.stringify({ type: "error", message: "Session not found" }));
          return;
        }
        
        const session = db.prepare("SELECT * FROM game_sessions WHERE id = ?").get(currentSessionId) as any;
        if (!session) return;

        db.prepare("UPDATE game_sessions SET status = 'playing', current_question_index = 0 WHERE id = ?").run(currentSessionId);
        
        const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(session.quiz_id) as any[];
        
        if (questions.length === 0) {
          ws.send(JSON.stringify({ type: "error", message: "Quiz has no questions" }));
          return;
        }

        broadcast(currentSessionId, { 
          type: "game_started", 
          question: {
            ...questions[0],
            options: questions[0].options ? JSON.parse(questions[0].options) : null
          },
          totalQuestions: questions.length 
        });
        break;
      }

      case "submit_answer": {
        if (!currentSessionId || !currentPlayerId) return;
        const { lat, lng, timeTaken, answer } = message;
        
        const session = db.prepare("SELECT * FROM game_sessions WHERE id = ?").get(currentSessionId) as any;
        const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(session.quiz_id) as any[];
        const currentQuestion = questions[session.current_question_index];

        let finalScore = 0;
        let distance = null;

        if (currentQuestion.type === 'pinpoint' || currentQuestion.type === 'feature') {
          // Haversine distance in km
          const R = 6371;
          const dLat = (lat - currentQuestion.lat) * Math.PI / 180;
          const dLng = (lng - currentQuestion.lng) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(currentQuestion.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                    Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;

          const distanceScore = Math.max(0, currentQuestion.points - (distance / 5));
          finalScore = Math.round(distanceScore);
        } else {
          // Multiple choice (capital, flag)
          if (answer === currentQuestion.correct_answer) {
            const timeBonus = Math.max(0, (currentQuestion.time_limit * 1000 - timeTaken) / (currentQuestion.time_limit * 10));
            finalScore = Math.round(currentQuestion.points + timeBonus);
          }
        }

        db.prepare("UPDATE players SET score = score + ?, last_answer_distance = ?, last_answer_time = ? WHERE id = ?").run(
          finalScore,
          distance,
          timeTaken,
          currentPlayerId
        );

        const players = db.prepare("SELECT * FROM players WHERE session_id = ?").all(currentSessionId) as any[];
        const answeredCount = players.filter(p => p.last_answer_time !== null).length;

        if (answeredCount === players.length) {
          broadcast(currentSessionId, { 
            type: "all_answered", 
            correctLocation: currentQuestion.lat ? { lat: currentQuestion.lat, lng: currentQuestion.lng } : null,
            correctAnswer: currentQuestion.correct_answer,
            leaderboard: players.sort((a, b) => b.score - a.score)
          });
        }
        break;
      }

      case "next_question": {
        if (!currentSessionId) return;
        const session = db.prepare("SELECT * FROM game_sessions WHERE id = ?").get(currentSessionId) as any;
        const questions = db.prepare("SELECT * FROM questions WHERE quiz_id = ?").all(session.quiz_id) as any[];
        
        const nextIndex = session.current_question_index + 1;
        
        if (nextIndex < questions.length) {
          db.prepare("UPDATE game_sessions SET current_question_index = ? WHERE id = ?").run(nextIndex, currentSessionId);
          db.prepare("UPDATE players SET last_answer_distance = NULL, last_answer_time = NULL WHERE session_id = ?").run(currentSessionId);
          
          broadcast(currentSessionId, { 
            type: "new_question", 
            question: {
              ...questions[nextIndex],
              options: questions[nextIndex].options ? JSON.parse(questions[nextIndex].options) : null
            },
            index: nextIndex
          });
        } else {
          db.prepare("UPDATE game_sessions SET status = 'finished' WHERE id = ?").run(currentSessionId);
          const finalPlayers = db.prepare("SELECT * FROM players WHERE session_id = ? ORDER BY score DESC").all(currentSessionId) as any[];
          
          // Save history for registered users
          for (const player of finalPlayers) {
            if (player.user_id) {
              db.prepare("INSERT INTO quiz_history (id, user_id, quiz_id, score) VALUES (?, ?, ?, ?)").run(
                nanoid(),
                player.user_id,
                session.quiz_id,
                player.score
              );
            }
          }
          
          broadcast(currentSessionId, { type: "game_over", leaderboard: finalPlayers });
        }
        break;
      }
    }
  });

  ws.on("close", () => {
    if (currentSessionId && clients.has(currentSessionId)) {
      clients.get(currentSessionId)!.delete(ws);
    }
  });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  server.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

start();
