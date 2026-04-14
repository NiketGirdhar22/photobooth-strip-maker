export type FilterOption = 'original' | 'vintage' | 'bw';

export interface GenerateStripPayload {
  photos: string[];
  filters: FilterOption[];
  text?: string;
  layout: 3 | 4;
}
