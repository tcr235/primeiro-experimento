import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Question, Alternative } from "./models";
import { makeShuffledTests } from "./pdf/shuffler";
import { generateTestsPdf } from "./pdf/generator";
import archiver from "archiver";
import { PassThrough } from "stream";
import multer from 'multer';
import { parse } from 'csv-parse/sync';

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer();

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

// Generate PDF tests endpoint
// POST /tests/generate
// body: { questionIds?: string[], copies: number, seed?: number }
app.post("/tests/generate", async (req, res) => {
  const { questionIds, copies, seed, meta } = req.body as {
    questionIds?: string[];
    copies?: number;
    seed?: number;
    meta?: any;
  };
  const n = Number(copies || 1);
  if (!Number.isInteger(n) || n < 1 || n > 200)
    return res
      .status(400)
      .json({ error: "copies must be integer between 1 and 200" });

  // select questions
  const selected =
    questionIds && questionIds.length > 0
      ? questions.filter((q) => questionIds.includes(q.id))
      : questions;
  if (selected.length === 0)
    return res.status(400).json({ error: "no questions selected" });

  // prepare shuffled tests
  const tests = makeShuffledTests(selected, n, seed);

  // Build CSV gabarito: each line -> examNumber,answer1,answer2,...
  function buildGabaritoCsv(testsArg: Question[][]) {
    const lines: string[] = [];
    const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    testsArg.forEach((t: Question[], idx: number) => {
      const answers = t.map((q: Question) => {
        // collect correct alternatives' labels (could be multiple)
        const corrects = q.alternatives
          .map((a: any, i: number) =>
            a.correct ? (labels[i] ?? String(i + 1)) : null,
          )
          .filter(Boolean) as string[];
        // if identification by powers-of-two needed, here we'd compute sum
        return corrects.join("|");
      });
      lines.push([String(idx + 1), ...answers].join(","));
    });
    return lines.join("\n");
  }

  try {
    // Create a zip archive streamed to response
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tests_and_gabarito.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err: Error) => {
      console.error("archive error", err);
      if (!res.headersSent) res.status(500).end();
    });
    archive.pipe(res);

    // PDF: generate into a passthrough stream and append to archive
    const pdfStream = new PassThrough();
    archive.append(pdfStream, { name: "tests.pdf" });
    // Start PDF generation into pdfStream
    generateTestsPdf(tests, pdfStream, meta);

    // CSV gabarito
    const csv = buildGabaritoCsv(tests);
    archive.append(csv, { name: "gabarito.csv" });

    await archive.finalize();
    // response will be closed when archive finishes
  } catch (err) {
    console.error("zip generation failed", err);
    if (!res.headersSent)
      res.status(500).json({ error: "zip generation failed" });
  }
});

// Grades processing endpoint
// Accepts multipart/form-data with fields:
// - key: CSV file (first column question number optional, rest are answers)
// - responses: CSV file where first column is student id/name and following columns are answers
// - mode: 'strict' | 'proportional'
app.post('/grades/process', upload.fields([{ name: 'key' }, { name: 'responses' }]), async (req, res) => {
  try {
    const mode = String((req.body.mode || 'strict'));
    const keyFile = req.files && (req.files as any).key && (req.files as any).key[0];
    const respFile = req.files && (req.files as any).responses && (req.files as any).responses[0];
    if (!keyFile || !respFile) return res.status(400).json({ error: 'both files required (key, responses)' });

    const keyText = keyFile.buffer.toString('utf8');
    const respText = respFile.buffer.toString('utf8');

    // key: parse rows; each row is expected to have examId at index 0 and answers starting at index 1
    const keyRecords = parse(keyText, { trim: true, skip_empty_lines: true });
    // build map examId -> answers[]; also keep a default (first) key for fallback
    const keyMap: Record<string, string[]> = {};
    for (const r of keyRecords) {
      if (!r || r.length < 2) continue;
      const examId = String(r[0]).trim();
      const answersArr = r.slice(1).map((c: any) => String(c).trim());
      keyMap[examId] = answersArr;
    }
    const keyDefault = keyRecords.length > 0 ? keyRecords[0].slice(1).map((c: any) => String(c).trim()) : [];

  const respRecords = parse(respText, { trim: true, skip_empty_lines: true });
  // Student responses: expected columns -> [studentId, examId, answer1, answer2, ...]
  const dataRows = respRecords;

    // grading
    const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function parseAnswerCell(cell: string) {
      // support 'A|C' or 'A' or '1' etc.
      if (!cell) return [];
      return String(cell).split('|').map(s => s.trim()).filter(Boolean);
    }

    const results: any[] = [];
    for (const row of dataRows) {
      const studentId = String(row[0]);
      const studentExamId = String(row[1] ?? '').trim();
      const answers = row.slice(2).map((c: any) => parseAnswerCell(String(c)));
      // pick the correct key for this student's exam id, fall back to default
      const keyForExam = (studentExamId && keyMap[studentExamId]) ? keyMap[studentExamId] : keyDefault;
      let total = 0;
      const perQuestion: number[] = [];
      for (let i = 0; i < keyForExam.length; i++) {
        const correct = parseAnswerCell(String(keyForExam[i] || ''));
        const given = answers[i] || [];

        if (mode === 'strict') {
          // strict: exact set match
          const ok = correct.length === given.length && correct.every(v => given.includes(v));
          perQuestion.push(ok ? 1 : 0);
          total += ok ? 1 : 0;
        } else {
          // proportional: compute proportion of correctly selected and correctly unselected
          const allLabels = labels.split('').slice(0, Math.max(correct.length, given.length, 4));
          // actually derive from union of indices of alternatives in key and given
          const union = Array.from(new Set([...correct, ...given]));
          // for scoring, consider alternatives present in the question: we'll approximate using union
          let correctCount = 0;
          let totalCount = union.length;
          if (totalCount === 0) { perQuestion.push(1); total += 1; continue; }
          for (const lab of union) {
            const isCorrect = correct.includes(lab);
            const isGiven = given.includes(lab);
            if (isCorrect === isGiven) correctCount += 1;
          }
          const score = correctCount / totalCount;
          perQuestion.push(score);
          total += score;
        }
      }
  const final = (keyForExam.length > 0) ? (total / keyForExam.length) * 100 : 0; // percentage
      results.push({ studentId, perQuestion, final: Number(final.toFixed(2)) });
    }

  // return JSON report; frontend can display or download
  res.json({ mode, results, key: keyDefault });
  } catch (err) {
    console.error('grading failed', err);
    res.status(500).json({ error: 'grading failed' });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

(async function start() {
  await loadData();
  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
})();
