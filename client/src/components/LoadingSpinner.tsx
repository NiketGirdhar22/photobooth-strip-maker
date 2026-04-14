export const LoadingSpinner = () => {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-zinc-200">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-brass-200" />
      Generating strip...
    </div>
  );
};
