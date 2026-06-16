import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useCreateRepoConnection,
  useRepoConnection,
  useUpdateRepoConnection,
} from '@/api/hooks'
import {
  repoConnectionFormSchema,
} from '@/api/schemas'
import type { RepoConnectionFormValues } from '@/api/schemas'
import { FormField } from '@/components/patterns/form-field'
import { PageHeader } from '@/components/patterns/page-header'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { LinkButton } from '@/components/ui/link-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export function RepoConnectionFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const existing = useRepoConnection(isNew ? undefined : id)
  const create = useCreateRepoConnection()
  const update = useUpdateRepoConnection(id ?? '')

  const form = useForm<RepoConnectionFormValues>({
    resolver: zodResolver(
      repoConnectionFormSchema,
    ) as Resolver<RepoConnectionFormValues>,
    values: existing.data
      ? {
          provider: existing.data.provider,
          ownerOrOrg: existing.data.ownerOrOrg,
          repoName: existing.data.repoName,
          displayName: existing.data.displayName ?? '',
          cloneUrl: existing.data.cloneUrl ?? '',
          defaultBranch: existing.data.defaultBranch,
          credentialReference: existing.data.credentialReference ?? '',
        }
      : {
          provider: 'github',
          ownerOrOrg: '',
          repoName: '',
          displayName: '',
          cloneUrl: '',
          defaultBranch: 'main',
          credentialReference: '',
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
                hint="Backend provider id (e.g. github, gitlab, or a custom value your API defines)."
                error={form.formState.errors.provider?.message}
              >
                <Input
                  id="provider"
                  {...form.register('provider')}
                  autoComplete="off"
                  placeholder="github"
                />
              </FormField>
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  id="ownerOrOrg"
                  label="Owner / org"
                  hint="Organization or user that owns the repository."
                  error={form.formState.errors.ownerOrOrg?.message}
                >
                  <Input
                    id="ownerOrOrg"
                    {...form.register('ownerOrOrg')}
                    autoComplete="off"
                  />
                </FormField>
                <FormField
                  id="repoName"
                  label="Repository"
                  hint="Repository name without the owner prefix."
                  error={form.formState.errors.repoName?.message}
                >
                  <Input
                    id="repoName"
                    {...form.register('repoName')}
                    autoComplete="off"
                  />
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
                id="credentialReference"
                label="Auth reference"
                hint="Required for new connections. If the server has no stored ref yet (e.g. SSH), enter the secret ref your backend expects before saving."
                error={form.formState.errors.credentialReference?.message}
              >
                <Input
                  id="credentialReference"
                  {...form.register('credentialReference')}
                />
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
