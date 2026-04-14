export type FilterOption = 'original' | 'vintage' | 'bw';

export type LayoutOption = 3 | 4;

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  filter: FilterOption;
}
