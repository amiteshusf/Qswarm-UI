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
  })
}

export function useCreateSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createSession,
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: qk.sessions() })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
      void qc.invalidateQueries({ queryKey: qk.session(data.id) })
    },
  })
}

export function useStartSession(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.startSession(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.session(id) })
      void qc.invalidateQueries({ queryKey: qk.sessions() })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useRequestRevision(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: unknown) => api.requestRevision(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.session(id) })
      void qc.invalidateQueries({ queryKey: qk.sessions() })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useApproveSession(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.approveSession(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.session(id) })
      void qc.invalidateQueries({ queryKey: qk.sessions() })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useCreatePr(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.createPr(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.session(id) })
      void qc.invalidateQueries({ queryKey: qk.sessions() })
      void qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: () => api.getSettings(),
  })
}
