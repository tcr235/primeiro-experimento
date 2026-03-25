export type Alternative = {
  id: string;
  text: string;
  correct: boolean;
};

export type Question = {
  id: string;
  description: string;
  alternatives: Alternative[];
};

// Fisher-Yates shuffle (pure function)
export function shuffle<T>(arr: T[], seed?: number): T[] {
  const out = arr.slice();
  // optional deterministic seed support (very simple)
  let rand = () => Math.random();
  if (typeof seed === "number") {
    let s = seed;
    rand = () => {
      // xorshift32-like
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return (s >>> 0) / 0xffffffff;
    };
  }

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Shuffle question order and alternatives inside each question
export function makeShuffledTests(
  questions: Question[],
  copies: number,
  seed?: number,
) {
  const tests: Question[][] = [];
  for (let c = 0; c < copies; c++) {
    const s = seed !== undefined ? seed + c : undefined;
    const qShuffled = shuffle(questions, s).map((q) => ({
      ...q,
      alternatives: shuffle(q.alternatives, s ? s + 1 : undefined),
    }));
    tests.push(qShuffled);
  }
  return tests;
}
