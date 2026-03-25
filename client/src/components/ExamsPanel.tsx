import React, { useEffect, useMemo, useState } from 'react'
import { AlternativeLabelType, api, Exam, ExamDetails, Question } from '../api'

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function ExamForm({
  initial,
  questions,
  onCancel,
  onSave
}: {
  initial?: Exam
  questions: Question[]
  onCancel: () => void
  onSave: (payload: Partial<Exam>) => Promise<void>
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [subject, setSubject] = useState(initial?.subject ?? '')
  const [teacher, setTeacher] = useState(initial?.teacher ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [instructions, setInstructions] = useState(initial?.instructions ?? '')
  const [alternativeLabelType, setAlternativeLabelType] = useState<AlternativeLabelType>(
    initial?.alternativeLabelType ?? 'LETTERS'
  )
  const [questionIds, setQuestionIds] = useState<string[]>(initial?.questionIds ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleQuestion(id: string) {
    setQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((questionId) => questionId !== id) : [...prev, id]
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (questionIds.length === 0) {
      setError('Select at least one question to create or update an exam.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        id: initial?.id,
        title,
        subject,
        teacher,
        date,
        instructions,
        alternativeLabelType,
        questionIds
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save exam')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-overlay">
      <form className="form exam-form" onSubmit={submit}>
        <h2>{initial ? 'Edit Exam' : 'New Exam'}</h2>
        <p className="form-subtitle">Define exam metadata and select questions from the existing bank.</p>

        {error && <p className="error-banner inline-error">{error}</p>}

        <div className="grid-fields">
          <label className="field-label">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field-label">
            Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
          </label>
          <label className="field-label">
            Teacher
            <input value={teacher} onChange={(e) => setTeacher(e.target.value)} required />
          </label>
          <label className="field-label">
            Date
            <input value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>

        <label className="field-label">
          Instructions (optional)
          <input value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </label>

        <label className="field-label">
          Alternative labels
          <select
            value={alternativeLabelType}
            onChange={(e) => setAlternativeLabelType(e.target.value as AlternativeLabelType)}
          >
            <option value="LETTERS">LETTERS (A, B, C, D...)</option>
            <option value="POWERS_OF_TWO">POWERS_OF_TWO (1, 2, 4, 8...)</option>
          </select>
        </label>

        <div className="question-selector">
          <h3>Select questions</h3>
          {questions.length === 0 ? (
            <p className="helper-text">No questions available yet. Create questions first.</p>
          ) : (
            <div className="question-select-list">
              {questions.map((question) => {
                const checked = questionIds.includes(question.id)
                return (
                  <label key={question.id} className="question-select-item">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuestion(question.id)}
                    />
                    <div>
                      <strong>{question.text}</strong>
                      <p>{question.alternatives.length} alternatives</p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="button-ghost" disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="button-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ExamDetailsModal({
  exam,
  onClose,
  onRefresh
}: {
  exam: ExamDetails
  onClose: () => void
  onRefresh: () => Promise<void>
}) {
  const [numberOfExams, setNumberOfExams] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generateFiles() {
    setGenerating(true)
    setError(null)
    try {
      const { fileName, blob } = await api.generateExamFiles(exam.id, numberOfExams)
      downloadBlob(blob, fileName)
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate files')
    } finally {
      setGenerating(false)
    }
  }

  const previewLabels = useMemo(() => {
    if (exam.alternativeLabelType === 'LETTERS') {
      return 'A, B, C, D...'
    }
    return '1, 2, 4, 8...'
  }, [exam.alternativeLabelType])

  return (
    <div className="form-overlay">
      <div className="form exam-details">
        <h2>{exam.title}</h2>
        <p className="form-subtitle">Exam details and version generation</p>

        {error && <p className="error-banner inline-error">{error}</p>}

        <div className="details-grid">
          <p>
            <strong>Subject:</strong> {exam.subject}
          </p>
          <p>
            <strong>Teacher:</strong> {exam.teacher}
          </p>
          <p>
            <strong>Date:</strong> {exam.date}
          </p>
          <p>
            <strong>Alternative labels:</strong> {previewLabels}
          </p>
          {exam.instructions ? (
            <p className="details-span">
              <strong>Instructions:</strong> {exam.instructions}
            </p>
          ) : null}
        </div>

        <h3>Questions in this exam</h3>
        <div className="question-preview-list">
          {exam.questions.map((question, index) => (
            <div key={question.id} className="question-preview-item">
              <strong>
                {index + 1}. {question.text}
              </strong>
              <span>{question.alternatives.length} alternatives</span>
            </div>
          ))}
        </div>

        <div className="generate-box">
          <h3>Generate individual versions</h3>
          <p className="helper-text">This downloads a ZIP with one PDF containing all versions and one CSV answer key.</p>
          <label className="field-label">
            Number of exams
            <input
              type="number"
              min={1}
              value={numberOfExams}
              onChange={(e) => setNumberOfExams(Number(e.target.value) || 1)}
            />
          </label>
          <button className="button-primary" onClick={generateFiles} disabled={generating || exam.questions.length === 0}>
            {generating ? 'Generating...' : 'Generate and Download ZIP'}
          </button>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="button-ghost">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ExamsPanel() {
  const [exams, setExams] = useState<Exam[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Exam | null>(null)
  const [details, setDetails] = useState<ExamDetails | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [allExams, allQuestions] = await Promise.all([api.listExams(), api.listQuestions()])
      setExams(allExams)
      setQuestions(allQuestions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load exams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function openDetails(examId: string) {
    setError(null)
    try {
      const examDetails = await api.getExam(examId)
      setDetails(examDetails)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load exam details')
    }
  }

  async function saveExam(payload: Partial<Exam>) {
    if (payload.id) {
      await api.updateExam(payload.id, payload)
    } else {
      await api.createExam(payload)
    }
    setShowForm(false)
    setEditing(null)
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this exam?')) return
    await api.deleteExam(id)
    if (details?.id === id) {
      setDetails(null)
    }
    await load()
  }

  if (loading) {
    return <div className="loading">Loading exams...</div>
  }

  return (
    <div className="list exams-list">
      <div className="panel-actions">
        <button
          className="button-primary"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
        >
          + New Exam
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {exams.length === 0 ? (
        <div className="empty-state">
          <h2>No exams yet</h2>
          <p>Create your first exam by selecting questions from the question bank.</p>
        </div>
      ) : (
        exams.map((exam) => (
          <div className="card" key={exam.id}>
            <div className="card-header">
              <div>
                <strong className="question-title">{exam.title}</strong>
                <p className="exam-meta">
                  {exam.subject} | {exam.teacher} | {exam.date} | {exam.questionIds.length} questions
                </p>
              </div>
              <div className="card-actions">
                <button className="button-ghost" onClick={() => openDetails(exam.id)}>
                  Details
                </button>
                <button
                  className="button-ghost"
                  onClick={() => {
                    setEditing(exam)
                    setShowForm(true)
                  }}
                >
                  Edit
                </button>
                <button className="button-danger" onClick={() => handleDelete(exam.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <ExamForm
          initial={editing ?? undefined}
          questions={questions}
          onCancel={() => {
            setShowForm(false)
            setEditing(null)
          }}
          onSave={saveExam}
        />
      )}

      {details && (
        <ExamDetailsModal
          exam={details}
          onClose={() => setDetails(null)}
          onRefresh={async () => {
            const refreshed = await api.getExam(details.id)
            setDetails(refreshed)
            await load()
          }}
        />
      )}
    </div>
  )
}
