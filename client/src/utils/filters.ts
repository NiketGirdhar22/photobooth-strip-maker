import type { FilterOption } from '../types';

export const FILTER_OPTIONS: Array<{ label: string; value: FilterOption }> = [
  { label: 'Original', value: 'original' },
  { label: 'Vintage', value: 'vintage' },
  { label: 'Black & White', value: 'bw' }
];

export const getPreviewFilterStyle = (filter: FilterOption): string => {
  switch (filter) {
    case 'bw':
      return 'grayscale(1) contrast(1.05)';
    case 'vintage':
      return 'sepia(0.58) saturate(0.85) contrast(1.04) brightness(1.02)';
    default:
      return 'none';
  }
};
