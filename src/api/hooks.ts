import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/api/client'
import { qk } from '@/lib/query-keys'

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: () => api.getDashboard() })
}

export function useRepoConnections() {
  return useQuery({
    queryKey: qk.repoConnections,
    queryFn: () => api.listRepoConnections(),
  })
}

export function useRepoConnection(id: string | undefined) {
  return useQuery({
    queryKey: qk.repoConnection(id ?? ''),
    queryFn: () => api.getRepoConnection(id!),
    enabled: Boolean(id),
  })
}

export function useCreateRepoConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createRepoConnection,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.repoConnections })
    },
  })
}

export function useUpdateRepoConnection(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.updateRepoConnection(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.repoConnections })
      void qc.invalidateQueries({ queryKey: qk.repoConnection(id) })
    },
  })
}

export function useBranchPolicies() {
  return useQuery({
    queryKey: qk.branchPolicies,
    queryFn: () => api.listBranchPolicies(),
  })
}

export function useBranchPolicy(id: string | undefined) {
  return useQuery({
    queryKey: qk.branchPolicy(id ?? ''),
    queryFn: () => api.getBranchPolicy(id!),
    enabled: Boolean(id),
  })
}

export function useCreateBranchPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createBranchPolicy,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.branchPolicies })
    },
  })
}

export function useUpdateBranchPolicy(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.updateBranchPolicy(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.branchPolicies })
      void qc.invalidateQueries({ queryKey: qk.branchPolicy(id) })
    },
  })
}

export function useSessions(filters?: { status?: string }) {
  return useQuery({
    queryKey: qk.sessions(filters),
    queryFn: () => api.listSessions(filters),
  })
}

export function useSession(id: string | undefined) {
  return useQuery({
    queryKey: qk.session(id ?? ''),
    queryFn: () => api.getSession(id!),
    enabled: Boolean(id),
    refetchOnMount: 'always',
  })
}

export function useSessionBrief(id: string | undefined) {
  return useQuery({
    queryKey: qk.sessionBrief(id ?? ''),
    queryFn: () => api.getSessionBrief(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
}

export function useSessionReviewData(id: string | undefined) {
  return useQuery({
    queryKey: qk.sessionReviewData(id ?? ''),
    queryFn: () => api.getSessionReviewData(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
    refetchOnMount: 'always',
  })
}

function invalidateSessionQueries(qc: ReturnType<typeof useQueryClient>, id: string) {
  void qc.invalidateQueries({ queryKey: qk.session(id) })
  void qc.invalidateQueries({ queryKey: qk.sessionBrief(id) })
  void qc.invalidateQueries({ queryKey: qk.sessionReviewData(id) })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createSession,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, data.id)
    },
  })
}

export function usePreparePlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.preparePlan(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useApprovePlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.approvePlan(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useRequestPlanRevision(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.requestPlanRevision(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useStartSession(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (opts?: { repositoryConnectionId?: string }) =>
      api.startSession(id, opts),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useRequestRevision(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.requestRevision(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useApproveSession(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.approveSession(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useCreatePr(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (repositoryConnectionId: string) =>
      api.createPr(id, repositoryConnectionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, id)
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: () => api.getSettings(),
  })
}

export function useAutomationBacklog(filters?: {
  q?: string
  status?: string
}) {
  return useQuery({
    queryKey: qk.automationBacklog(filters),
    queryFn: () => api.listAutomationBacklog(filters),
    staleTime: 20_000,
  })
}

export function useTestCase(id: string | undefined) {
  return useQuery({
    queryKey: qk.testCase(id ?? ''),
    queryFn: () => api.getTestCase(id!),
    enabled: Boolean(id),
  })
}

export function useAutomateTestCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      testCaseId,
      input,
    }: {
      testCaseId: string
      input: unknown
    }) => api.automateTestCase(testCaseId, input),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['automation-backlog'] })
      void qc.invalidateQueries({ queryKey: ['sessions'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      invalidateSessionQueries(qc, data.id)
    },
  })
}

function invalidateTestDesignQueries(qc: ReturnType<typeof useQueryClient>, id: string) {
  void qc.invalidateQueries({ queryKey: qk.testDesignRun(id) })
  void qc.invalidateQueries({ queryKey: qk.testDesignAnalysis(id) })
  void qc.invalidateQueries({ queryKey: qk.testDesignPlan(id) })
  void qc.invalidateQueries({ queryKey: qk.testDesignReviewData(id) })
}

export function useStories(filters?: {
  q?: string
  project?: string
  sprint?: string
  status?: string
  readiness?: string
}) {
  return useQuery({
    queryKey: qk.stories(filters),
    queryFn: () => api.listStories(filters),
    staleTime: 20_000,
  })
}

export function useStory(key: string | undefined) {
  return useQuery({
    queryKey: qk.story(key ?? ''),
    queryFn: () => api.getStory(key!),
    enabled: Boolean(key),
  })
}

export function useCreateTestDesignRun() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (storyKey: string) => api.createTestDesignRun(storyKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['stories'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useTestDesignRun(id: string | undefined) {
  return useQuery({
    queryKey: qk.testDesignRun(id ?? ''),
    queryFn: () => api.getTestDesignRun(id!),
    enabled: Boolean(id),
    refetchOnMount: 'always',
  })
}

export function useRequirementAnalysis(
  runId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: qk.testDesignAnalysis(runId ?? ''),
    queryFn: () => api.getRequirementAnalysis(runId!),
    enabled: Boolean(runId) && enabled,
  })
}

export function useTestDesignPlan(runId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: qk.testDesignPlan(runId ?? ''),
    queryFn: () => api.getTestDesignPlan(runId!),
    enabled: Boolean(runId) && enabled,
  })
}

export function useTestDesignReviewData(
  runId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: qk.testDesignReviewData(runId ?? ''),
    queryFn: () => api.getTestDesignReviewData(runId!),
    enabled: Boolean(runId) && enabled,
  })
}

export function useAnalyzeRequirements(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.analyzeRequirements(runId),
    onSuccess: () => {
      invalidateTestDesignQueries(qc, runId)
      void qc.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

export function usePrepareTestDesignPlan(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.prepareTestDesignPlan(runId),
    onSuccess: () => invalidateTestDesignQueries(qc, runId),
  })
}

export function useApproveTestDesignPlan(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.approveTestDesignPlan(runId),
    onSuccess: () => invalidateTestDesignQueries(qc, runId),
  })
}

export function useRequestTestDesignPlanRevision(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.requestTestDesignPlanRevision(runId, input),
    onSuccess: () => invalidateTestDesignQueries(qc, runId),
  })
}

export function useGenerateTestCases(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.generateTestCases(runId),
    onSuccess: () => invalidateTestDesignQueries(qc, runId),
  })
}

export function useRequestTestCaseRevision(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.requestTestCaseRevision(runId, input),
    onSuccess: () => invalidateTestDesignQueries(qc, runId),
  })
}

export function useApproveTestDesign(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.approveTestDesign(runId),
    onSuccess: () => invalidateTestDesignQueries(qc, runId),
  })
}

export function usePublishTestCases(runId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.publishTestCases(runId),
    onSuccess: () => {
      invalidateTestDesignQueries(qc, runId)
      void qc.invalidateQueries({ queryKey: ['automation-backlog'] })
      void qc.invalidateQueries({ queryKey: ['stories'] })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}
