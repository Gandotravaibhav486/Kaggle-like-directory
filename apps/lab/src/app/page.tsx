import { redirect } from 'next/navigation';
import { DEFAULT_COMPETITION_SLUG } from '@mi/db/domain';

export default function RootPage() {
  const slug = process.env.DEFAULT_COMPETITION_SLUG ?? DEFAULT_COMPETITION_SLUG;
  redirect(`/competitions/${slug}/discussion`);
}
