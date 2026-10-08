import type { ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';
import { useUI } from '../state/ui';
import { audio } from '../audio/engine';

const WIDTHS = { sm: 'sm:w-[380px]', md: 'sm:w-[520px]', lg: 'sm:w-[720px]', xl: 'sm:w-[920px]' } as const;

export function Window({
  title,
  icon,
  subtitle,
  width = 'md',
  children,
  footer,
  onClose,
  tabs,
  tab,
  onTab,
  bodyClass = '',
  headerExtra,
}: {
  title: string;
  icon?: string;
  subtitle?: ReactNode;
  width?: keyof typeof WIDTHS;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
  tabs?: { id: string; label: string; icon?: string }[];
  tab?: string;
  onTab?: (id: string) => void;
  bodyClass?: string;
  headerExtra?: ReactNode;
}) {
  const close = onClose ?? (() => useUI.getState().closePanel());
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
      <div
        role="dialog"
        aria-label={title}
        className={`px-shadow pointer-events-auto w-full ${WIDTHS[width]} max-h-[92dvh] sm:max-h-[86vh] flex flex-col px-in`}
      >
        <div className="px-panel flex flex-col min-h-0 max-h-[92dvh] sm:max-h-[86vh]">
          <header className="flex items-center gap-2 px-3 pt-3 pb-2 bg-[var(--color-paper-2)] border-b-2 border-[var(--color-ink)]">
            {icon && <PixelIcon name={icon} size={24} />}
            <div className="flex-1 min-w-0">
              <h2 className="px-title truncate">{title}</h2>
              {subtitle && <div className="text-[12px] leading-tight text-[var(--color-cocoa)] mt-0.5 truncate">{subtitle}</div>}
            </div>
            {headerExtra}
            <button
              className="px-btn px-btn-icon px-btn-sm"
              onClick={() => { audio.sfx('close'); close(); }}
              aria-label="Close"
              title="Close (Esc)"
            >
              <PixelIcon name="close" size={16} />
            </button>
          </header>
          {tabs && (
            <nav className="flex gap-1 px-3 pt-2 bg-[var(--color-paper-2)] border-b-2 border-[var(--color-ink)] overflow-x-auto">
              {tabs.map((t) => (
                <button key={t.id} className="px-tab flex items-center gap-1.5 shrink-0" data-active={t.id === tab} onClick={() => { audio.sfx('click'); onTab?.(t.id); }}>
                  {t.icon && <PixelIcon name={t.icon} size={14} />}
                  {t.label}
                </button>
              ))}
            </nav>
          )}
          <div className={`flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 ${bodyClass}`}>{children}</div>
          {footer && <footer className="px-3 py-2.5 border-t-2 border-[var(--color-ink)] bg-[var(--color-paper-2)]">{footer}</footer>}
        </div>
      </div>
    </div>
  );
}

export function Tickets({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold">
      <PixelIcon name="ticket" size={size} />
      {n}
    </span>
  );
}

export function Empty({ icon = 'sparkle', children }: { icon?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-[var(--color-cocoa)]">
      <PixelIcon name={icon} size={36} className="px-bob" />
      <div className="text-sm max-w-[260px]">{children}</div>
    </div>
  );
}
