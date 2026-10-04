import { redirect } from 'next/navigation';
import { DEFAULT_SLUG } from '@/lib/env';

export default function RootPage() {
  redirect(`/competitions/${DEFAULT_SLUG}/overview`);
}
