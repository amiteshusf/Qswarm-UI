import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import {
  useBranchPolicy,
  useCreateBranchPolicy,
  useRepoConnections,
  useUpdateBranchPolicy,
} from '@/api/hooks'
import { branchPolicyInputSchema } from '@/api/schemas'
import type { BranchPolicyInput } from '@/api/schemas'
import { FormField } from '@/components/patterns/form-field'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { LinkButton } from '@/components/ui/link-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

export function BranchPolicyFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const repos = useRepoConnections()
  const existing = useBranchPolicy(isNew ? undefined : id)
  const create = useCreateBranchPolicy()
  const update = useUpdateBranchPolicy(id ?? '')

  const form = useForm<BranchPolicyInput>({
    resolver: zodResolver(branchPolicyInputSchema),
    values: existing.data
      ? {
          name: existing.data.name,
          baseBranch: existing.data.baseBranch,
          branchPattern: existing.data.branchPattern,
          prTitleTemplate: existing.data.prTitleTemplate,
          prBodyTemplate: existing.data.prBodyTemplate,
          repoConnectionId: existing.data.repoConnectionId,
        }
      : {
          name: '',
          baseBranch: 'main',
          branchPattern: 'qswarm/{session}',
          prTitleTemplate: '[QSwarm] {source} — session {session}',
          prBodyTemplate:
            'Automated QA session.\n\n**Source:** {source}\n**Engine:** {engine}\n',
          repoConnectionId: undefined,
        },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isNew) {
        const row = await create.mutateAsync(values)
        toast.success('Policy saved')
        navigate(`/branch-policies/${row.id}`)
      } else {
        await update.mutateAsync(values)
        toast.success('Policy updated')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Branch policies"
        title={isNew ? 'New policy' : 'Edit policy'}
        description="Templates can include placeholders such as {session}, {source}, and {engine}—your backend decides final substitution."
        actions={
          <LinkButton variant="ghost" to="/branch-policies">
            Back
          </LinkButton>
        }
      />
      {!isNew && existing.isError ? (
        <QueryErrorAlert
          error={existing.error}
          onRetry={() => void existing.refetch()}
        />
      ) : null}
      {!isNew && existing.isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-xl" />
      ) : (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={onSubmit}>
              <FormField
                id="name"
                label="Policy name"
                hint="Internal label for QA teams."
                error={form.formState.errors.name?.message}
              >
                <Input id="name" {...form.register('name')} />
              </FormField>
              <FormField
                id="repoConnectionId"
                label="Repository scope (optional)"
                hint="Limit this policy to a single connection, or leave unset for org-wide defaults."
              >
                <Select
                  value={form.watch('repoConnectionId') ?? '__none__'}
                  onValueChange={(v) =>
                    form.setValue(
                      'repoConnectionId',
                      v === '__none__' || v == null ? undefined : v,
                    )
                  }
                >
                  <SelectTrigger id="repoConnectionId" className="w-full">
                    <SelectValue placeholder="Any repository" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Any repository</SelectItem>
                    {repos.data?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.displayName ?? `${r.owner}/${r.repo}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  id="baseBranch"
                  label="Base branch"
                  hint="Branch PRs should target."
                  error={form.formState.errors.baseBranch?.message}
                >
                  <Input id="baseBranch" {...form.register('baseBranch')} />
                </FormField>
                <FormField
                  id="branchPattern"
                  label="Branch naming pattern"
                  hint="Use {session} where the session id should appear."
                  error={form.formState.errors.branchPattern?.message}
                >
                  <Input id="branchPattern" {...form.register('branchPattern')} />
                </FormField>
              </div>
              <FormField
                id="prTitleTemplate"
                label="PR title template"
                error={form.formState.errors.prTitleTemplate?.message}
              >
                <Input id="prTitleTemplate" {...form.register('prTitleTemplate')} />
              </FormField>
              <FormField
                id="prBodyTemplate"
                label="PR body template"
                hint="Markdown-friendly. Shown in the create-PR confirmation preview when available."
                error={form.formState.errors.prBodyTemplate?.message}
              >
                <Textarea
                  id="prBodyTemplate"
                  rows={6}
                  {...form.register('prBodyTemplate')}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <LinkButton variant="ghost" to="/branch-policies">
                  Cancel
                </LinkButton>
                <Button type="submit" disabled={create.isPending || update.isPending}>
                  {isNew ? 'Create' : 'Save changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
