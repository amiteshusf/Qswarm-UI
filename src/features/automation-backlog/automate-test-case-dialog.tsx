import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type {
  AutomationBacklogTestCase,
  AutomateTestCaseFormValues,
} from '@/api/schemas'
import { FormField } from '@/components/patterns/form-field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BranchPolicy, RepoConnection } from '@/api/schemas'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  testCase: AutomationBacklogTestCase | null
  repos: RepoConnection[]
  policies: BranchPolicy[]
  defaultEngine: string
  pending: boolean
  onSubmit: (values: AutomateTestCaseFormValues) => void
}

export function AutomateTestCaseDialog({
  open,
  onOpenChange,
  testCase,
  repos,
  policies,
  defaultEngine,
  pending,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<AutomateTestCaseFormValues>({
    repositoryConnectionId: '',
    branchPolicyId: undefined,
    engine: defaultEngine,
  })

  useEffect(() => {
    if (!open || !testCase) return
    setForm({
      repositoryConnectionId: testCase.repoConnectionId ?? repos[0]?.id ?? '',
      branchPolicyId: testCase.branchPolicyId,
      engine: defaultEngine,
    })
  }, [open, testCase, repos, defaultEngine])

  const filteredPolicies = useMemo(
    () =>
      policies.filter((p) => p.repoConnectionId === form.repositoryConnectionId),
    [policies, form.repositoryConnectionId],
  )

  const canSubmit =
    Boolean(testCase) &&
    Boolean(form.repositoryConnectionId) &&
    Boolean(form.engine) &&
    !pending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Automate test case</DialogTitle>
          <DialogDescription>
            QSwarm will create an automation session for{' '}
            <strong>{testCase?.title ?? 'this test case'}</strong>, then guide
            you through plan review before running.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!repos.length ? (
            <p className="text-muted-foreground text-sm">
              Connect a repository before automating a test case.
            </p>
          ) : (
            <>
              <FormField id="repositoryConnectionId" label="Repository">
                <Select
                  value={form.repositoryConnectionId}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      repositoryConnectionId: typeof v === 'string' ? v : '',
                      branchPolicyId: undefined,
                    }))
                  }
                >
                  <SelectTrigger id="repositoryConnectionId" className="w-full">
                    <SelectValue placeholder="Select repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.id}>
                        {repo.displayName ?? repo.repoName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField id="branchPolicyId" label="Branch policy">
                <Select
                  value={form.branchPolicyId ?? '__none__'}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      branchPolicyId:
                        typeof v === 'string' && v !== '__none__' ? v : undefined,
                    }))
                  }
                >
                  <SelectTrigger id="branchPolicyId" className="w-full">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {filteredPolicies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField id="engine" label="Engine">
                <Select
                  value={form.engine}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      engine: typeof v === 'string' ? v : f.engine,
                    }))
                  }
                >
                  <SelectTrigger id="engine" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stub">Stub (local)</SelectItem>
                    <SelectItem value="copilot_agent">Copilot agent</SelectItem>
                    <SelectItem value="claude_code">Claude Code</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={() => onSubmit(form)}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Starting…
              </>
            ) : (
              'Automate test case'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
