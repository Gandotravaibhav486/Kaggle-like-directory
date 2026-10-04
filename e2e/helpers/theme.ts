import type { Page } from '@playwright/test';
import { THEME_STORAGE_KEY, type Theme } from './env';

/** Forces a theme before any page script runs (ThemeScript reads localStorage['mi-theme']). */
export async function forceTheme(page: Page, theme: Theme): Promise<void> {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript(
    ([key, value]) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        /* storage unavailable */
      }
      document.documentElement.dataset.theme = value;
    },
    [THEME_STORAGE_KEY, theme] as const,
  );
}
