import { formatDistanceToNow } from 'date-fns'
import { Bot, User } from 'lucide-react'

import type { TestDesignReviewData } from '@/api/schemas'
import { cn } from '@/lib/utils'

type Props = {
  reviewData: TestDesignReviewData
  className?: string
}

export function TestDesignConversationPanel({
  reviewData,
  className,
}: Props) {
  const messages = reviewData.reviewConversation ?? []

  return (
    <div
      className={cn(
        'border-border/70 bg-surface flex min-h-[240px] flex-col rounded-2xl border shadow-sm',
        className,
      )}
    >
      <div className="border-border/60 border-b px-4 py-3">
        <p className="font-medium">Review conversation</p>
        <p className="text-muted-foreground text-xs">
          Instructions and QSwarm responses for test-case revisions
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No messages yet. Request changes when test cases are ready for
            review.
          </p>
        ) : (
          messages.map((msg) => {
            const isUser =
              msg.type === 'request_revision' || msg.actor === 'reviewer'
            const Icon = isUser ? User : Bot
            return (
              <div
                key={msg.id}
                className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    isUser
                      ? 'bg-swarm/15 text-swarm'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    isUser
                      ? 'bg-swarm/12 text-foreground'
                      : 'bg-muted/50 border-border/50 border',
                  )}
                >
                  <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">
                    {isUser ? 'You' : 'QSwarm'} ·{' '}
                    {formatDistanceToNow(new Date(msg.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
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
            )
          })
        )}
      </div>
    </div>
  )
}
