import type { LayoutOption } from '../types';

interface LayoutSelectorProps {
  value: LayoutOption;
  onChange: (next: LayoutOption) => void;
}

const LAYOUT_OPTIONS: LayoutOption[] = [3, 4];

export const LayoutSelector = ({ value, onChange }: LayoutSelectorProps) => {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">Strip Layout</p>
      <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
        {LAYOUT_OPTIONS.map((option) => {
          const isActive = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brass-300 text-noir-950'
                  : 'text-zinc-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {option} Photos
            </button>
          );
        })}
      </div>
    </div>
  );
};
