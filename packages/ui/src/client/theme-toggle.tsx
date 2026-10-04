'use client';
import { useEffect, useState } from 'react';

type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'mi-theme';

function applyTheme(choice: ThemeChoice) {
  const resolved =
    choice === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : choice;
  document.documentElement.dataset.theme = resolved;
}

function nextChoice(choice: ThemeChoice): ThemeChoice {
  if (choice === 'light') return 'dark';
  if (choice === 'dark') return 'system';
  return 'light';
}

const icons: Record<ThemeChoice, React.ReactNode> = {
  light: (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px]">
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path
        d="M9 1.5v2M9 14.5v2M16.5 9h-2M3.5 9h-2M14.3 3.7l-1.4 1.4M5.1 12.9l-1.4 1.4M14.3 14.3l-1.4-1.4M5.1 5.1 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  dark: (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px]">
      <path
        d="M15 10.2A6.5 6.5 0 0 1 7.8 3 6.5 6.5 0 1 0 15 10.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  ),
  system: (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px]">
      <path d="M9 1.5a7.5 7.5 0 0 0 0 15 7.5 7.5 0 0 0 0-15Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M9 1.5a7.5 7.5 0 0 1 0 15Z" fill="currentColor" />
    </svg>
  ),
};

const nextLabel: Record<ThemeChoice, string> = { light: 'dark', dark: 'system', system: 'light' };

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setChoice(stored);
    }
  }, []);

  function cycle() {
    const next = nextChoice(choice);
    setChoice(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${choice}. Switch to ${nextLabel[choice]}`}
      className="inline-flex size-10 items-center justify-center rounded-md text-fg-secondary hover:bg-surface-sunken hover:text-fg"
    >
      {mounted ? icons[choice] : icons.system}
    </button>
  );
}
