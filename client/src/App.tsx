import React, { useEffect, useState } from 'react'
import { api, Question } from './api'
import QuestionList from './components/QuestionList'
import QuestionForm from './components/QuestionForm'
import ExamsPanel from './components/ExamsPanel'

export default function App() {
  const [activeTab, setActiveTab] = useState<'questions' | 'exams'>('questions')
  const [questions, setQuestions] = useState<Question[]>([])
  const [editing, setEditing] = useState<Question | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const qs = await api.listQuestions()
      setQuestions(qs)
    } catch (err) {
      setError('Could not load questions. Please check if the server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function onCreateClick() {
    setEditing(null)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    await api.deleteQuestion(id)
    load()
  }

  function handleEdit(q: Question) {
    setEditing(q)
    setShowForm(true)
  }

  async function handleSave(payload: Partial<Question>) {
    if (payload.id) {
      await api.updateQuestion(payload.id, payload)
    } else {
      await api.createQuestion(payload)
    }
    setShowForm(false)
    load()
  }

  return (
    <div className="page-shell">
      <div className="background-shape shape-a" aria-hidden="true" />
      <div className="background-shape shape-b" aria-hidden="true" />

      <div className="container">
        <header className="hero">
          <div>
            <p className="eyebrow">Question Manager</p>
            <h1>Build better quizzes faster</h1>
            <p className="subtitle">
              Create, edit, and organize closed questions in a clean flow.
            </p>
          </div>

          <div className="hero-actions">
            <button className="button-primary" onClick={onCreateClick}>
              + New Question
            </button>
            <div className="stats-card">
              <span>Total questions</span>
              <strong>{questions.length}</strong>
            </div>
          </div>
        </header>

        {error && <p className="error-banner">{error}</p>}

        <div className="tab-row">
          <button
            className={activeTab === 'questions' ? 'button-primary' : 'button-ghost'}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
          <button
            className={activeTab === 'exams' ? 'button-primary' : 'button-ghost'}
            onClick={() => setActiveTab('exams')}
          >
            Exams
          </button>
        </div>

        <main>
          {activeTab === 'questions' ? (
            <>
              {loading ? (
                <div className="loading">Loading questions...</div>
              ) : (
                <QuestionList questions={questions} onEdit={handleEdit} onDelete={handleDelete} />
              )}

              {showForm && (
                <QuestionForm
                  initial={editing ?? undefined}
                  onCancel={() => setShowForm(false)}
                  onSave={handleSave}
                />
              )}
            </>
          ) : (
            <ExamsPanel />
          )}
        </main>
      </div>
    </div>
  )
}
