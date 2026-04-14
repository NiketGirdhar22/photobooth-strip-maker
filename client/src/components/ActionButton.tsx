import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'accent' | 'danger';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const stylesByVariant: Record<ButtonVariant, string> = {
  primary:
    'bg-brass-300 text-noir-950 hover:bg-brass-200 focus-visible:ring-brass-300 disabled:bg-brass-300/35 disabled:text-noir-950/60',
  accent:
    'bg-sky-400 text-noir-950 hover:bg-sky-300 focus-visible:ring-sky-400 disabled:bg-sky-400/35 disabled:text-noir-950/60',
  ghost:
    'bg-white/10 text-zinc-100 hover:bg-white/20 focus-visible:ring-zinc-200 disabled:bg-white/10 disabled:text-zinc-400',
  danger:
    'bg-rose-500/80 text-white hover:bg-rose-400 focus-visible:ring-rose-300 disabled:bg-rose-500/30 disabled:text-rose-200/40'
};

export const ActionButton = ({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ActionButtonProps) => {
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-noir-900 ${stylesByVariant[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
