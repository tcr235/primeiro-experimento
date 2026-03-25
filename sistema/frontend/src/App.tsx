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
  const [meta, setMeta] = useState({ subject: '', professor: '', date: '', semester: '' });
  const [gradeMode, setGradeMode] = useState<'strict'|'proportional'>('strict');
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [respFile, setRespFile] = useState<File | null>(null);
  const [gradeReport, setGradeReport] = useState<any | null>(null);

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
  const payload = { questionIds: ids.length ? ids : undefined, copies, meta };

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
  a.download = 'tests_and_gabarito.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  }

  async function handleProcessGrades() {
    if (!keyFile || !respFile) return alert('Please select both files');
    const fd = new FormData();
    fd.append('key', keyFile);
    fd.append('responses', respFile);
    fd.append('mode', gradeMode);

    const res = await fetch(`${API}/grades/process`, { method: 'POST', body: fd });
    if (!res.ok) {
      const err = await res.json().catch(()=>({}));
      return alert('Grading failed: ' + (err.error || res.statusText));
    }
    const data = await res.json();
    setGradeReport(data);
  }

  function downloadReportCsv() {
    if (!gradeReport) return;
    // produce CSV: studentId,score
    const lines = ['studentId,' + (gradeReport.key || []).map((_:any,i:number)=>`q${i+1}`).join(',') + ',final'];
    for (const r of gradeReport.results) {
      lines.push([r.studentId, ...r.perQuestion.map((p:number)=>String(Number((p*100).toFixed(0))+'%')), String(r.final)+'%'].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'grades_report.csv'; a.click(); a.remove(); URL.revokeObjectURL(url);
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

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
              <input placeholder="Subject" value={meta.subject} onChange={(e)=>setMeta({...meta,subject:e.target.value})} />
              <input placeholder="Professor" value={meta.professor} onChange={(e)=>setMeta({...meta,professor:e.target.value})} />
              <input placeholder="Date (YYYY-MM-DD)" value={meta.date} onChange={(e)=>setMeta({...meta,date:e.target.value})} />
              <input placeholder="Semester" value={meta.semester} onChange={(e)=>setMeta({...meta,semester:e.target.value})} />
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

            <div className="panel">
              <h3>Grading</h3>
              <div style={{display:'grid',gap:8}}>
                <label>Answer key CSV: <input type="file" accept=".csv,text/csv" onChange={(e)=>setKeyFile(e.target.files?.[0]||null)} /></label>
                <label>Responses CSV: <input type="file" accept=".csv,text/csv" onChange={(e)=>setRespFile(e.target.files?.[0]||null)} /></label>
                <label>Mode:
                  <select value={gradeMode} onChange={(e)=>setGradeMode(e.target.value as any)}>
                    <option value="strict">Strict</option>
                    <option value="proportional">Proportional</option>
                  </select>
                </label>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={handleProcessGrades}>Process grades</button>
                  <button onClick={downloadReportCsv} disabled={!gradeReport}>Download CSV</button>
                </div>

                {gradeReport && (
                  <div>
                    <h4>Class report</h4>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr><th style={{textAlign:'left'}}>Student</th><th>Final %</th></tr>
                      </thead>
                      <tbody>
                        {gradeReport.results.map((r:any)=> (
                          <tr key={r.studentId}><td>{r.studentId}</td><td style={{textAlign:'center'}}>{r.final}%</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>Simple demo — no auth. Backend & frontend run separately.</footer>
    </div>
  );
}
