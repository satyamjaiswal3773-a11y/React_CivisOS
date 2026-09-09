import { useEffect, useState, type FormEvent } from 'react'
import { aiApi } from '../api'
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, Table, TextArea, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import type { AiAlertDto, AiAssistantAnswerDto } from '../types/api'

export function AiPage() {
  const [alerts, setAlerts] = useState<AiAlertDto[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<AiAssistantAnswerDto | null>(null)
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(false)

  async function load() {
    try {
      const result = await aiApi.alerts({ pageNumber: 1, pageSize: 50 })
      setAlerts(result.items)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function ack(id: string) {
    try {
      await aiApi.ack(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function ask(e: FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setAsking(true)
    try {
      const result = await aiApi.ask(question.trim())
      setAnswer(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title="AI" subtitle="Alerts and operations assistant" />
      {error ? <ErrorBanner message={error} /> : null}

      <div className="grid-2">
        <Card>
          <h2>Ask assistant</h2>
          <form className="form-stack" onSubmit={ask}>
            <TextArea
              rows={4}
              placeholder="Ask about fleet, attendance, cleaning, or tasks…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <Button type="submit" disabled={asking}>
              {asking ? 'Thinking…' : 'Ask'}
            </Button>
          </form>
          {answer ? (
            <div className="answer-box">
              <strong>Answer</strong>
              <p>{answer.answer}</p>
              {answer.sourcesUsed.length ? (
                <div className="chip-row">
                  {answer.sourcesUsed.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card>
          <h2>AI alerts</h2>
          {alerts.length === 0 ? (
            <EmptyState message="No AI alerts." />
          ) : (
            <Table headers={['Alert', 'Severity', 'Status', 'Detected', '']}>
              {alerts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.title}</strong>
                    <div className="muted tiny">{a.message}</div>
                  </td>
                  <td>
                    <Badge tone={a.severity === 'Critical' ? 'danger' : a.severity === 'Warning' ? 'warn' : 'info'}>{a.severity}</Badge>
                  </td>
                  <td>
                    <Badge tone={a.status === 'Open' ? 'warn' : 'ok'}>{a.status}</Badge>
                  </td>
                  <td>{formatDate(a.detectedAtUtc)}</td>
                  <td>
                    {a.status === 'Open' ? (
                      <Button variant="secondary" onClick={() => void ack(a.id)}>
                        Ack
                      </Button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
