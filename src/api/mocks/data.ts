import type {
  BranchPolicy,
  Dashboard,
  RepoConnection,
  SessionDetail,
  SessionSummary,
  Settings,
} from '@/api/schemas'

const now = new Date().toISOString()

export const mockRepoConnections: RepoConnection[] = [
  {
    id: 'rc_demo',
    provider: 'github',
    ownerOrOrg: 'acme',
    repoName: 'payments-api',
    projectOrWorkspace: null,
    displayName: 'Payments API',
    cloneUrl: 'https://github.com/acme/payments-api.git',
    defaultBranch: 'main',
    authType: 'github_pat_env',
    credentialReference: 'vault:github/acme-bot',
    isActive: true,
    createdBy: 'mock',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'rc_demo_2',
    provider: 'gitlab',
    ownerOrOrg: 'acme',
    repoName: 'mobile-clients',
    projectOrWorkspace: null,
    defaultBranch: 'develop',
    authType: 'ssh',
    credentialReference: null,
    isActive: true,
    createdBy: 'mock',
    createdAt: now,
    updatedAt: now,
  },
]

export const mockBranchPolicies: BranchPolicy[] = [
  {
    id: 'bp_main',
    name: 'Mainline QA',
    baseBranch: 'main',
    branchPattern: 'qswarm/{session}',
    prTitleTemplate: '[QSwarm] {source} — session {session}',
    prBodyTemplate:
      'Automated QA session.\n\n**Source:** {source}\n**Engine:** {engine}\n',
    repoConnectionId: 'rc_demo',
    createdAt: now,
    updatedAt: now,
  },
]

export const mockSessionDetail: SessionDetail = {
  id: 'sess_demo',
  status: 'awaiting_review',
  engine: 'qswarm-gpt-4.1',
  repoConnectionId: 'rc_demo',
  branchPolicyId: 'bp_main',
  sourceRef: 'ticket/OPS-4412',
  sourceLabel: 'OPS-4412 · flaky checkout',
  createdAt: now,
  updatedAt: now,
  rounds: [
    {
      id: 'r1',
      number: 1,
      title: 'Understand failure & scope',
      status: 'complete',
      startedAt: now,
      finishedAt: now,
      notes: 'Mapped failing path to cart service.',
    },
    {
      id: 'r2',
      number: 2,
      title: 'Implement guard + tests',
      status: 'active',
      startedAt: now,
      notes: 'Patch staged; execution running.',
    },
  ],
  patches: [
    {
      id: 'p1',
      version: 1,
      label: 'Initial hypothesis',
      createdAt: now,
      filesChanged: 4,
      additions: 62,
      deletions: 11,
    },
    {
      id: 'p2',
      version: 2,
      label: 'Harden validation + tests',
      createdAt: now,
      filesChanged: 6,
      additions: 118,
      deletions: 24,
    },
  ],
  executions: [
    {
      id: 'ex1',
      roundNumber: 1,
      status: 'passed',
      startedAt: now,
      finishedAt: now,
      summary: 'Unit + contract tests passed (42 suites).',
      exitCode: 0,
    },
    {
      id: 'ex2',
      roundNumber: 2,
      status: 'running',
      startedAt: now,
      summary: 'Running integration matrix…',
    },
  ],
  reviews: [
    {
      id: 'rev1',
      createdAt: now,
      instruction: 'Add coverage for partial refund edge case.',
      scope: 'services/refunds',
      status: 'addressed',
    },
  ],
  latestExecutionSummary: 'Running integration matrix…',
  patchSummary: '6 files · +118 / −24 — hardens refund validation.',
  prPreviewTitle: '[QSwarm] OPS-4412 — session sess_demo',
  prPreviewBody:
    'Automated QA session.\n\n**Source:** OPS-4412 · flaky checkout\n**Engine:** qswarm-gpt-4.1\n',
}

const summaries: SessionSummary[] = [
  {
    id: mockSessionDetail.id,
    status: mockSessionDetail.status,
    engine: mockSessionDetail.engine,
    repoConnectionId: mockSessionDetail.repoConnectionId,
    sourceRef: mockSessionDetail.sourceRef,
    sourceLabel: mockSessionDetail.sourceLabel,
    createdAt: mockSessionDetail.createdAt,
    updatedAt: mockSessionDetail.updatedAt,
  },
  {
    id: 'sess_queued',
    status: 'queued',
    engine: mockSessionDetail.engine,
    repoConnectionId: mockSessionDetail.repoConnectionId,
    sourceRef: 'pr/884',
    sourceLabel: 'PR #884',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sess_run',
    status: 'running',
    engine: mockSessionDetail.engine,
    repoConnectionId: mockSessionDetail.repoConnectionId,
    sourceRef: 'slack/C09AB3',
    sourceLabel: 'Slack thread',
    createdAt: now,
    updatedAt: now,
  },
]

export const mockDashboard: Dashboard = {
  sessionCounts: {
    draft: 1,
    queued: 2,
    running: 3,
    awaiting_review: 2,
    revising: 0,
    succeeded: 14,
    failed: 1,
    cancelled: 0,
  },
  recentSessions: summaries,
}

export const mockSettings: Settings = {
  applicationName: 'qswarm-web-mock',
  environment: 'development',
  debug: true,
  jira: { useStub: true, configured: false },
  codingProvider: 'stub',
  workspaceRoot: '/tmp/qswarm',
  claudeCodeEnabled: false,
  copilotAgentEnabled: false,
  notes: 'Mock settings mirror the read-only GET /api/v1/settings shape.',
}
