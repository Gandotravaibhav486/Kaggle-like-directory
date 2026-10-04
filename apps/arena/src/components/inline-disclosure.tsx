'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@mi/ui';

export function InlineDisclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close' : label}
      </Button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
