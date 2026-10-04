'use client';

import { useRouter } from 'next/navigation';
import { Select } from '@mi/ui';

export function SeasonSwitcher({
  slug,
  seasons,
}: {
  slug: string;
  seasons: Array<{ slug: string; title: string }>;
}) {
  const router = useRouter();
  if (seasons.length <= 1) return null;
  return (
    <label className="inline-flex items-center gap-2 text-small text-fg-secondary">
      <span className="sr-only">Switch season</span>
      <Select
        aria-label="Switch season"
        defaultValue={slug}
        onChange={(e) => router.push(`/competitions/${e.target.value}/overview`)}
        className="max-w-[14rem]"
      >
        {seasons.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.title}
          </option>
        ))}
      </Select>
    </label>
  );
}
