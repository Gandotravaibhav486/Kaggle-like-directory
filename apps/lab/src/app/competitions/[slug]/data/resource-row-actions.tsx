'use client';

import { ConfirmButton } from '@mi/ui/client';
import { deleteResource } from '@/app/actions/resources';
import { ResourceFormDialog, type ResourceFormValues } from './resource-form';

export function ResourceRowActions({ slug, resource }: { slug: string; resource: ResourceFormValues }) {
  return (
    <div className="flex items-center gap-2">
      <ResourceFormDialog slug={slug} initial={resource} />
      <ConfirmButton
        variant="danger-quiet"
        size="sm"
        confirmText={`Delete "${resource.name}"?`}
        onClick={() => deleteResource(resource.id, slug)}
      >
        Delete
      </ConfirmButton>
    </div>
  );
}
