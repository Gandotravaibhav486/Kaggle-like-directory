'use client';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MarkdownView } from '../components/markdown-view';

const MAX_HISTORY = 200;
const COALESCE_MS = 500;

interface HistoryState {
  stack: string[];
  index: number;
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i++;
  return i;
}

function commonSuffixLength(a: string, b: string, prefix: number): number {
  const max = Math.min(a.length, b.length) - prefix;
  let i = 0;
  while (i < max && a[a.length - 1 - i] === b[b.length - 1 - i]) i++;
  return i;
}

export interface MarkdownEditorProps {
  name: string;
  initialValue: string;
  label: string;
  id?: string;
  onDirtyChange?: (dirty: boolean) => void;
}

export function MarkdownEditor({ name, initialValue, label, id, onDirtyChange }: MarkdownEditorProps) {
  const editorId = id ?? name;
  const [value, setValue] = useState(initialValue);
  const [history, setHistory] = useState<HistoryState>({ stack: [initialValue], index: 0 });
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const lastPushAt = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const dirty = value !== initialValue;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  const pushSnapshot = useCallback((next: string, { coalesce }: { coalesce: boolean }) => {
    setHistory((h) => {
      const truncated = h.stack.slice(0, h.index + 1);
      if (coalesce && truncated.length > 0) {
        const replaced = truncated.slice(0, -1).concat(next);
        return { stack: replaced, index: replaced.length - 1 };
      }
      const appended = truncated.concat(next).slice(-MAX_HISTORY);
      return { stack: appended, index: appended.length - 1 };
    });
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);

    const prefix = commonPrefixLength(prev, next);
    const suffix = commonSuffixLength(prev, next, prefix);
    const inserted = next.slice(prefix, next.length - suffix);
    const removedLen = prev.length - prefix - suffix;
    const changeSize = Math.max(inserted.length, removedLen);

    const now = Date.now();
    const withinCoalesceWindow = now - lastPushAt.current < COALESCE_MS;
    const hasWhitespace = /\s/.test(inserted);
    const isSingleCharEdit = changeSize <= 1;

    const coalesce = withinCoalesceWindow && isSingleCharEdit && !hasWhitespace;
    pushSnapshot(next, { coalesce });
    lastPushAt.current = now;
  }

  function restoreCaretToEnd() {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        const end = el.value.length;
        el.setSelectionRange(end, end);
        el.focus();
      }
    });
  }

  function undo() {
    setHistory((h) => {
      if (h.index <= 0) return h;
      const index = h.index - 1;
      setValue(h.stack[index] ?? '');
      return { ...h, index };
    });
    restoreCaretToEnd();
  }

  function redo() {
    setHistory((h) => {
      if (h.index >= h.stack.length - 1) return h;
      const index = h.index + 1;
      setValue(h.stack[index] ?? '');
      return { ...h, index };
    });
    restoreCaretToEnd();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    } else if (key === 'z') {
      e.preventDefault();
      undo();
    } else if (key === 'y') {
      e.preventDefault();
      redo();
    }
  }

  const canUndo = history.index > 0;
  const canRedo = history.index < history.stack.length - 1;

  const writeTabId = `${baseId}-write-tab`;
  const previewTabId = `${baseId}-preview-tab`;
  const writePanelId = `${baseId}-write-panel`;
  const previewPanelId = `${baseId}-preview-panel`;

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    const tabs: Array<'write' | 'preview'> = ['write', 'preview'];
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = tabs.length - 1;
    if (nextIdx !== null) {
      e.preventDefault();
      setTab(tabs[nextIdx] as 'write' | 'preview');
      tabRefs.current[nextIdx]?.focus();
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={editorId} className="text-small font-medium text-fg">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Undo"
            data-testid="editor-undo"
            disabled={!canUndo}
            onClick={undo}
            className="inline-flex min-h-8 items-center rounded-md px-2.5 text-micro font-medium text-fg-secondary hover:bg-surface-sunken hover:text-fg disabled:opacity-50"
          >
            Undo
          </button>
          <button
            type="button"
            aria-label="Redo"
            data-testid="editor-redo"
            disabled={!canRedo}
            onClick={redo}
            className="inline-flex min-h-8 items-center rounded-md px-2.5 text-micro font-medium text-fg-secondary hover:bg-surface-sunken hover:text-fg disabled:opacity-50"
          >
            Redo
          </button>
        </div>
      </div>

      {/* Mobile: ARIA tabs for Write / Preview. Desktop (lg+): split view, tabs hidden. */}
      <div role="tablist" aria-label="Markdown editor view" className="mb-2 flex gap-1 lg:hidden">
        {(['write', 'preview'] as const).map((t, idx) => (
          <button
            key={t}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            id={t === 'write' ? writeTabId : previewTabId}
            aria-selected={tab === t}
            aria-controls={t === 'write' ? writePanelId : previewPanelId}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={(e) => handleTabKeyDown(e, idx)}
            className={
              tab === t
                ? 'relative inline-flex min-h-9 items-center px-3 text-small font-medium text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent'
                : 'relative inline-flex min-h-9 items-center px-3 text-small font-medium text-fg-secondary hover:text-fg'
            }
          >
            {t === 'write' ? 'Write' : 'Preview'}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          role="tabpanel"
          id={writePanelId}
          aria-labelledby={writeTabId}
          tabIndex={0}
          className={tab === 'write' ? 'block' : 'hidden lg:block'}
        >
          <textarea
            ref={textareaRef}
            id={editorId}
            data-testid="markdown-editor-input"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="num min-h-[60vh] w-full rounded-md border border-border-strong bg-surface-sunken px-3 py-2.5 text-small leading-6 text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
          />
        </div>
        <div
          role="tabpanel"
          id={previewPanelId}
          aria-labelledby={previewTabId}
          tabIndex={0}
          className={`min-h-[60vh] rounded-md border border-border bg-surface p-4 ${tab === 'preview' ? 'block' : 'hidden lg:block'}`}
        >
          <div data-testid="markdown-preview">
            <MarkdownView markdown={value} />
          </div>
        </div>
      </div>

      <input type="hidden" name={name} value={value} readOnly />
      {dirty && <p className="mt-2 text-small text-fg-muted">Unsaved changes</p>}
    </div>
  );
}
