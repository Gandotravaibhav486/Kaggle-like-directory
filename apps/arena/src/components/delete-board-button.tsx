'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ConfirmButton, FormErrors } from '@mi/ui/client';
import type { ActionResult } from '@mi/db/domain';
import { deleteBoardAction } from '@/app/actions/boards';

export function DeleteBoardButton({ slug, boardId }: { slug: string; boardId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState<ActionResult<undefined> | null, FormData>(
    async () => deleteBoardAction(slug, boardId),
    null,
  );

  useEffect(() => {
    if (state?.ok) router.push(`/competitions/${slug}/leaderboard`);
  }, [state, router, slug]);

  return (
    <form action={formAction}>
      <ConfirmButton type="submit" variant="danger" confirmText="Delete this board and all its entries?">
        Delete board
      </ConfirmButton>
      <FormErrors state={state} />
    </form>
  );
}
