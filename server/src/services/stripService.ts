import sharp from 'sharp';
import type { FilterOption, GenerateStripPayload, StripFontOption } from '../types';

const PHOTO_WIDTH = 900;
const PHOTO_HEIGHT = 1100;
const OUTER_BORDER = 44;
const SPACING = 30;
const TAB_HEIGHT = 180;
const PHOTO_RADIUS = 24;

const VINTAGE_MATRIX: [[number, number, number], [number, number, number], [number, number, number]] = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131]
];

const FONT_STYLES: Record<StripFontOption, { family: string; letterSpacing: number }> = {
  aesthetic: {
    family: '"Avenir Next", "Trebuchet MS", "Helvetica Neue", Arial, sans-serif',
    letterSpacing: 1.05
  },
  royal: {
    family: 'Georgia, "Times New Roman", serif',
    letterSpacing: 1.2
  },
  vintage: {
    family: 'Garamond, "Palatino Linotype", "Book Antiqua", serif',
    letterSpacing: 1.1
  },
  script: {
    family: '"Brush Script MT", "Snell Roundhand", cursive',
    letterSpacing: 0.45
  },
  typewriter: {
    family: '"Courier New", Courier, monospace',
    letterSpacing: 0.7
  }
};

const normalizeBase64 = (input: string): string => {
  const matches = input.match(/^data:image\/[a-zA-Z+]+;base64,(.*)$/);
  return matches ? matches[1] : input;
};

const decodePhoto = (input: string): Buffer => {
  const normalized = normalizeBase64(input).trim();
  return Buffer.from(normalized, 'base64');
};

const sanitizeText = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeXmlAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const clampChannel = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const hexToRgb = (hexColor: string): { r: number; g: number; b: number } => {
  const normalized = hexColor.replace('#', '');
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
};

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }): string =>
  `#${clampChannel(r).toString(16).padStart(2, '0')}${clampChannel(g).toString(16).padStart(2, '0')}${clampChannel(b)
    .toString(16)
    .padStart(2, '0')}`.toUpperCase();

const mixColors = (baseHex: string, overlayHex: string, overlayWeight: number): string => {
  const weight = Math.max(0, Math.min(1, overlayWeight));
  const base = hexToRgb(baseHex);
  const overlay = hexToRgb(overlayHex);

  return rgbToHex({
    r: base.r * (1 - weight) + overlay.r * weight,
    g: base.g * (1 - weight) + overlay.g * weight,
    b: base.b * (1 - weight) + overlay.b * weight
  });
};

const isDarkColor = (hexColor: string): boolean => {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 145;
};

const applyRoundedCorners = async (photo: Buffer): Promise<Buffer> => {
  const maskSvg = Buffer.from(
    `<svg width="${PHOTO_WIDTH}" height="${PHOTO_HEIGHT}"><rect width="100%" height="100%" rx="${PHOTO_RADIUS}" ry="${PHOTO_RADIUS}" fill="white"/></svg>`
  );

  return sharp(photo)
    .composite([
      {
        input: maskSvg,
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();
};

const applyFilter = (pipeline: sharp.Sharp, filter: FilterOption): sharp.Sharp => {
  switch (filter) {
    case 'bw':
      return pipeline.grayscale();
    case 'vintage':
      return pipeline.recomb(VINTAGE_MATRIX).modulate({
        brightness: 1.03,
        saturation: 0.85
      });
    default:
      return pipeline;
  }
};

const processPhoto = async (base64Photo: string, filter: FilterOption): Promise<Buffer> => {
  const input = decodePhoto(base64Photo);

  const filtered = await applyFilter(
    sharp(input).rotate().resize(PHOTO_WIDTH, PHOTO_HEIGHT, {
      fit: 'cover',
      position: 'attention'
    }),
    filter
  )
    .png()
    .toBuffer();

  return applyRoundedCorners(filtered);
};

const buildTextTab = (
  text: string,
  style: { stripColor: string; textFont: StripFontOption; textSize: number }
): Buffer => {
  const safeText = sanitizeText(text.trim());
  const textContent = safeText || ' ';

  const tabFill = mixColors(style.stripColor, '#FFFFFF', isDarkColor(style.stripColor) ? 0.2 : 0.42);
  const tabStroke = mixColors(style.stripColor, '#000000', 0.25);
  const textColor = isDarkColor(tabFill) ? '#F7F7F5' : '#1B1D22';
  const fontStyle = FONT_STYLES[style.textFont] ?? FONT_STYLES.royal;
  const safeFontFamily = sanitizeXmlAttribute(fontStyle.family);

  const tabSvg = `
    <svg width="${PHOTO_WIDTH}" height="${TAB_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="${PHOTO_WIDTH - 2}" height="${TAB_HEIGHT - 2}" rx="18" ry="18" fill="${tabFill}" stroke="${tabStroke}" stroke-width="2" />
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-size="${style.textSize}" font-family="${safeFontFamily}" letter-spacing="${fontStyle.letterSpacing}">
        ${textContent}
      </text>
    </svg>
  `;

  return Buffer.from(tabSvg);
};

export const generatePhotoStrip = async (payload: GenerateStripPayload): Promise<Buffer> => {
  const {
    photos,
    filters,
    text = '',
    layout,
    stripColor = '#FFFFFF',
    textFont = 'royal',
    textSize = 52
  } = payload;

  if (![3, 4].includes(layout)) {
    throw new Error('Layout must be 3 or 4.');
  }

  if (photos.length !== layout) {
    throw new Error(`Expected ${layout} photos.`);
  }

  if (filters.length !== layout) {
    throw new Error(`Expected ${layout} filters.`);
  }

  const processedPhotos = await Promise.all(
    photos.map((photo, index) => {
      const filter = filters[index] ?? 'original';
      return processPhoto(photo, filter);
    })
  );

  const stripWidth = PHOTO_WIDTH + OUTER_BORDER * 2;
  const stripHeight =
    OUTER_BORDER +
    layout * PHOTO_HEIGHT +
    (layout - 1) * SPACING +
    SPACING +
    TAB_HEIGHT +
    OUTER_BORDER;

  const composites: sharp.OverlayOptions[] = processedPhotos.map((photo, index) => ({
    input: photo,
    top: OUTER_BORDER + index * (PHOTO_HEIGHT + SPACING),
    left: OUTER_BORDER
  }));

  const textTabTop = OUTER_BORDER + layout * PHOTO_HEIGHT + (layout - 1) * SPACING + SPACING;
  composites.push({
    input: buildTextTab(text, { stripColor, textFont, textSize }),
    top: textTabTop,
    left: OUTER_BORDER
  });

  return sharp({
    create: {
      width: stripWidth,
      height: stripHeight,
      channels: 4,
      background: stripColor
    }
  })
    .composite(composites)
    .png({
      compressionLevel: 3,
      quality: 100
    })
    .toBuffer();
};
