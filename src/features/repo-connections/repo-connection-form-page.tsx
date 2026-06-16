import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useCreateRepoConnection,
  useRepoConnection,
  useUpdateRepoConnection,
} from '@/api/hooks'
import { repoConnectionInputSchema } from '@/api/schemas'
import type { RepoConnectionInput } from '@/api/schemas'
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
import { Skeleton } from '@/components/ui/skeleton'

export function RepoConnectionFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const existing = useRepoConnection(isNew ? undefined : id)
  const create = useCreateRepoConnection()
  const update = useUpdateRepoConnection(id ?? '')

  const form = useForm<RepoConnectionInput>({
    resolver: zodResolver(repoConnectionInputSchema),
    values: existing.data
      ? {
          provider: existing.data.provider,
          owner: existing.data.owner,
          repo: existing.data.repo,
          displayName: existing.data.displayName,
          cloneUrl: existing.data.cloneUrl ?? '',
          defaultBranch: existing.data.defaultBranch,
          authRef: existing.data.authRef,
        }
      : {
          provider: 'github',
          owner: '',
          repo: '',
          displayName: '',
          cloneUrl: '',
          defaultBranch: 'main',
          authRef: '',
        },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isNew) {
        const row = await create.mutateAsync(values)
        toast.success('Connection saved')
        navigate(`/repo-connections/${row.id}`)
      } else {
        await update.mutateAsync(values)
        toast.success('Connection updated')
      }
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  })

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        eyebrow="Repositories"
        title={isNew ? 'New connection' : 'Edit connection'}
        description="Use a vault/KMS reference for credentials—never paste secrets into this UI."
        actions={
          <LinkButton variant="ghost" to="/repo-connections">
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
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={onSubmit}>
              <FormField
                id="provider"
                label="Provider"
                hint="Where the remote repository is hosted."
                error={form.formState.errors.provider?.message}
              >
                <Select
                  value={form.watch('provider')}
                  onValueChange={(v) =>
                    form.setValue('provider', v as RepoConnectionInput['provider'])
                  }
                >
                  <SelectTrigger id="provider" className="w-full">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="gitlab">GitLab</SelectItem>
                    <SelectItem value="bitbucket">Bitbucket</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  id="owner"
                  label="Owner / organization"
                  hint="Namespace that owns the repository."
                  error={form.formState.errors.owner?.message}
                >
                  <Input id="owner" {...form.register('owner')} autoComplete="off" />
                </FormField>
                <FormField
                  id="repo"
                  label="Repository"
                  hint="Short repository name (without org)."
                  error={form.formState.errors.repo?.message}
                >
                  <Input id="repo" {...form.register('repo')} autoComplete="off" />
                </FormField>
              </div>
              <FormField
                id="displayName"
                label="Display name"
                hint="Optional friendly label shown in QSwarm."
                error={form.formState.errors.displayName?.message}
              >
                <Input id="displayName" {...form.register('displayName')} />
              </FormField>
              <FormField
                id="cloneUrl"
                label="Clone URL"
                hint="HTTPS or SSH clone URL if you want QSwarm to skip inference."
                error={form.formState.errors.cloneUrl?.message}
              >
                <Input id="cloneUrl" {...form.register('cloneUrl')} placeholder="https://..." />
              </FormField>
              <FormField
                id="defaultBranch"
                label="Default branch"
                hint="Branch QSwarm should treat as the integration line unless a session overrides it."
                error={form.formState.errors.defaultBranch?.message}
              >
                <Input id="defaultBranch" {...form.register('defaultBranch')} />
              </FormField>
              <FormField
                id="authRef"
                label="Auth reference"
                hint="Pointer to stored credentials, for example vault:github/org-bot."
                error={form.formState.errors.authRef?.message}
              >
                <Input id="authRef" {...form.register('authRef')} />
              </FormField>
              <div className="flex justify-end gap-2">
                <LinkButton variant="ghost" to="/repo-connections">
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
