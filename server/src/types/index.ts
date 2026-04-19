export type FilterOption = 'original' | 'vintage' | 'bw';
export type StripFontOption = 'aesthetic' | 'royal' | 'vintage' | 'script' | 'typewriter';

export interface GenerateStripPayload {
  photos: string[];
  filters: FilterOption[];
  text?: string;
  layout: 3 | 4;
  stripColor?: string;
  textFont?: StripFontOption;
  textSize?: number;
}
