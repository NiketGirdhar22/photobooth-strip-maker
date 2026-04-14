import { Router } from 'express';
import multer from 'multer';
import { generatePhotoStrip } from '../services/stripService';
import type { FilterOption, GenerateStripPayload } from '../types';

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

const validatePayload = (body: Record<string, unknown>): GenerateStripPayload => {
  const photos = parseArrayField<string>(body.photos);
  const filters = parseArrayField<FilterOption>(body.filters);
  const layout = parseLayout(body.layout);
  const text = typeof body.text === 'string' ? body.text : '';

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
    layout
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
