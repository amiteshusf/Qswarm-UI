import type { JiraStory } from '@/api/schemas'
import { jiraStorySchema } from '@/api/schemas'
import { jiraStoryDetailWireSchema } from '@/api/wire-schemas'

export function adaptJiraStoryDetail(wire: unknown): JiraStory {
  const parsed = jiraStoryDetailWireSchema.parse(wire)
  const projectKey =
    parsed.projectKey ?? parsed.storyKey.split('-')[0] ?? 'UNKNOWN'
  return jiraStorySchema.parse({
    storyKey: parsed.storyKey,
    title: parsed.title,
    description: parsed.description ?? '',
    status: parsed.status ?? 'Open',
    sprint: parsed.sprint ?? null,
    projectKey,
    assignee: parsed.assignee ?? null,
    readiness: parsed.readiness ?? 'partial',
    acceptanceCriteriaStatus:
      parsed.acceptanceCriteriaStatus ?? parsed.readiness ?? 'partial',
    missingInformation: parsed.missingInformation ?? [],
    hasActiveRun: parsed.hasActiveRun ?? Boolean(parsed.activeWorkflowRunId),
    activeRunId: parsed.activeRunId ?? parsed.activeWorkflowRunId ?? null,
    jiraUrl:
      parsed.jiraUrl ??
      `https://usfoods.atlassian.net/browse/${parsed.storyKey}`,
  })
}
