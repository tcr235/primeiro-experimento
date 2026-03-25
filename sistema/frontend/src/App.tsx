import React, { useEffect, useState } from "react";
import { Question } from "./types";
import QuestionList from "./components/QuestionList";
import QuestionEditor from "./components/QuestionEditor";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [copies, setCopies] = useState<number>(1);

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

  function toggleSelect(id: string) {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  }

  async function handleGenerate() {
    const ids = Object.keys(selectedIds).filter((k) => selectedIds[k]);
    const payload = { questionIds: ids.length ? ids : undefined, copies };

    const res = await fetch(`${API}/tests/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Failed to generate PDF: ' + (err.error || res.statusText));
      return;
    }

    // stream download
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tests.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <label style={{display:'flex',gap:8,alignItems:'center'}}>
                Copies:
                <input type="number" min={1} max={200} value={copies} onChange={(e)=>setCopies(Number(e.target.value)||1)} style={{width:80}} />
              </label>
              <button onClick={handleGenerate}>/tests/generate</button>
            </div>

            <QuestionList
              questions={questions}
              onEdit={(q) => setEditing(q)}
              onDelete={handleDelete}
            />

            <div className="panel">
              <h3>Selection</h3>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {questions.map(q=> (
                  <label key={q.id} style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input type="checkbox" checked={!!selectedIds[q.id]} onChange={()=>toggleSelect(q.id)} />
                    <span style={{fontSize:13}}>{q.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>Simple demo — no auth. Backend & frontend run separately.</footer>
    </div>
  );
}
