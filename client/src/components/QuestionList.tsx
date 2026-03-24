import React from 'react'
import { Question } from '../api'

export default function QuestionList({
  questions,
  onEdit,
  onDelete
}: {
  questions: Question[]
  onEdit: (q: Question) => void
  onDelete: (id: string) => void
}) {
  if (questions.length === 0) {
    return (
      <div className="empty-state">
        <h2>No questions yet</h2>
        <p>Create your first question to start building your quiz bank.</p>
      </div>
    )
  }

  return (
    <div className="list">
      {questions.map((q) => (
        <div className="card" key={q.id}>
          <div className="card-header">
            <strong className="question-title">{q.text}</strong>
            <div className="card-actions">
              <button className="button-ghost" onClick={() => onEdit(q)}>
                Edit
              </button>
              <button className="button-danger" onClick={() => onDelete(q.id)}>
                Delete
              </button>
            </div>
          </div>

          <ul className="alt-list">
            {q.alternatives.map((a) => (
              <li key={a.id} className="alt-item">
                <span>{a.text}</span>
                {a.correct ? <em className="correct">Correct</em> : ''}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
