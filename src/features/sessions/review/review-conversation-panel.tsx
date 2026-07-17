import { formatDistanceToNow } from 'date-fns'
import { Bot, User } from 'lucide-react'

import type { SessionDetail } from '@/api/schemas'
import { cn } from '@/lib/utils'

type Props = {
  session: SessionDetail
}

export function ReviewConversationPanel({ session }: Props) {
  const messages = buildConversation(session)

  return (
    <div className="border-border/70 bg-surface flex min-h-[240px] flex-col rounded-2xl border shadow-sm">
      <div className="border-border/60 border-b px-4 py-3">
        <p className="font-medium">Review conversation</p>
        <p className="text-muted-foreground text-xs">
          Instructions you send and automation responses
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No messages yet. Use the composer below to guide the agent when
            review is ready.
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <div
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full',
                  msg.role === 'user'
                    ? 'bg-swarm/15 text-swarm'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {msg.role === 'user' ? (
                  <User className="size-4" />
                ) : (
                  <Bot className="size-4" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-swarm/12 text-foreground'
                    : 'bg-muted/50 text-foreground border-border/50 border',
                )}
              >
                <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">
                  {msg.role === 'user' ? 'You' : 'QSwarm agent'}
                  {' · '}
                  {formatDistanceToNow(new Date(msg.at), { addSuffix: true })}
                </p>
                <p>{msg.body}</p>
                {msg.scope ? (
                  <p className="text-muted-foreground mt-2 font-mono text-xs">
                    Scope: {msg.scope}
                  </p>
                ) : null}
                {msg.status ? (
                  <p className="text-muted-foreground mt-1 text-xs capitalize">
                    {msg.status}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function buildConversation(session: SessionDetail) {
  const items: Array<{
    id: string
    role: 'user' | 'agent'
    body: string
    at: string
    scope?: string
    status?: string
  }> = []

  for (const rev of session.reviews) {
    items.push({
      id: rev.id,
      role: 'user',
      body: rev.instruction,
      at: rev.createdAt,
      scope: rev.scope,
      status: rev.status,
    })
  }

  if (session.patchSummary && session.reviews.length > 0) {
    items.push({
      id: 'agent-summary',
      role: 'agent',
      body: `Updated the codebase: ${session.patchSummary}`,
      at: session.updatedAt,
    })
  }

  return items.sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  )
}
