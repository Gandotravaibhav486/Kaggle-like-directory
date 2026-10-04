'use client';
import { useEffect, useRef } from 'react';

export interface SubNavItem {
  href: string;
  label: string;
  active: boolean;
  external?: boolean;
}

export interface SubNavProps {
  items: SubNavItem[];
  label: string;
}

/** Horizontally scrollable on mobile; active tab scrolls into view on mount. */
export function SubNav({ items, label }: SubNavProps) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, []);

  return (
    <nav
      aria-label={label}
      className="-mx-4 mt-6 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,#000_16px,#000_calc(100%-16px),transparent)] [scrollbar-width:none] md:mx-0 md:px-0 md:[mask-image:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-max gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <a
              ref={item.active ? activeRef : undefined}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={
                item.active
                  ? 'relative inline-flex min-h-11 items-center whitespace-nowrap px-3 text-small font-medium text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent'
                  : 'relative inline-flex min-h-11 items-center whitespace-nowrap px-3 text-small font-medium text-fg-secondary hover:text-fg'
              }
            >
              {item.label}
              {item.external ? ' ↗' : ''}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
