import type { JiraStory } from '@/api/schemas'

export const LIVE_STORY_LIST_FIXTURE = {
  stories: [
    {
      storyKey: 'STUB-1',
      title: 'Stub result for JQL...',
      description: 'Stub Jira issue...',
      status: 'Open',
      sprint: null,
      projectKey: 'STUB',
      assignee: null,
      readiness: 'partial' as const,
      acceptanceCriteriaStatus: 'partial' as const,
      missingInformation: ['Few explicit acceptance criteria were found'],
      hasActiveRun: false,
      activeRunId: null,
      jiraUrl: 'https://usfoods.atlassian.net/browse/STUB-1',
    },
  ],
  total: 1,
}

export const mockJiraStories: JiraStory[] = [
  {
    storyKey: 'PAY-88',
    title: 'Checkout partial refunds',
    description: 'As a shopper, I can receive a partial refund during checkout.',
    status: 'In Progress',
    sprint: 'Sprint 24',
    projectKey: 'PAY',
    assignee: 'Alex Kim',
    readiness: 'ready',
    acceptanceCriteriaStatus: 'ready',
    missingInformation: [],
    hasActiveRun: false,
    activeRunId: null,
    jiraUrl: 'https://jira.example.com/browse/PAY-88',
  },
  {
    storyKey: 'INV-12',
    title: 'Inventory alerts',
    description: 'Show low-stock alerts on the inventory detail page.',
    status: 'Ready for QA',
    sprint: 'Sprint 24',
    projectKey: 'INV',
    assignee: 'Sam Rivera',
    readiness: 'partial',
    acceptanceCriteriaStatus: 'partial',
    missingInformation: ['Threshold value for low-stock banner not specified'],
    hasActiveRun: true,
    activeRunId: 'tdr_inv12',
    jiraUrl: 'https://jira.example.com/browse/INV-12',
  },
  {
    storyKey: 'AUTH-4',
    title: 'Login happy path',
    description: 'Authenticated users are redirected to the dashboard.',
    status: 'Done',
    sprint: 'Sprint 23',
    projectKey: 'AUTH',
    assignee: null,
    readiness: 'ready',
    acceptanceCriteriaStatus: 'ready',
    missingInformation: [],
    hasActiveRun: false,
    activeRunId: null,
    jiraUrl: 'https://jira.example.com/browse/AUTH-4',
  },
  {
    storyKey: 'RPT-21',
    title: 'Reporting exports',
    description: 'Export filtered transaction rows to CSV.',
    status: 'In Review',
    sprint: null,
    projectKey: 'RPT',
    assignee: null,
    readiness: 'missing_ac',
    acceptanceCriteriaStatus: 'missing_ac',
    missingInformation: [
      'No acceptance criteria in Jira',
      'Export format not defined',
    ],
    hasActiveRun: false,
    activeRunId: null,
    jiraUrl: 'https://jira.example.com/browse/RPT-21',
  },
  {
    storyKey: 'PAY-92',
    title: 'Refund eligibility rules',
    description: 'Define eligibility rules for partial refunds.',
    status: 'To Do',
    sprint: 'Sprint 25',
    projectKey: 'PAY',
    assignee: 'Jordan Lee',
    readiness: 'ready',
    acceptanceCriteriaStatus: 'ready',
    missingInformation: [],
    hasActiveRun: false,
    activeRunId: null,
    jiraUrl: 'https://jira.example.com/browse/PAY-92',
  },
]

export function findMockStory(storyKey: string): JiraStory | undefined {
  return mockJiraStories.find((s) => s.storyKey === storyKey)
}

export function uniqueProjectKeys(stories: JiraStory[]): string[] {
  return [...new Set(stories.map((s) => s.projectKey))].sort()
}
