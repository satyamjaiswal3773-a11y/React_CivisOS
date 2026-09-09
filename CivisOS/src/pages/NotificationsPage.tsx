import { useEffect, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { notificationsApi } from '../api'
import { Badge, Button, Card, EmptyState, ErrorBanner, PageHeader, formatDate } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import { createHub } from '../lib/signalr'
import type { NotificationDto } from '../types/api'

export function NotificationsPage() {
  const [items, setItems] = useState<NotificationDto[]>([])
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)

  async function load(filterUnread = unreadOnly) {
    try {
      const result = await notificationsApi.list({
        pageNumber: 1,
        pageSize: 50,
        unreadOnly: filterUnread || undefined,
      })
      setItems(result.items)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void load()
    let connection: HubConnection | null = null
    async function connect() {
      connection = createHub('/hubs/notifications')
      connection.on('notificationReceived', (dto: NotificationDto) => {
        setItems((prev) => [dto, ...prev])
      })
      try {
        await connection.start()
      } catch {
        // hub optional in offline/dev without API
      }
    }
    void connect()
    return () => {
      void connection?.stop()
    }
  }, [])

  async function markRead(id: string) {
    try {
      await notificationsApi.markRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, readAtUtc: new Date().toISOString() } : n)))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        subtitle="Live inbox via SignalR"
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              const next = !unreadOnly
              setUnreadOnly(next)
              void load(next)
            }}
          >
            {unreadOnly ? 'Show all' : 'Unread only'}
          </Button>
        }
      />
      {error ? <ErrorBanner message={error} /> : null}
      <Card>
        {items.length === 0 ? (
          <EmptyState message="No notifications." />
        ) : (
          <ul className="list">
            {items.map((n) => (
              <li key={n.id} className={n.isRead ? '' : 'unread'}>
                <div className="list-row">
                  <div>
                    <div className="chip-row">
                      <strong>{n.title}</strong>
                      <Badge tone={n.isRead ? 'neutral' : 'info'}>{n.type}</Badge>
                    </div>
                    <p>{n.body}</p>
                    <span className="tiny muted">{formatDate(n.createdAtUtc)}</span>
                  </div>
                  {!n.isRead ? (
                    <Button variant="ghost" onClick={() => void markRead(n.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
