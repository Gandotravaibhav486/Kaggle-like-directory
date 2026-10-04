'use client';

import { AgentReplyCard, Badge, MarkdownView, type AgentReplySource } from '@mi/ui';
import { formatDate } from '@mi/ui/format';
import { ConfirmButton } from '@mi/ui/client';
import type { Reply } from '@mi/db/schema';
import { setReplyHidden } from '@/app/actions/discussion';

export function ReplyRow({ reply, isOwner }: { reply: Reply; slug: string; isOwner: boolean }) {
  const hiddenPlaceholder = reply.hidden && !isOwner;

  const ownerHideAction = isOwner ? (
    <ConfirmButton
      variant="danger-quiet"
      size="sm"
      confirmText={reply.hidden ? 'Unhide this reply?' : 'Hide this reply from visitors?'}
      onClick={() => setReplyHidden(reply.id, !reply.hidden)}
    >
      {reply.hidden ? 'Unhide' : 'Hide'}
    </ConfirmButton>
  ) : null;

  if (hiddenPlaceholder) {
    return (
      <div data-testid="reply" className="rounded-lg border border-dashed border-border-strong/60 bg-surface p-4 text-small text-fg-muted">
        This reply has been hidden by the owner.
      </div>
    );
  }

  if (reply.authorType === 'agent' && reply.agentPayload) {
    return (
      <div data-testid="reply">
        <AgentReplyCard
          payload={reply.agentPayload}
          agentName={reply.authorName}
          source={(reply.agentSource ?? 'api') as AgentReplySource}
          isMock={reply.isMock}
          hidden={reply.hidden}
          createdAt={reply.createdAt}
          actions={ownerHideAction}
        />
      </div>
    );
  }

  return (
    <div data-testid="reply" className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-medium text-fg">{reply.authorName}</span>
        {reply.hidden && <Badge variant="hidden" />}
        <time dateTime={reply.createdAt.toISOString()} className="num ml-auto text-small tnum text-fg-muted">
          {formatDate(reply.createdAt)}
        </time>
      </div>
      <MarkdownView markdown={reply.bodyMd} />
      {ownerHideAction && <div className="mt-3 border-t border-border pt-3">{ownerHideAction}</div>}
    </div>
  );
}
