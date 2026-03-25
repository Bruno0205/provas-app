import React, { useMemo, useState } from 'react'
import { api, CorrectionPreview, GradingMode } from '../api'

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

function downloadCsvTemplate(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, fileName)
}

export default function CorrectionsPanel() {
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null)
  const [responsesFile, setResponsesFile] = useState<File | null>(null)
  const [gradingMode, setGradingMode] = useState<GradingMode>('STRICT')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<CorrectionPreview | null>(null)

  const hasFiles = Boolean(answerKeyFile && responsesFile)

  const topErrors = useMemo(() => {
    if (!preview) return []
    return preview.errors.slice(0, 10)
  }, [preview])

  async function processCorrections() {
    if (!answerKeyFile || !responsesFile) {
      setError('Upload both CSV files before processing corrections.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await api.previewCorrections(answerKeyFile, responsesFile, gradingMode)
      setPreview(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process correction files')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  async function downloadReport() {
    if (!answerKeyFile || !responsesFile) {
      setError('Upload both CSV files before downloading the report.')
      return
    }

    setDownloading(true)
    setError(null)
    try {
      const { blob, fileName } = await api.downloadCorrectionsReport(
        answerKeyFile,
        responsesFile,
        gradingMode
      )
      downloadBlob(blob, fileName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download report CSV')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="list">
      <div className="card correction-card">
        <h2>Exam Correction and Class Grading</h2>
        <p className="form-subtitle">
          Upload the generated answer-key CSV and the student responses CSV, choose grading mode,
          then preview and export the class report.
        </p>

        {error && <p className="error-banner">{error}</p>}

        <div className="grid-fields">
          <label className="field-label">
            Answer Key CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setAnswerKeyFile(event.target.files?.[0] || null)}
            />
          </label>

          <label className="field-label">
            Student Responses CSV
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setResponsesFile(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <label className="field-label">
          Grading Mode
          <select value={gradingMode} onChange={(event) => setGradingMode(event.target.value as GradingMode)}>
            <option value="STRICT">STRICT (exact match only)</option>
            <option value="LENIENT">LENIENT (partial score by alternative position)</option>
          </select>
        </label>

        <div className="format-help">
          <p>
            <strong>Official answer key format:</strong> examNumber,labelType,q1,q2,q3
          </p>
          <pre className="csv-example">examNumber,labelType,q1,q2,q3{`\n`}1001,LETTERS,AC,B,D</pre>
          <p>
            <strong>Student responses format:</strong> studentName,cpf,examNumber,q1,q2,q3
          </p>
          <pre className="csv-example">studentName,cpf,examNumber,q1,q2,q3{`\n`}Ana Costa,55566677788,1001,BC,A,CE</pre>
          <div className="template-actions">
            <button
              type="button"
              className="button-ghost"
              onClick={() =>
                downloadCsvTemplate(
                  'examNumber,labelType,q1,q2,q3\n1001,LETTERS,AC,B,D\n',
                  'answer-key-template.csv'
                )
              }
            >
              Download Answer Key Template
            </button>
            <button
              type="button"
              className="button-ghost"
              onClick={() =>
                downloadCsvTemplate(
                  'studentName,cpf,examNumber,q1,q2,q3\nAna Costa,55566677788,1001,AC,B,D\n',
                  'student-responses-template.csv'
                )
              }
            >
              Download Responses Template
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button className="button-primary" disabled={!hasFiles || loading} onClick={processCorrections}>
            {loading ? 'Processing...' : 'Process Corrections'}
          </button>
          <button
            className="button-ghost"
            disabled={!hasFiles || downloading}
            onClick={downloadReport}
          >
            {downloading ? 'Downloading...' : 'Download Class Report CSV'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="card correction-card">
          <h3>Correction Summary</h3>
          <div className="details-grid">
            <p>
              <strong>Processed rows:</strong> {preview.summary.processedRows}
            </p>
            <p>
              <strong>Graded submissions:</strong> {preview.summary.gradedSubmissions}
            </p>
            <p>
              <strong>Valid submissions:</strong> {preview.summary.validSubmissions}
            </p>
            <p>
              <strong>Invalid or errored rows:</strong> {preview.summary.invalidSubmissions}
            </p>
          </div>

          {topErrors.length > 0 && (
            <div className="error-list">
              <h4>Validation / correction errors (first 10)</h4>
              <ul>
                {topErrors.map((item, index) => (
                  <li key={`${item.message}-${index}`}>
                    {item.rowNumber ? `Row ${item.rowNumber} - ` : ''}
                    {item.studentName ? `${item.studentName} - ` : ''}
                    {item.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3>Results Preview</h3>
          <div className="table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>CPF / ID</th>
                  <th>Exam #</th>
                  <th>Total</th>
                  <th>Possible</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {preview.results.slice(0, 30).map((result) => (
                  <tr key={`${result.rowNumber}-${result.examNumber}-${result.studentName}`}>
                    <td>{result.studentName}</td>
                    <td>{result.cpf || result.studentId || '-'}</td>
                    <td>{result.examNumber}</td>
                    <td>{result.totalScore.toFixed(2)}</td>
                    <td>{result.totalPossibleScore.toFixed(2)}</td>
                    <td>{result.finalPercentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
