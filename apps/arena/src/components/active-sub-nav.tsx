'use client';

import { usePathname } from 'next/navigation';
import { SubNav, type SubNavItem } from '@mi/ui';

export function ActiveSubNav({ label, items }: { label: string; items: Omit<SubNavItem, 'active'>[] }) {
  const pathname = usePathname();
  return (
    <SubNav
      label={label}
      items={items.map((item) => ({
        ...item,
        active: !item.external && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
      }))}
    />
  );
}
