import type { JiraStory } from '@/api/schemas'

export type StoryRowAction = 'open_run' | 'start_test_design'

export function resolveStoryRowAction(story: JiraStory): StoryRowAction {
  if (story.hasActiveRun && story.activeRunId) return 'open_run'
  return 'start_test_design'
}

export function storyRowActionLabel(action: StoryRowAction): string {
  return action === 'open_run' ? 'Open run' : 'Start test design'
}

const AC_STATUS_LABELS = {
  ready: 'Ready',
  partial: 'Partial AC',
  missing_ac: 'Missing AC',
} as const

export function acceptanceCriteriaStatusLabel(
  status: JiraStory['acceptanceCriteriaStatus'],
): string {
  return AC_STATUS_LABELS[status]
}

export function formatMissingInformationSummary(
  missingInformation: string[],
): string | null {
  if (missingInformation.length === 0) return null
  const first = missingInformation[0]
  if (missingInformation.length === 1) return first
  return `${first} (+${missingInformation.length - 1} more)`
}

export function deriveProjectsFromStories(
  stories: JiraStory[],
): Array<{ key: string; name: string }> {
  const keys = [...new Set(stories.map((s) => s.projectKey))].sort()
  return keys.map((key) => ({ key, name: key }))
}

export function formatStoryMetaLine(story: JiraStory): string {
  const parts = [story.projectKey]
  if (story.sprint) parts.push(story.sprint)
  if (story.assignee) parts.push(story.assignee)
  return parts.join(' · ')
}
