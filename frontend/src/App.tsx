import React, { useEffect, useState } from "react";
import { Question } from "./types";
import QuestionList from "./components/QuestionList";
import QuestionEditor from "./components/QuestionEditor";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch(`${API}/questions`);
    const data = await res.json();
    setQuestions(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(payload: any) {
    if (editing) {
      const res = await fetch(`${API}/questions/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setQuestions((q) => q.map((x) => (x.id === updated.id ? updated : x)));
      setEditing(null);
    } else {
      const res = await fetch(`${API}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await res.json();
      setQuestions((q) => [...q, created]);
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    await fetch(`${API}/questions/${id}`, { method: "DELETE" });
    setQuestions((q) => q.filter((x) => x.id !== id));
  }

  return (
    <div className="shell">
      <header>
        <h1>Question Manager</h1>
        <p className="sub">
          Create and manage closed questions and their alternatives.
        </p>
      </header>

      <main>
        <aside>
          <div className="panel">
            <h2>Actions</h2>
            {!creating && (
              <button onClick={() => setCreating(true)}>New Question</button>
            )}
            {creating && (
              <QuestionEditor
                onSave={handleSave}
                onCancel={() => setCreating(false)}
              />
            )}
            {editing && (
              <div>
                <h3>Editing</h3>
                <QuestionEditor
                  initial={editing}
                  onSave={handleSave}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}
          </div>
        </aside>

        <section>
          <QuestionList
            questions={questions}
            onEdit={(q) => setEditing(q)}
            onDelete={handleDelete}
          />
        </section>
      </main>

      <footer>Simple demo — no auth. Backend & frontend run separately.</footer>
    </div>
  );
}
