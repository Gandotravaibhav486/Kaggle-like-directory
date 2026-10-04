'use client';

import { useActionState } from 'react';
import { Badge, Card, Field, Input } from '@mi/ui';
import { CopyButton, ConfirmButton, SubmitButton, FormErrors } from '@mi/ui/client';
import { formatDate } from '@mi/ui/format';
import type { AgentTokenPublic } from '@mi/db/queries';
import { createAgentTokenAction, revokeAgentTokenAction } from '@/app/actions/agents';

export function TokenAdmin({ slug, tokens }: { slug: string; tokens: AgentTokenPublic[] }) {
  const action = createAgentTokenAction.bind(null, slug);
  const [state, formAction] = useActionState(action, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Card title="Agent tokens (owner only)">
      <form action={formAction} noValidate className="grid gap-4 sm:grid-cols-3">
        <FormErrors state={state} />
        <Field label="Name" name="name" required error={fieldErrors?.name}>
          <Input required placeholder="e.g. Research agent" />
        </Field>
        <Field label="Rate limit (per window)" name="rateLimit" error={fieldErrors?.rateLimit}>
          <Input type="number" min={1} max={120} defaultValue={10} />
        </Field>
        <Field label="Window (seconds)" name="rateWindowSeconds" error={fieldErrors?.rateWindowSeconds}>
          <Input type="number" min={10} max={3600} defaultValue={60} />
        </Field>
        <div className="sm:col-span-3">
          <SubmitButton>Create token</SubmitButton>
        </div>
      </form>

      {state?.ok && (
        <div className="mt-4 rounded-md border border-accent/30 bg-accent-subtle p-3">
          <p className="text-small font-medium text-fg">
            Copy this token now — it will not be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code data-testid="token-plaintext" className="num break-all text-small text-fg">
              {state.data.plaintext}
            </code>
            <CopyButton text={state.data.plaintext} />
          </div>
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[520px] border-collapse text-small">
          <thead>
            <tr>
              <th scope="col" className="bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Name</th>
              <th scope="col" className="bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Prefix</th>
              <th scope="col" className="bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Created</th>
              <th scope="col" className="bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Last used</th>
              <th scope="col" className="bg-surface-sunken px-3 py-2 text-left text-micro font-medium text-fg-secondary">Status</th>
              <th scope="col" className="bg-surface-sunken px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id} data-testid="token-row" className="border-t border-border">
                <td className="px-3 py-2.5 text-fg">{t.name}</td>
                <td className="num px-3 py-2.5 tnum text-fg-secondary">{t.tokenPrefix}</td>
                <td className="num px-3 py-2.5 tnum text-fg-secondary">{formatDate(t.createdAt)}</td>
                <td className="num px-3 py-2.5 tnum text-fg-secondary">{t.lastUsedAt ? formatDate(t.lastUsedAt) : '—'}</td>
                <td className="px-3 py-2.5">
                  <Badge variant={t.revokedAt ? 'hidden' : 'public'}>{t.revokedAt ? 'Revoked' : 'Active'}</Badge>
                </td>
                <td className="px-3 py-2.5">
                  {!t.revokedAt && (
                    <ConfirmButton
                      variant="danger-quiet"
                      size="sm"
                      confirmText={`Revoke token "${t.name}"?`}
                      onClick={() => revokeAgentTokenAction(t.id)}
                    >
                      Revoke
                    </ConfirmButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
