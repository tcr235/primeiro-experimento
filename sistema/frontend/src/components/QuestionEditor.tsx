import React, { useState } from "react";
import { Question, Alternative } from "../types";

type Props = {
  initial?: Partial<Question>;
  onSave: (q: Omit<Question, "id"> | Question) => void;
  onCancel?: () => void;
};

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function QuestionEditor({ initial, onSave, onCancel }: Props) {
  const [description, setDescription] = useState(initial?.description ?? "");
  const [alternatives, setAlternatives] = useState<Alternative[]>(
    (initial?.alternatives || [
      { id: makeId(), text: "", correct: false },
      { id: makeId(), text: "", correct: false },
    ]) as Alternative[],
  );

  function updateAlt(id: string, patch: Partial<Alternative>) {
    setAlternatives((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }

  function addAlt() {
    setAlternatives((prev) => [
      ...prev,
      { id: makeId(), text: "", correct: false },
    ]);
  }

  function removeAlt(id: string) {
    setAlternatives((prev) => prev.filter((a) => a.id !== id));
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const payload: any = {
      description: description.trim(),
      alternatives: alternatives.map((a) => ({
        id: a.id,
        text: a.text.trim(),
        correct: a.correct,
      })),
    };
    onSave(payload);
  }

  return (
    <form className="editor" onSubmit={submit}>
      <label>
        Question
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </label>

      <div className="alts">
        {alternatives.map((a) => (
          <div key={a.id} className="alt-row">
            <input
              className="alt-input"
              value={a.text}
              onChange={(e) => updateAlt(a.id, { text: e.target.value })}
              placeholder="Alternative text"
              required
            />
            <label className="correct">
              <input
                type="checkbox"
                checked={a.correct}
                onChange={(e) => updateAlt(a.id, { correct: e.target.checked })}
              />
              Correct
            </label>
            <button
              type="button"
              className="small"
              onClick={() => removeAlt(a.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="editor-actions">
        <button type="button" onClick={addAlt} className="small">
          Add alternative
        </button>
        <div>
          <button type="submit">Save</button>
          <button type="button" className="muted" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
