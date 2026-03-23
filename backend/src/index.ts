import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Question, Alternative } from "./models";

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "questions.json");

let questions: Question[] = [];

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("failed to create data dir", err);
  }
}

async function loadData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    questions = JSON.parse(raw) as Question[];
  } catch {
    questions = [];
  }
}

async function saveData() {
  try {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(questions, null, 2), "utf-8");
  } catch (err) {
    console.error("failed to save data", err);
  }
}

// Basic API
app.get("/questions", (req, res) => {
  res.json(questions);
});

app.post("/questions", async (req, res) => {
  const body = req.body as Partial<Question>;
  if (!body.description)
    return res.status(400).json({ error: "description required" });

  const q: Question = {
    id: uuidv4(),
    description: String(body.description),
    alternatives: (body.alternatives || []).map((a: Partial<Alternative>) => ({
      id: a.id || uuidv4(),
      text: String(a.text || ""),
      correct: Boolean(a.correct || false),
    })),
  };
  questions.push(q);
  await saveData();
  res.status(201).json(q);
});

app.put("/questions/:id", async (req, res) => {
  const id = req.params.id;
  const body = req.body as Partial<Question>;
  const idx = questions.findIndex((x) => x.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  const updated: Question = {
    id,
    description: body.description ?? questions[idx].description,
    alternatives: (body.alternatives || questions[idx].alternatives).map(
      (a: any) => ({
        id: a.id || uuidv4(),
        text: String(a.text || ""),
        correct: Boolean(a.correct || false),
      }),
    ),
  };
  questions[idx] = updated;
  await saveData();
  res.json(updated);
});

app.delete("/questions/:id", async (req, res) => {
  const id = req.params.id;
  const before = questions.length;
  questions = questions.filter((q) => q.id !== id);
  if (questions.length === before)
    return res.status(404).json({ error: "not found" });
  await saveData();
  res.status(204).send();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

(async function start() {
  await loadData();
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
})();
