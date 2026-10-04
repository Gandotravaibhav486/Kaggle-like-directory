import { notFound } from 'next/navigation';
import {
  funnelByEmailedMonth,
  furthestStageIndex,
  nextStage,
  PIPELINE_STAGES,
  prospectStatus,
  summarizeFunnel,
  type ProspectRow,
} from '@mi/db/domain';
import { getCompetitionBySlug, listProspects } from '@mi/db/queries';
import { Badge, Card, EmptyState, LinkButton, Money, Num, OwnerOnly, Percent, ScrollTable } from '@mi/ui';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { InlineDisclosure } from '@/components/inline-disclosure';
import { ProspectForm } from '@/components/prospect-form';
import {
  AdvanceProspectButton,
  DeleteProspectButton,
  MarkProspectLostButton,
} from '@/components/prospect-row-actions';

function StageBadge({ prospect }: { prospect: ProspectRow }) {
  const status = prospectStatus(prospect);
  if (status === 'won') return <Badge variant="public">Contract</Badge>;
  if (status === 'lost') return <Badge variant="hidden">Lost</Badge>;
  return <Badge variant="neutral">{PIPELINE_STAGES[furthestStageIndex(prospect)]!.label}</Badge>;
}

/** Date of the latest step the prospect took, including being marked lost. */
function lastMoved(p: ProspectRow): string {
  return p.lostOn ?? p[PIPELINE_STAGES[furthestStageIndex(p)]!.field]!;
}

const th = 'px-3 py-2';

export default async function PipelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer.isOwner) {
    return <OwnerOnly signInHref="/signin" title="The pipeline is private" />;
  }

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const prospects = await listProspects(db, competition.id);
  const summary = summarizeFunnel(prospects);
  const cohorts = funnelByEmailedMonth(prospects);
  const [emailed, replied, , , won] = summary.steps;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-h1 font-semibold text-fg">Pipeline</h1>
          <Badge variant="private">Private</Badge>
        </div>
        {prospects.length > 0 && (
          <LinkButton href={`/competitions/${slug}/pipeline/export.csv`} variant="secondary" size="sm">
            Export CSV
          </LinkButton>
        )}
      </div>

      {prospects.length === 0 ? (
        <div className="mb-6">
          <EmptyState title="No prospects yet">
            Add each company you email below. Fill a stage date when they reply, take a demo, get on a second call or sign.
          </EmptyState>
        </div>
      ) : (
        <>
          <div data-testid="pipeline-summary" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card title="Emailed">
              <p className="text-num-lg">
                <Num value={emailed!.reached} />
              </p>
            </Card>
            <Card title="Reply rate">
              <p className="text-num-lg">
                <Percent ratio={replied!.fromStart} />
              </p>
            </Card>
            <Card title="Contracts">
              <p className="text-num-lg">
                <Num value={won!.reached} />
              </p>
              <p className="mt-1 text-small text-fg-muted">
                <Percent ratio={won!.fromStart} /> of emailed · {summary.open} open · {summary.lost} lost
              </p>
            </Card>
            <Card title="Contract value">
              <p className="text-num-lg">
                <Money minor={summary.contractValueMinor} currency={competition.currency} />
              </p>
            </Card>
          </div>

          <h2 className="mb-3 text-h2 font-semibold text-fg">Funnel</h2>
          <ScrollTable caption="Conversion at each stage" data-testid="pipeline-funnel">
            <thead>
              <tr className="bg-surface-sunken text-left text-micro text-fg-muted">
                <th scope="col" className={th}>Stage</th>
                <th scope="col" className={`${th} text-right`}>Reached</th>
                <th scope="col" className={`${th} text-right`}>From previous</th>
                <th scope="col" className={`${th} text-right`}>From emailed</th>
                <th scope="col" className={`${th} text-right`}>Median days</th>
                <th scope="col" className={`${th} w-1/4`}>
                  <span className="sr-only">Share of emailed</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.steps.map((s) => (
                <tr key={s.key} data-testid="pipeline-funnel-row" className="border-t border-border">
                  <th scope="row" className={`${th} text-left font-normal`}>{s.label}</th>
                  <td className={`${th} text-right`}>
                    <Num value={s.reached} />
                  </td>
                  <td className={`${th} text-right`}>
                    <Percent ratio={s.fromPrevious} />
                  </td>
                  <td className={`${th} text-right`}>
                    <Percent ratio={s.fromStart} />
                  </td>
                  <td className={`${th} text-right`}>
                    <Num value={s.medianDays} decimals={s.medianDays !== null && s.medianDays % 1 ? 1 : 0} />
                  </td>
                  <td className={th}>
                    <div aria-hidden="true" className="h-2 min-w-24 rounded-sm bg-surface-sunken">
                      <div className="h-2 rounded-sm bg-accent" style={{ width: `${(s.fromStart ?? 0) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>

          <h2 className="mb-3 mt-8 text-h2 font-semibold text-fg">By outreach month</h2>
          <ScrollTable caption="Funnel for each month's outreach" data-testid="pipeline-cohorts">
            <thead>
              <tr className="bg-surface-sunken text-left text-micro text-fg-muted">
                <th scope="col" className={th}>Emailed in</th>
                {PIPELINE_STAGES.map((s) => (
                  <th key={s.key} scope="col" className={`${th} text-right`}>{s.label}</th>
                ))}
                <th scope="col" className={`${th} text-right`}>Win rate</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.month} className="border-t border-border">
                  <th scope="row" className={`num ${th} text-left font-normal tnum`}>{c.month}</th>
                  {c.summary.steps.map((s) => (
                    <td key={s.key} className={`${th} text-right`}>
                      <Num value={s.reached} />
                    </td>
                  ))}
                  <td className={`${th} text-right`}>
                    <Percent ratio={c.summary.steps.at(-1)!.fromStart} />
                  </td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>

          <h2 className="mb-3 mt-8 text-h2 font-semibold text-fg">Prospects</h2>
          <ScrollTable caption="Prospects" data-testid="pipeline-table">
            <thead>
              <tr className="bg-surface-sunken text-left text-micro text-fg-muted">
                <th scope="col" className={th}>Company</th>
                <th scope="col" className={th}>Channel</th>
                <th scope="col" className={th}>Stage</th>
                <th scope="col" className={th}>Emailed</th>
                <th scope="col" className={th}>Last moved</th>
                <th scope="col" className={`${th} text-right`}>Value</th>
                <th scope="col" className={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => {
                const next = nextStage(p);
                return (
                  <tr key={p.id} data-testid="prospect-row" className="border-t border-border align-top">
                    <th scope="row" className={`${th} text-left font-normal`}>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-fg">{p.company}</span>
                        {p.example && <Badge variant="example" />}
                      </span>
                      {(p.contactName || p.contactEmail) && (
                        <span className="block text-small text-fg-muted">
                          {[p.contactName, p.contactEmail].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </th>
                    <td className={`${th} text-fg-secondary`}>{p.channel || '—'}</td>
                    <td className={th} data-testid="prospect-stage">
                      <StageBadge prospect={p} />
                    </td>
                    <td className={`num ${th} tnum`}>{p.emailedOn}</td>
                    <td className={`num ${th} tnum`}>{lastMoved(p)}</td>
                    <td className={`${th} text-right`}>
                      <Money minor={p.contractValueMinor} currency={competition.currency} />
                    </td>
                    <td className={th}>
                      <div className="flex flex-wrap gap-2">
                        {next && <AdvanceProspectButton slug={slug} id={p.id} nextLabel={next.label} />}
                        {next && <MarkProspectLostButton slug={slug} id={p.id} />}
                        <InlineDisclosure label="Edit">
                          <ProspectForm slug={slug} prospect={p} />
                        </InlineDisclosure>
                        <DeleteProspectButton slug={slug} id={p.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </ScrollTable>
        </>
      )}

      <Card title="Add prospect" className="mt-6 max-w-2xl">
        <ProspectForm slug={slug} />
      </Card>
    </div>
  );
}
