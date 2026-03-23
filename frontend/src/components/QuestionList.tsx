import React from "react";
import { Question } from "../types";

type Props = {
  questions: Question[];
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
};

export default function QuestionList({ questions, onEdit, onDelete }: Props) {
  return (
    <div className="qlist">
      {questions.length === 0 && <div className="empty">No questions yet</div>}
      {questions.map((q) => (
        <div key={q.id} className="card">
          <div className="card-header">
            <strong>{q.description}</strong>
          </div>
          <ul>
            {q.alternatives.map((a) => (
              <li key={a.id} className={a.correct ? "alt correct" : "alt"}>
                <span className="alt-text">{a.text}</span>
                {a.correct && <span className="badge">Correct</span>}
              </li>
            ))}
          </ul>
          <div className="card-actions">
            <button onClick={() => onEdit(q)}>Edit</button>
            <button className="danger" onClick={() => onDelete(q.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
