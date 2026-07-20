import { formatDistanceToNow } from 'date-fns'
import { Bot, CheckCircle2, GitPullRequest, User, Zap } from 'lucide-react'

import type {
  ReviewConversationMessage,
  SessionDetail,
  SessionReviewData,
} from '@/api/schemas'
import { cn } from '@/lib/utils'

type Props = {
  session: SessionDetail
  reviewData?: SessionReviewData | null
}

export function ReviewConversationPanel({ session, reviewData }: Props) {
  const messages = reviewData?.reviewConversation?.length
    ? mapLiveConversation(reviewData.reviewConversation)
    : buildFallbackConversation(session)

  return (
    <div className="border-border/70 bg-surface flex min-h-[240px] flex-col rounded-2xl border shadow-sm">
      <div className="border-border/60 border-b px-4 py-3">
        <p className="font-medium">Review conversation</p>
        <p className="text-muted-foreground text-xs">
          {reviewData?.reviewConversation?.length
            ? 'Live thread from automation and your instructions'
            : 'Instructions you send and automation responses'}
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
            <ConversationBubble key={msg.id} message={msg} />
          ))
        )}
      </div>
    </div>
  )
}

type UiMessage = {
  id: string
  role: 'user' | 'agent' | 'system'
  body: string
  at: string
  scope?: string
  status?: string
  kind?: string
}

function ConversationBubble({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user'
  const Icon =
    message.kind === 'pr_created'
      ? GitPullRequest
      : message.kind === 'execution_result'
        ? Zap
        : message.kind === 'approve'
          ? CheckCircle2
          : isUser
            ? User
            : Bot

  return (
    <div
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
            : 'bg-muted/50 text-foreground border-border/50 border',
        )}
      >
        <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase tracking-wide">
          {labelForMessage(message)}
          {' · '}
          {formatDistanceToNow(new Date(message.at), { addSuffix: true })}
        </p>
        <p className="whitespace-pre-wrap">{message.body}</p>
        {message.scope ? (
          <p className="text-muted-foreground mt-2 font-mono text-xs">
            Scope: {message.scope}
          </p>
        ) : null}
        {message.status ? (
          <p className="text-muted-foreground mt-1 text-xs capitalize">
            {message.status}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function labelForMessage(msg: UiMessage): string {
  if (msg.role === 'user') return 'You'
  if (msg.kind === 'execution_result') return 'Validation'
  if (msg.kind === 'pr_created') return 'Pull request'
  if (msg.kind === 'approve') return 'Approval'
  if (msg.kind === 'request_revision') return 'Change request'
  return 'QSwarm'
}

function mapLiveConversation(
  items: ReviewConversationMessage[],
): UiMessage[] {
  return items.map((item) => ({
    id: item.id,
    role: userTypes.has(item.type) ? 'user' : 'agent',
    body: item.text,
    at: item.createdAt,
    scope: item.scope,
    status: item.status,
    kind: item.type,
  }))
}

const userTypes = new Set([
  'request_revision',
  'approve',
  'user',
])

function buildFallbackConversation(session: SessionDetail): UiMessage[] {
  const items: UiMessage[] = []

  for (const rev of session.reviews) {
    items.push({
      id: rev.id,
      role: 'user',
      body: rev.instruction,
      at: rev.createdAt,
      scope: rev.scope,
      status: rev.status,
      kind: 'request_revision',
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
