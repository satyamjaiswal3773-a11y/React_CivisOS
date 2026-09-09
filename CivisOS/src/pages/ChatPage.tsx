import { useEffect, useState, type FormEvent } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import { conversationsApi } from '../api'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, EmptyState, ErrorBanner, Input, PageHeader, Select, TextArea } from '../components/ui'
import { getErrorMessage } from '../lib/http'
import { createHub } from '../lib/signalr'
import type { ConversationDto, ConversationType, MessageDto } from '../types/api'

export function ChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: '',
    type: 'Private' as ConversationType,
    memberUserIds: '',
  })

  async function loadConversations() {
    try {
      const result = await conversationsApi.list({ pageNumber: 1, pageSize: 50 })
      setConversations(result.items)
      if (!activeId && result.items[0]) setActiveId(result.items[0].id)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function loadMessages(id: string) {
    try {
      const result = await conversationsApi.messages(id, { pageNumber: 1, pageSize: 100 })
      setMessages([...result.items].reverse())
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    void loadConversations()
  }, [])

  useEffect(() => {
    if (!activeId) return
    void loadMessages(activeId)

    let connection: HubConnection | null = null
    async function connect() {
      connection = createHub('/hubs/chat')
      connection.on('messageReceived', (dto: MessageDto) => {
        if (dto.conversationId === activeId) {
          setMessages((prev) => (prev.some((m) => m.id === dto.id) ? prev : [...prev, dto]))
        }
      })
      try {
        await connection.start()
        await connection.invoke('JoinConversation', activeId)
      } catch {
        // optional while API offline
      }
    }
    void connect()
    return () => {
      void (async () => {
        try {
          if (connection && activeId) await connection.invoke('LeaveConversation', activeId)
        } catch {
          /* ignore */
        }
        await connection?.stop()
      })()
    }
  }, [activeId])

  async function send(e: FormEvent) {
    e.preventDefault()
    if (!activeId || !body.trim()) return
    try {
      const msg = await conversationsApi.send(activeId, body.trim())
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
      setBody('')
      await loadConversations()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function createConversation(e: FormEvent) {
    e.preventDefault()
    try {
      const members = createForm.memberUserIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (user?.id && !members.includes(user.id)) members.push(user.id)
      const created = await conversationsApi.create({
        title: createForm.title,
        type: createForm.type,
        memberUserIds: members,
      })
      setShowCreate(false)
      setCreateForm({ title: '', type: 'Private', memberUserIds: '' })
      await loadConversations()
      setActiveId(created.id)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const active = conversations.find((c) => c.id === activeId)

  return (
    <div className="page">
      <PageHeader
        title="Chat"
        subtitle="Team conversations"
        actions={<Button onClick={() => setShowCreate((v) => !v)}>{showCreate ? 'Close' : 'New chat'}</Button>}
      />
      {error ? <ErrorBanner message={error} /> : null}

      {showCreate ? (
        <Card>
          <form className="form-grid" onSubmit={createConversation}>
            <Input placeholder="Title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} required />
            <Select value={createForm.type} onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as ConversationType })}>
              <option value="Private">Private</option>
              <option value="Group">Group</option>
            </Select>
            <Input
              placeholder="Member user IDs (comma-separated)"
              value={createForm.memberUserIds}
              onChange={(e) => setCreateForm({ ...createForm, memberUserIds: e.target.value })}
            />
            <Button type="submit">Create</Button>
          </form>
        </Card>
      ) : null}

      <div className="chat-layout">
        <Card className="chat-sidebar">
          <h2>Conversations</h2>
          {conversations.length === 0 ? (
            <EmptyState message="No conversations yet." />
          ) : (
            <ul className="list compact">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button className={c.id === activeId ? 'chat-item active' : 'chat-item'} onClick={() => setActiveId(c.id)}>
                    <strong>{c.title}</strong>
                    <span className="muted tiny">{c.lastMessagePreview || c.type}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="chat-main">
          {!active ? (
            <EmptyState message="Select a conversation." />
          ) : (
            <>
              <h2>{active.title}</h2>
              <div className="message-list">
                {messages.map((m) => (
                  <div key={m.id} className={m.senderUserId === user?.id ? 'bubble mine' : 'bubble'}>
                    <p>{m.body}</p>
                    <span className="tiny">{new Date(m.sentAtUtc).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
              <form className="toolbar" onSubmit={send}>
                <TextArea rows={2} placeholder="Write a message…" value={body} onChange={(e) => setBody(e.target.value)} />
                <Button type="submit">Send</Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
