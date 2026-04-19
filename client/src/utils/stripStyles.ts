import type { StripFontOption } from '../types';

export const STRIP_COLOR_PRESETS: string[] = [
  '#ffffff',
  '#f8f2e6',
  '#f6d8c8',
  '#dce7f8',
  '#d8efe4',
  '#f2dbe6',
  '#e8dfcf',
  '#111111'
];

export const FONT_OPTIONS: Array<{
  value: StripFontOption;
  label: string;
  cssFontFamily: string;
}> = [
  {
    value: 'aesthetic',
    label: 'Aesthetic Sans',
    cssFontFamily: '"Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif'
  },
  {
    value: 'royal',
    label: 'Royal Serif',
    cssFontFamily: 'Georgia, "Times New Roman", serif'
  },
  {
    value: 'vintage',
    label: 'Vintage Garamond',
    cssFontFamily: 'Garamond, "Palatino Linotype", "Book Antiqua", serif'
  },
  {
    value: 'script',
    label: 'Classic Script',
    cssFontFamily: '"Brush Script MT", "Snell Roundhand", cursive'
  },
  {
    value: 'typewriter',
    label: 'Typewriter',
    cssFontFamily: '"Courier New", Courier, monospace'
  }
];

export const getFontFamilyForOption = (font: StripFontOption): string => {
  const matched = FONT_OPTIONS.find((option) => option.value === font);
  return matched?.cssFontFamily ?? FONT_OPTIONS[0].cssFontFamily;
};
