import { notFound } from 'next/navigation';
import {
  collectionRate,
  fromMinor,
  margin,
  netMinor,
  summarizeLedger,
  totalExpensesMinor,
  type LedgerFigures,
} from '@mi/db/domain';
import { getCompetitionBySlug, listLedgerMonths } from '@mi/db/queries';
import { Card, LedgerChart, LinkButton, Money, OwnerOnly, Percent, ScrollTable } from '@mi/ui';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { LedgerForm } from '@/components/ledger-form';
import { InlineDisclosure } from '@/components/inline-disclosure';
import { LedgerShareToggle, DeleteLedgerMonthButton } from '@/components/ledger-row-actions';

export default async function LedgerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const viewer = await getViewer();
  if (!viewer.isOwner) {
    return <OwnerOnly signInHref="/signin" title="The ledger is private" />;
  }

  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const months = await listLedgerMonths(db, competition.id);
  const summary = summarizeLedger(months as LedgerFigures[]);

  const chartData = months.map((m) => ({
    month: m.month.slice(0, 7),
    revenue: fromMinor(m.revenueMinor),
    expenses: fromMinor(totalExpensesMinor(m)),
    net: fromMinor(netMinor(m)),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h1 font-semibold text-fg">Ledger</h1>
        <LinkButton href={`/competitions/${slug}/ledger/export.csv`} variant="secondary" size="sm">
          Export CSV
        </LinkButton>
      </div>

      <div
        data-testid="ledger-summary"
        className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <Card title="Net">
          <p className="text-num-lg">
            <Money minor={summary.netMinor} currency={competition.currency} />
          </p>
        </Card>
        <Card title="Margin">
          <p className="text-num-lg">
            <Percent ratio={summary.margin} />
          </p>
        </Card>
        <Card title="Collection rate">
          <p className="text-num-lg">
            <Percent ratio={summary.collectionRate} />
          </p>
        </Card>
        <Card title="Revenue">
          <p className="text-num-lg">
            <Money minor={summary.revenueMinor} currency={competition.currency} />
          </p>
        </Card>
      </div>

      <div className="mb-6">
        <LedgerChart data={chartData} currency={competition.currency} />
      </div>

      <ScrollTable caption="Ledger months" data-testid="ledger-table">
        <thead>
          <tr className="bg-surface-sunken text-left text-micro text-fg-muted">
            <th scope="col" className="px-3 py-2">Month</th>
            <th scope="col" className="px-3 py-2 text-right">Revenue</th>
            <th scope="col" className="px-3 py-2 text-right">Expenses</th>
            <th scope="col" className="px-3 py-2 text-right">Net</th>
            <th scope="col" className="px-3 py-2 text-right">Margin</th>
            <th scope="col" className="px-3 py-2 text-right">Collection</th>
            <th scope="col" className="px-3 py-2">Shared</th>
            <th scope="col" className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.id} data-testid="ledger-row" className="border-t border-border">
              <th scope="row" className="num px-3 py-2 text-left font-normal tnum">{m.month.slice(0, 7)}</th>
              <td className="px-3 py-2 text-right">
                <Money minor={m.revenueMinor} currency={competition.currency} />
              </td>
              <td className="px-3 py-2 text-right">
                <Money minor={totalExpensesMinor(m)} currency={competition.currency} />
              </td>
              <td className="px-3 py-2 text-right">
                <Money minor={netMinor(m)} currency={competition.currency} />
              </td>
              <td className="px-3 py-2 text-right">
                <Percent ratio={margin(m)} />
              </td>
              <td className="px-3 py-2 text-right">
                <Percent ratio={collectionRate(m)} />
              </td>
              <td className="px-3 py-2">
                <LedgerShareToggle slug={slug} id={m.id} sharedPublicly={m.sharedPublicly} />
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-2">
                  <InlineDisclosure label="Edit">
                    <LedgerForm slug={slug} month={m} />
                  </InlineDisclosure>
                  <DeleteLedgerMonthButton slug={slug} id={m.id} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ScrollTable>

      <Card title="Add month" className="mt-6 max-w-xl">
        <LedgerForm slug={slug} />
      </Card>
    </div>
  );
}
