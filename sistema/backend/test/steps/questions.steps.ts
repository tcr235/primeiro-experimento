import {
  Given,
  When,
  Then,
  BeforeAll,
  AfterAll,
  setDefaultTimeout,
} from "@cucumber/cucumber";

// increase default timeout for potentially long operations (PDF/zip generation)
setDefaultTimeout(20000);
import request from "supertest";
import { startServer } from "../../src/index";

let response: any;

BeforeAll(async function () {
  // start server on a test port
  await startServer(4321);
});

AfterAll(async function () {
  // nothing for now
});

Given("the server is running", async function () {
  // noop, server started in BeforeAll
});

When(
  "I create a question with description {string} and alternatives {string} and correct {string}",
  async function (desc: string, alts: string, correct: string) {
    const altsArr = alts.split("|").map((t) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: t,
      correct: t === correct,
    }));
    response = await request("http://localhost:4321")
      .post("/questions")
      .send({ description: desc, alternatives: altsArr });
    if (response.status !== 201)
      throw new Error("failed to create question: " + response.status);
  },
);

When(
  "I request {int} copy for all questions with metadata",
  async function (copies: number) {
    response = await request("http://localhost:4321")
      .post("/tests/generate")
      .send({
        copies,
        meta: {
          subject: "T",
          professor: "P",
          date: "2026-03-25",
          semester: "2026.1",
        },
      })
      .buffer(true)
      .parse((res, cb: (err: Error | null, body?: any) => void) => {
        const chunks: Buffer[] = [];
        (res as any).on("data", (chunk: Buffer) => chunks.push(chunk));
        (res as any).on("end", () => cb(null, Buffer.concat(chunks)));
        (res as any).on("error", (err: Error) => cb(err));
      });
  },
);

Then(
  "I receive a zip containing tests.pdf and gabarito.csv",
  async function () {
    if (response.status !== 200)
      throw new Error("expected 200 got " + response.status);
    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("zip"))
      throw new Error("expected zip, got " + contentType);
  },
);
