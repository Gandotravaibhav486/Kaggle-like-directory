// Inline no-flash theme script for <head>. The only place in @mi/ui that uses
// dangerouslySetInnerHTML, per ARCHITECTURE.md §7 (static code only, no user data).
const THEME_SCRIPT = `(function(){try{var k='mi-theme';var v=localStorage.getItem(k);var t=v;if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export function ThemeScript() {
  return <script data-testid="theme-script" dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
