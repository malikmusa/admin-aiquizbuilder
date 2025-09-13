import { useEffect, useMemo, useRef, useState } from 'react';

type Plan = 'free' | 'plus' | 'pro';

const OPTIONS = [
  { value: 'mix', label: 'Mixed Types', premium: true },
  { value: 'multiple-choice', label: 'Multiple Choice Only', premium: false },
  { value: 'true-false', label: 'True/False Only', premium: false },
  { value: 'short-answer', label: 'Short Answer Only', premium: true },
  { value: 'fill-in-the-blanks', label: 'Fill in the Blanks', premium: true },
  { value: 'multiple-select', label: 'Multiple Select', premium: true },
];

const LockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export function QuizTypeSelectPlain({
  quizType,
  setQuizType,
  subscription,
}: {
  quizType: string;
  setQuizType: (v: string) => void;
  subscription?: { plan_type?: Plan };
}) {
  const plan: Plan = (subscription?.plan_type as Plan) ?? 'free';
  const hasPremium = plan === 'plus' || plan === 'pro';

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = 'quiz-type-listbox';

  const options = useMemo(() => OPTIONS, []);
  const selectedIndex = options.findIndex((o) => o.value === quizType);

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !listRef.current?.contains(t))
        setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // When opening, set active to current selection
  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(0));
      // Focus list for wheel/arrow convenience
      requestAnimationFrame(() => listRef.current?.focus());
    }
  }, [open]);

  const isLocked = (i: number) => options[i].premium && !hasPremium;

  const firstEnabled = (start: number) => {
    for (let i = start; i < options.length; i++) if (!isLocked(i)) return i;
    return -1;
  };

  const lastEnabled = (start: number) => {
    for (let i = start; i >= 0; i--) if (!isLocked(i)) return i;
    return -1;
  };

  const move = (dir: 1 | -1) => {
    if (!open) setOpen(true);
    let i = activeIndex;
    do {
      i = (i + dir + options.length) % options.length;
    } while (isLocked(i) && i !== activeIndex);
    setActiveIndex(i);
    // Keep the active item visible
    const el = document.getElementById(`${listboxId}-opt-${i}`);
    el?.scrollIntoView({ block: 'nearest' });
  };

  const choose = (i: number) => {
    if (isLocked(i)) return;
    setQuizType(options[i].value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) choose(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    }
  };

  const displayLabel =
    options.find((o) => o.value === quizType)?.label ?? 'Select quiz type';

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onKeyDown={onTriggerKeyDown}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-left text-[#0c4a6e] bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#f5773a] focus:border-[#f5773a] flex items-center gap-2"
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          className="ml-auto h-4 w-4 opacity-70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onListKeyDown}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none"
        >
          {options.map((o, i) => {
            const locked = isLocked(i);
            const selected = i === selectedIndex;
            const active = i === activeIndex;

            return (
              <li
                key={o.value}
                id={`${listboxId}-opt-${i}`}
                role="option"
                aria-selected={selected}
                aria-disabled={locked}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(i)}
                className={[
                  'flex items-center gap-2 px-3 py-2 text-sm',
                  locked
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'cursor-pointer',
                  active ? 'bg-orange-50' : 'bg-transparent',
                ].join(' ')}
              >
                {locked && <LockIcon />}
                <span className={selected ? 'font-medium' : ''}>{o.label}</span>
                {locked && (
                  <span className="ml-auto text-xs text-gray-500">
                    Plus/Pro
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
