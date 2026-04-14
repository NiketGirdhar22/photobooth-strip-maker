import { FILTER_OPTIONS, getPreviewFilterStyle } from '../utils/filters';
import type { CapturedPhoto, FilterOption } from '../types';

interface CapturedPhotoCardProps {
  photo: CapturedPhoto;
  index: number;
  onFilterChange: (photoId: string, nextFilter: FilterOption) => void;
}

export const CapturedPhotoCard = ({ photo, index, onFilterChange }: CapturedPhotoCardProps) => {
  return (
    <article className="animate-rise rounded-2xl border border-white/10 bg-noir-900/70 p-3">
      <div className="relative mb-2 overflow-hidden rounded-xl border border-white/10">
        <img
          src={photo.dataUrl}
          alt={`Captured ${index + 1}`}
          className="aspect-[4/5] w-full object-cover"
          style={{ filter: getPreviewFilterStyle(photo.filter) }}
        />
        <span className="absolute left-2 top-2 rounded-md bg-noir-950/80 px-2 py-1 text-xs font-semibold text-zinc-100">
          Shot {index + 1}
        </span>
      </div>

      <label className="block text-xs font-medium uppercase tracking-[0.12em] text-zinc-300">
        Effect
        <select
          value={photo.filter}
          onChange={(event) => onFilterChange(photo.id, event.target.value as FilterOption)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-noir-950/70 px-2 py-2 text-sm text-zinc-100 outline-none transition focus:border-brass-300"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
};
