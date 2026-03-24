import React, { useState } from 'react'
import { Question } from '../api'

function makeId() {
  return String(Date.now()) + Math.random().toString(36).slice(2, 8)
}

export default function QuestionForm({
  initial,
  onCancel,
  onSave
}: {
  initial?: Question
  onCancel: () => void
  onSave: (payload: Partial<Question>) => void
}) {
  const [text, setText] = useState(initial?.text ?? '')
  const [alternatives, setAlternatives] = useState(
    initial?.alternatives ?? [
      { id: makeId(), text: '', correct: false },
      { id: makeId(), text: '', correct: false }
    ]
  )

  function updateAlt(id: string, patch: Partial<{ text: string; correct: boolean }>) {
    setAlternatives((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  function addAlt() {
    setAlternatives((prev) => [...prev, { id: makeId(), text: '', correct: false }])
  }

  function removeAlt(id: string) {
    setAlternatives((prev) => prev.filter((a) => a.id !== id))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload: Partial<Question> = {
      id: initial?.id,
      text: text.trim(),
      alternatives: alternatives.map((a) => ({ id: a.id, text: a.text, correct: !!a.correct }))
    }
    onSave(payload)
  }

  return (
    <div className="form-overlay">
      <form className="form" onSubmit={submit}>
        <h2>{initial ? 'Edit Question' : 'New Question'}</h2>
        <p className="form-subtitle">Write a clear prompt and mark the correct alternatives.</p>

        <label className="field-label">
          Statement
          <input value={text} onChange={(e) => setText(e.target.value)} required />
        </label>

        <div className="alts">
          <h3>Alternatives</h3>
          {alternatives.map((a) => (
            <div className="alt" key={a.id}>
              <input
                className="alt-text"
                value={a.text}
                placeholder="Alternative text"
                onChange={(e) => updateAlt(a.id, { text: e.target.value })}
                required
              />
              <label className="alt-correct">
                <input
                  type="checkbox"
                  checked={a.correct}
                  onChange={(e) => updateAlt(a.id, { correct: e.target.checked })}
                />
                Correct
              </label>

              <button type="button" className="button-ghost" onClick={() => removeAlt(a.id)}>
                Remove
              </button>
            </div>
          ))}

          <div>
            <button type="button" onClick={addAlt} className="button-ghost">
              Add Alternative
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="button-ghost">
            Cancel
          </button>
          <button type="submit" className="button-primary">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}
