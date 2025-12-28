'use client';

import { useEffect, useRef } from 'react';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function ModalShell({ open, title, onClose, children }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    // 간단 포커스 이동
    setTimeout(() => panelRef.current?.focus(), 0);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'modal'}
      onMouseDown={(e) => {
        // overlay click close
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[rgb(var(--panel))] shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="text-sm font-semibold text-white/85">{title ?? ''}</div>
          <button
            type="button"
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
