import type { AutomationBacklogTestCase } from '@/api/schemas'

export const mockAutomationBacklog: AutomationBacklogTestCase[] = [
  {
    id: 'a1f2c3d4-e5f6-7890-abcd-ef1234567890',
    caseId: 'TC-1042',
    title: 'Partial refund shows correct balance on checkout',
    sourceSystem: 'jira',
    sourceReference: 'QA-1042',
    storyKey: 'PAY-88',
    storyTitle: 'Checkout partial refunds',
    testDesignRunId: 'tdr_auth4',
    automationStatus: 'not_automated',
    targetArea: 'tests/e2e/checkout',
    objective:
      'Verify partial refund updates the displayed balance after checkout.',
    stepsPreview:
      'Open checkout → apply partial refund → assert balance label shows $12.00',
    approvedAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-18T14:22:00Z',
  },
  {
    id: 'b2e3d4c5-f6a7-8901-bcde-f12345678901',
    caseId: 'TC-1108',
    title: 'Inventory low-stock banner appears for SKU below threshold',
    sourceSystem: 'jira',
    sourceReference: 'QA-1108',
    storyKey: 'INV-12',
    storyTitle: 'Inventory alerts',
    automationStatus: 'not_automated',
    targetArea: 'tests/e2e/inventory',
    objective: 'Show warning banner when on-hand quantity drops below 5 units.',
    stepsPreview:
      'Seed SKU with qty 3 → open inventory page → expect low-stock banner',
    approvedAt: '2026-07-12T11:30:00Z',
    updatedAt: '2026-07-19T08:15:00Z',
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    caseId: 'TC-0981',
    title: 'Login redirects authenticated user to dashboard',
    sourceSystem: 'qswarm_ui',
    sourceReference: 'login-redirect-smoke',
    storyKey: 'AUTH-4',
    storyTitle: 'Login happy path',
    automationStatus: 'in_progress',
    targetArea: 'tests/e2e/auth',
    sessionId: 'sess_demo',
    objective: 'Authenticated users land on /dashboard after successful login.',
    stepsPreview: 'Enter valid credentials → submit → URL contains /dashboard',
    approvedAt: '2026-07-05T16:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
    caseId: 'TC-0770',
    title: 'Export CSV includes filtered transaction rows',
    sourceSystem: 'jira',
    sourceReference: 'QA-0770',
    storyKey: 'RPT-21',
    storyTitle: 'Reporting exports',
    automationStatus: 'automated',
    targetArea: 'tests/e2e/reports',
    sessionId: '510aa916-6f31-421f-93b7-76bcfe3a0c75',
    objective: 'CSV export respects active date-range filter.',
    approvedAt: '2026-06-28T12:00:00Z',
    updatedAt: '2026-07-01T09:45:00Z',
  },
]

export function findMockTestCase(id: string): AutomationBacklogTestCase | undefined {
  return mockAutomationBacklog.find((tc) => tc.id === id)
}
