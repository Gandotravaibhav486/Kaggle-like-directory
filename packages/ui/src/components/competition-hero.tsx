import { formatDate } from '../format';

export interface CompetitionHeroProps {
  title: string;
  tagline: string;
  startsOn: string | null;
  endsOn: string | null;
  badge?: string;
}

export function CompetitionHero({ title, tagline, startsOn, endsOn, badge }: CompetitionHeroProps) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 pb-0 pt-6 md:px-6 md:pt-10">
        <p className="text-small text-fg-muted">{tagline}</p>
        <h1 className="mt-1 text-balance text-display font-semibold tracking-[-0.02em] text-fg">{title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-fg-secondary">
          {(startsOn || endsOn) && (
            <span className="tnum">
              {startsOn && <time dateTime={startsOn}>{formatDate(startsOn)}</time>}
              {startsOn && endsOn && ' – '}
              {endsOn && <time dateTime={endsOn}>{formatDate(endsOn)}</time>}
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-surface-sunken px-2 py-0.5 text-micro font-medium text-fg-secondary">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
