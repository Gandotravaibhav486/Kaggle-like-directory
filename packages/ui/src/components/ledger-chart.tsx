import { formatMonth, formatMoney } from '../format';

export interface LedgerChartDatum {
  month: string; // 'YYYY-MM'
  revenue: number; // major units
  expenses: number; // major units
  net?: number;
  example?: boolean;
}

export interface LedgerChartProps {
  data: LedgerChartDatum[];
  currency: string;
}

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const exp = Math.floor(Math.log10(max));
  const base = Math.pow(10, exp);
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * base;
    if (candidate >= max) return candidate;
  }
  return 10 * base;
}

function compactCurrency(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

const WIDTH = 720;
const HEIGHT_DESKTOP = 320;
const MARGIN = { top: 16, right: 12, bottom: 36, left: 56 };

export function LedgerChart({ data, currency }: LedgerChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong/60 bg-surface px-6 py-10 text-center">
        <p className="text-h3 font-semibold text-fg">No shared months yet</p>
        <p className="mx-auto mt-1 max-w-sm text-small text-fg-secondary">
          Add a ledger month and share it publicly to see revenue against expenses here.
        </p>
      </div>
    );
  }

  const height = HEIGHT_DESKTOP;
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = height - MARGIN.top - MARGIN.bottom;

  const max = niceMax(Math.max(...data.map((d) => Math.max(d.revenue, d.expenses)), 1));
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (max / tickCount) * i);

  const bandWidth = plotWidth / data.length;
  const groupPaddingInner = bandWidth * 0.15;
  const barAreaWidth = Math.min(bandWidth - groupPaddingInner * 2, 56);
  const barWidth = Math.min((barAreaWidth - 2) / 2, 28);

  const y = (v: number) => MARGIN.top + plotHeight - (v / max) * plotHeight;

  const latestMonthWithYear = (month: string, index: number) => {
    const label = formatMonth(month).split(' ')[0] ?? month;
    if (index === 0 || month.endsWith('-01')) {
      return `${label} ${month.slice(2, 4)}`;
    }
    return label;
  };

  const summary = (() => {
    const better = data.filter((d) => d.revenue > d.expenses).length;
    const lastNet = (data[data.length - 1]?.revenue ?? 0) - (data[data.length - 1]?.expenses ?? 0);
    const sign = lastNet >= 0 ? '+' : '−';
    return `Revenue exceeded expenses in ${better} of ${data.length} months; latest net ${sign}${compactCurrency(Math.abs(lastNet), currency)}.`;
  })();

  const chartMinWidth = data.length > 8 ? data.length * 44 : undefined;

  return (
    <figure data-testid="ledger-chart" className="rounded-lg border border-border bg-surface p-4 md:p-6">
      <figcaption className="text-h3 font-semibold text-fg">Revenue against total expenses, by month, {currency}</figcaption>

      <ul className="mt-3 flex gap-4 text-small text-fg-secondary">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: 'var(--chart-1)' }} />
          Revenue
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-[2px]" style={{ background: 'var(--chart-2)' }} />
          Expenses (total)
        </li>
      </ul>

      <div className="mt-3 overflow-x-auto">
        <svg
          role="img"
          aria-label={`Revenue against total expenses, by month, in ${currency}`}
          aria-describedby="ledger-chart-summary"
          viewBox={`0 0 ${WIDTH} ${height}`}
          width="100%"
          style={{ minWidth: chartMinWidth, height: 'auto', maxHeight: height }}
          preserveAspectRatio="xMinYMid meet"
          className="h-64 md:h-80"
        >
          <defs>
            <pattern id="ledger-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="currentColor" opacity="0.25" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            </pattern>
          </defs>

          <text x={MARGIN.left} y={10} className="num" fontSize="12" fill="var(--fg-muted)">
            Amount ({currency})
          </text>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--grid)"
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text x={MARGIN.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" className="num" fontSize="12" fill="var(--fg-muted)">
                {compactCurrency(t, currency)}
              </text>
            </g>
          ))}
          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />

          {data.map((d, i) => {
            const groupX = MARGIN.left + i * bandWidth + (bandWidth - (barWidth * 2 + 2)) / 2;
            const revH = plotHeight - (y(d.revenue) - MARGIN.top);
            const expH = plotHeight - (y(d.expenses) - MARGIN.top);
            const net = d.net ?? d.revenue - d.expenses;
            return (
              <g key={d.month} tabIndex={0} aria-label={`${formatMonth(d.month)}: revenue ${formatMoney(d.revenue * 100, currency)}, expenses ${formatMoney(d.expenses * 100, currency)}, net ${formatMoney(net * 100, currency)}`}>
                <rect
                  x={groupX}
                  y={y(d.revenue)}
                  width={barWidth}
                  height={Math.max(revH, 0)}
                  rx={3}
                  fill="var(--chart-1)"
                >
                  <title>
                    {`${formatMonth(d.month)} — Revenue ${formatMoney(d.revenue * 100, currency)}${d.example ? ' (Example)' : ''}`}
                  </title>
                </rect>
                {d.example && (
                  <rect x={groupX} y={y(d.revenue)} width={barWidth} height={Math.max(revH, 0)} rx={3} fill="url(#ledger-hatch)" style={{ color: 'var(--chart-1)' }} />
                )}

                <rect
                  x={groupX + barWidth + 2}
                  y={y(d.expenses)}
                  width={barWidth}
                  height={Math.max(expH, 0)}
                  rx={3}
                  fill="var(--chart-2)"
                >
                  <title>
                    {`${formatMonth(d.month)} — Expenses ${formatMoney(d.expenses * 100, currency)}, net ${formatMoney(net * 100, currency)}${d.example ? ' (Example)' : ''}`}
                  </title>
                </rect>
                {d.example && (
                  <rect x={groupX + barWidth + 2} y={y(d.expenses)} width={barWidth} height={Math.max(expH, 0)} rx={3} fill="url(#ledger-hatch)" style={{ color: 'var(--chart-2)' }} />
                )}

                <text
                  x={MARGIN.left + i * bandWidth + bandWidth / 2}
                  y={height - MARGIN.bottom + 16}
                  textAnchor="middle"
                  className="num"
                  fontSize="12"
                  fill="var(--fg-muted)"
                >
                  {latestMonthWithYear(d.month, i)}
                </text>
              </g>
            );
          })}

          <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={height - MARGIN.bottom} y2={height - MARGIN.bottom} stroke="var(--border-strong)" strokeWidth={1} />
          <text x={WIDTH / 2} y={height - 2} textAnchor="middle" fontSize="12" fill="var(--fg-muted)" className="sr-only">
            Month
          </text>
        </svg>
      </div>

      <p id="ledger-chart-summary" className="sr-only">
        {summary}
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-small text-fg-secondary">Show as table</summary>
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] border-collapse text-small">
            <caption className="sr-only">Revenue, expenses and net by month</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">
                  Month
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-right text-micro font-medium text-fg-secondary">
                  Revenue
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-right text-micro font-medium text-fg-secondary">
                  Expenses
                </th>
                <th scope="col" className="sticky top-0 z-10 bg-surface-sunken px-3 py-2 text-right text-micro font-medium text-fg-secondary">
                  Net
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.month}>
                  <th scope="row" className="px-3 py-2.5 text-left font-normal text-fg">
                    {formatMonth(d.month)}
                  </th>
                  <td className="num px-3 py-2.5 text-right tnum">{formatMoney(d.revenue * 100, currency)}</td>
                  <td className="num px-3 py-2.5 text-right tnum">{formatMoney(d.expenses * 100, currency)}</td>
                  <td className="num px-3 py-2.5 text-right tnum">{formatMoney((d.net ?? d.revenue - d.expenses) * 100, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
