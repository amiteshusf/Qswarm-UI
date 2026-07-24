import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'

import { formatErrorForToast } from '@/api/errors'
import {
  useAnalyzeRequirements,
  useApproveTestDesign,
  useApproveTestDesignPlan,
  useGenerateTestCases,
  usePrepareTestDesignPlan,
  usePublishTestCases,
  useRequestTestCaseRevision,
  useRequestTestDesignPlanRevision,
  useRequirementAnalysis,
  useTestDesignPlan,
  useTestDesignReviewData,
  useTestDesignRun,
} from '@/api/hooks'
import { QueryErrorAlert } from '@/components/patterns/query-error'
import { Skeleton } from '@/components/ui/skeleton'
import { AnalysisRevisionComposer } from '@/features/test-design/analysis-revision-composer'
import { ApprovalSummaryPanel } from '@/features/test-design/approval-summary-panel'
import { PublicationPanel } from '@/features/test-design/publication-panel'
import { RequirementAnalysisPanel } from '@/features/test-design/requirement-analysis-panel'
import { TestCaseRevisionComposer } from '@/features/test-design/test-case-revision-composer'
import { TestCaseReviewWorkspace } from '@/features/test-design/test-case-review-workspace'
import { TestDesignActionRail } from '@/features/test-design/test-design-action-rail'
import { TestDesignConversationPanel } from '@/features/test-design/test-design-conversation-panel'
import { TestDesignPlanPanel } from '@/features/test-design/test-design-plan-panel'
import { TestDesignPlanRevisionComposer } from '@/features/test-design/test-design-plan-revision-composer'
import {
  buildTestDesignContext,
  isTestDesignActionAllowed,
  testDesignActionHints,
  type TestDesignPrimaryAction,
} from '@/features/test-design/test-design-actions'
import { TestDesignWorkflowStrip } from '@/features/test-design/test-design-workflow-strip'
import {
  getTestDesignStatusLabel,
  isAnalysisPhase,
  isApprovalPhase,
  isCaseReviewPhase,
  isPlanPhase,
  isPublicationPhase,
} from '@/features/test-design/test-design-lifecycle'

export function TestDesignPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const runQ = useTestDesignRun(id)
  const analysisQ = useRequirementAnalysis(id)
  const planQ = useTestDesignPlan(id)
  const reviewQ = useTestDesignReviewData(id)

  const analyze = useAnalyzeRequirements(id ?? '')
  const preparePlan = usePrepareTestDesignPlan(id ?? '')
  const approvePlan = useApproveTestDesignPlan(id ?? '')
  const planRevision = useRequestTestDesignPlanRevision(id ?? '')
  const generateCases = useGenerateTestCases(id ?? '')
  const caseRevision = useRequestTestCaseRevision(id ?? '')
  const approveDesign = useApproveTestDesign(id ?? '')
  const publish = usePublishTestCases(id ?? '')

  const [planInstruction, setPlanInstruction] = useState('')
  const [analysisInstruction, setAnalysisInstruction] = useState('')
  const [caseInstruction, setCaseInstruction] = useState('')
  const [viewVersion, setViewVersion] = useState<number | undefined>()

  const run = runQ.data
  const pending =
    analyze.isPending ||
    preparePlan.isPending ||
    approvePlan.isPending ||
    planRevision.isPending ||
    generateCases.isPending ||
    caseRevision.isPending ||
    approveDesign.isPending ||
    publish.isPending

  async function onPrimaryAction(action: TestDesignPrimaryAction) {
    if (!run) return
    const ctx = buildTestDesignContext(run)
    if (!isTestDesignActionAllowed(ctx, action)) {
      toast.error('This action is not available right now.')
      return
    }
    try {
      switch (action) {
        case 'analyze_requirements':
          await analyze.mutateAsync()
          toast.success('Requirement analysis ready')
          break
        case 'prepare_test_design_plan':
          await preparePlan.mutateAsync()
          toast.success('Test-design plan ready')
          break
        case 'approve_plan':
          await approvePlan.mutateAsync()
          toast.success('Plan approved')
          break
        case 'generate_test_cases':
          await generateCases.mutateAsync()
          toast.success('Test cases generated')
          break
        case 'approve_test_design':
          await approveDesign.mutateAsync()
          toast.success('Test design approved')
          break
        case 'publish_test_cases':
          await publish.mutateAsync()
          toast.success('Test cases published')
          break
        case 'open_automation_backlog':
          navigate('/automation-backlog')
          break
      }
    } catch (e) {
      toast.error(formatErrorForToast(e))
    }
  }

  if (!id) {
    return (
      <div className="text-muted-foreground text-sm">
        Select a story from{' '}
        <Link to="/story-intake" className="text-swarm hover:underline">
          Story Intake
        </Link>
        .
      </div>
    )
  }

  if (runQ.isError) {
    return (
      <QueryErrorAlert error={runQ.error} onRetry={() => void runQ.refetch()} />
    )
  }

  if (runQ.isLoading || !run) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const ctx = buildTestDesignContext(run)
  const hints = testDesignActionHints(ctx)
  const showAnalysis =
    isAnalysisPhase(ctx) || Boolean(analysisQ.data && run.analysisReady)
  const showPlan =
    isPlanPhase(ctx) || Boolean(planQ.data && run.planApproved !== undefined)
  const showCases =
    isCaseReviewPhase(ctx) ||
    hints.isApprovalPhase ||
    Boolean(reviewQ.data?.testCases.length)
  const showApproval = isApprovalPhase(ctx)
  const showPublication = isPublicationPhase(ctx)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Test Design
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="font-mono">{run.storyKey}</span>
              <span className="text-muted-foreground mx-2">·</span>
              {run.storyTitle}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {getTestDesignStatusLabel(ctx)}
            </p>
          </div>
        </div>
        <TestDesignWorkflowStrip ctx={ctx} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-8">
          {showAnalysis && analysisQ.data ? (
            <section className="space-y-4">
              <SectionHeading
                title="Requirement Analysis"
                description="Review extracted requirements before planning test cases."
              />
              <RequirementAnalysisPanel analysis={analysisQ.data} />
              <AnalysisRevisionComposer
                run={run}
                instruction={analysisInstruction}
                pending={analyze.isPending}
                onInstructionChange={setAnalysisInstruction}
                onSubmit={() => {
                  toast.info('Analysis revision will be available when backend supports it.')
                }}
              />
            </section>
          ) : null}

          {showPlan && planQ.data && run.status !== 'draft' && run.status !== 'analyzing' ? (
            <section className="space-y-4">
              <SectionHeading
                title="Test-Design Plan"
                description="Approve the plan before generating test cases."
              />
              <TestDesignPlanPanel plan={planQ.data} />
              <TestDesignPlanRevisionComposer
                run={run}
                instruction={planInstruction}
                pending={planRevision.isPending}
                onInstructionChange={setPlanInstruction}
                onSubmit={(focusArea) =>
                  void planRevision
                    .mutateAsync({
                      instruction: planInstruction,
                      focusArea,
                    })
                    .then(() => {
                      toast.success('Plan revision requested')
                      setPlanInstruction('')
                    })
                    .catch((e) => toast.error(formatErrorForToast(e)))
                }
              />
            </section>
          ) : null}

          {showCases && reviewQ.data ? (
            <section className="space-y-4">
              <SectionHeading
                title="Test Cases"
                description="Review generated cases, request changes, or approve the design."
              />
              <TestCaseReviewWorkspace
                reviewData={reviewQ.data}
                selectedVersion={viewVersion}
                onVersionChange={setViewVersion}
              />
              <TestDesignConversationPanel reviewData={reviewQ.data} />
              <TestCaseRevisionComposer
                run={run}
                instruction={caseInstruction}
                pending={caseRevision.isPending}
                onInstructionChange={setCaseInstruction}
                onSubmit={(focusArea) =>
                  void caseRevision
                    .mutateAsync({
                      instruction: caseInstruction,
                      focusArea,
                    })
                    .then(() => {
                      toast.success('Test-case revision submitted')
                      setCaseInstruction('')
                    })
                    .catch((e) => toast.error(formatErrorForToast(e)))
                }
              />
            </section>
          ) : null}

          {showApproval && reviewQ.data ? (
            <section className="space-y-4">
              <SectionHeading
                title="Ready for Approval"
                description="Confirm the test design is complete before publishing."
              />
              <ApprovalSummaryPanel reviewData={reviewQ.data} />
            </section>
          ) : null}

          {showPublication && reviewQ.data ? (
            <section className="space-y-4">
              <SectionHeading
                title="Published"
                description="Test cases are in your test registry. Continue to automation."
              />
              <PublicationPanel reviewData={reviewQ.data} />
            </section>
          ) : null}

          {run.status === 'draft' && !analysisQ.data ? (
            <p className="text-muted-foreground text-sm">
              Start by analyzing requirements. QSwarm will extract acceptance
              criteria, gaps, and proposed scope from the Jira story.
            </p>
          ) : null}
        </div>

        <TestDesignActionRail
          run={run}
          pending={pending}
          onPrimaryAction={(action) => void onPrimaryAction(action)}
          className="xl:sticky xl:top-20 xl:self-start"
        />
      </div>
    </div>
  )
}

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>
    </div>
  )
}
