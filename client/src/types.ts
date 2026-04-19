export type FilterOption = 'original' | 'vintage' | 'bw';

export type LayoutOption = 3 | 4;

export type StripFontOption = 'aesthetic' | 'royal' | 'vintage' | 'script' | 'typewriter';

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  filter: FilterOption;
}
