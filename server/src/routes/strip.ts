import { Router } from 'express';
import multer from 'multer';
import { generatePhotoStrip } from '../services/stripService';
import type { FilterOption, GenerateStripPayload, StripFontOption } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const parseArrayField = <T>(field: unknown): T[] => {
  if (Array.isArray(field)) {
    return field as T[];
  }

  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as T[];
      }
    } catch {
      // invalid JSON and will be validated later
    }
  }

  return [];
};

const parseLayout = (layoutValue: unknown): 3 | 4 => {
  const layout = Number(layoutValue);
  if (layout !== 3 && layout !== 4) {
    throw new Error('Layout must be 3 or 4.');
  }

  return layout;
};

const parseStripColor = (rawColor: unknown): string => {
  const fallback = '#FFFFFF';
  if (typeof rawColor !== 'string' || !rawColor.trim()) {
    return fallback;
  }

  const color = rawColor.trim();
  const hexColorRegex = /^#([0-9a-fA-F]{6})$/;
  if (!hexColorRegex.test(color)) {
    throw new Error('stripColor must be a valid 6-digit hex color like #FFFFFF.');
  }

  return color.toUpperCase();
};

const parseTextFont = (rawFont: unknown): StripFontOption => {
  const fallback: StripFontOption = 'royal';
  if (typeof rawFont !== 'string' || !rawFont.trim()) {
    return fallback;
  }

  const validFonts: StripFontOption[] = ['aesthetic', 'royal', 'vintage', 'script', 'typewriter'];
  if (!validFonts.includes(rawFont as StripFontOption)) {
    throw new Error('textFont must be one of aesthetic, royal, vintage, script, typewriter.');
  }

  return rawFont as StripFontOption;
};

const parseTextSize = (rawTextSize: unknown): number => {
  const fallback = 52;
  if (rawTextSize === undefined || rawTextSize === null || rawTextSize === '') {
    return fallback;
  }

  const textSize = Number(rawTextSize);
  if (!Number.isFinite(textSize) || textSize < 30 || textSize > 72) {
    throw new Error('textSize must be a number between 30 and 72.');
  }

  return Math.round(textSize);
};

const validatePayload = (body: Record<string, unknown>): GenerateStripPayload => {
  const photos = parseArrayField<string>(body.photos);
  const filters = parseArrayField<FilterOption>(body.filters);
  const layout = parseLayout(body.layout);
  const text = typeof body.text === 'string' ? body.text : '';
  const stripColor = parseStripColor(body.stripColor);
  const textFont = parseTextFont(body.textFont);
  const textSize = parseTextSize(body.textSize);

  if (!photos.length) {
    throw new Error('Photos are required.');
  }

  if (photos.length !== layout) {
    throw new Error(`Expected exactly ${layout} photos.`);
  }

  if (!filters.length || filters.length !== layout) {
    throw new Error(`Expected exactly ${layout} filters.`);
  }

  const validFilters: FilterOption[] = ['original', 'vintage', 'bw'];
  const hasInvalidFilter = filters.some((value) => !validFilters.includes(value));
  if (hasInvalidFilter) {
    throw new Error('Filters must be one of original, vintage, bw.');
  }

  return {
    photos,
    filters,
    text,
    layout,
    stripColor,
    textFont,
    textSize
  };
};

router.post('/generate-strip', upload.none(), async (req, res) => {
  try {
    const payload = validatePayload(req.body as Record<string, unknown>);
    const stripBuffer = await generatePhotoStrip(payload);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="photo-strip.png"');
    res.status(200).send(stripBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate strip.';
    res.status(400).json({ error: message });
  }
});

export default router;
