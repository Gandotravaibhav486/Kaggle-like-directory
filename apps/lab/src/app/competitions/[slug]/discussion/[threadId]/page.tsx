import { notFound } from 'next/navigation';
import { Badge, MarkdownView } from '@mi/ui';
import { formatDate } from '@mi/ui/format';
import { getCompetitionBySlug, getThread, listReplies } from '@mi/db/queries';
import { db } from '@/lib/db';
import { getViewer } from '@/lib/guards';
import { claudeStatus } from '@/lib/claude';
import { buildBriefingText } from '@/app/actions/agents';
import { ReplyForm } from './reply-form';
import { ReplyRow } from './reply-row';
import { AgentsPanel } from './agents-panel';

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string; threadId: string }>;
}) {
  const { slug, threadId } = await params;
  const competition = await getCompetitionBySlug(db, slug);
  if (!competition) notFound();

  const thread = await getThread(db, threadId);
  if (!thread || thread.competitionId !== competition.id) notFound();

  const viewer = await getViewer();
  const [replies, briefing] = await Promise.all([
    listReplies(db, threadId, { includeHidden: viewer.isOwner }),
    buildBriefingText(threadId),
  ]);
  const status = claudeStatus();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="tag">{thread.tag}</Badge>
          <h1 className="text-h1 font-semibold text-fg">{thread.title}</h1>
        </div>
        <p className="mt-1 text-small text-fg-secondary">
          by {thread.authorName} · <time dateTime={thread.createdAt.toISOString()}>{formatDate(thread.createdAt)}</time>
        </p>
        <div className="prose-mi mt-4">
          <MarkdownView markdown={thread.bodyMd} />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-h2 font-semibold text-fg">
          Replies <span className="num text-fg-muted">({replies.length})</span>
        </h2>
        {replies.map((r) => (
          <ReplyRow key={r.id} reply={r} slug={slug} isOwner={viewer.isOwner} />
        ))}
      </div>

      <ReplyForm threadId={threadId} />

      <AgentsPanel threadId={threadId} briefing={briefing} claudeConfigured={status.configured} />
    </div>
  );
}
