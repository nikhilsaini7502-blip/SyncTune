import { useEffect, useState } from 'react';

export interface DominantColors {
  primary: string;       // e.g. "rgb(234, 88, 12)"
  secondary: string;     // e.g. "rgb(194, 65, 12)"
  glowRgba: string;      // e.g. "rgba(234, 88, 12, 0.4)"
  borderRgba: string;    // e.g. "rgba(234, 88, 12, 0.25)"
  hex: string;
}

// Preset vibrant harmonic palettes for fallback or fast instant response
const CURATED_PALETTES: Record<string, { primary: [number, number, number]; secondary: [number, number, number] }> = {
  b1: { primary: [245, 158, 11], secondary: [217, 119, 6] },   // Kesariya (Golden Saffron)
  b2: { primary: [225, 29, 72], secondary: [159, 18, 57] },    // Brown Munde (Crimson Red)
  b3: { primary: [219, 39, 119], secondary: [147, 51, 234] },  // Chaleya (Vibrant Pink / Purple)
  b4: { primary: [16, 185, 129], secondary: [5, 150, 105] },   // Illuminati (Emerald Neon)
  b5: { primary: [234, 88, 12], secondary: [180, 83, 9] },     // Pasoori (Sunset Amber)
  b6: { primary: [59, 130, 246], secondary: [147, 51, 234] },  // Apna Bana Le (Deep Blue & Violet)
  g1: { primary: [239, 68, 68], secondary: [220, 38, 38] },    // Blinding Lights (80s Red Neon)
  g2: { primary: [14, 165, 233], secondary: [2, 132, 199] },   // Shape of You (Bright Cyan)
  g3: { primary: [168, 85, 247], secondary: [99, 102, 241] },  // Starboy (Electric Purple)
  l1: { primary: [139, 92, 246], secondary: [59, 130, 246] },  // Lo-Fi Night (Chill Indigo)
  l2: { primary: [236, 72, 153], secondary: [168, 85, 247] },  // Synthwave (Neon Pink/Magenta)
};

const DEFAULT_PALETTE: DominantColors = {
  primary: 'rgb(16, 185, 129)',
  secondary: 'rgb(13, 148, 136)',
  glowRgba: 'rgba(16, 185, 129, 0.35)',
  borderRgba: 'rgba(16, 185, 129, 0.25)',
  hex: '#10b981',
};

// Generates a stable pleasant hue from any string
function getFallbackFromHash(str: string): DominantColors {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  const primaryRgb = hslToRgb(hue, 0.75, 0.5);
  const secondaryRgb = hslToRgb((hue + 40) % 360, 0.7, 0.45);

  return {
    primary: `rgb(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]})`,
    secondary: `rgb(${secondaryRgb[0]}, ${secondaryRgb[1]}, ${secondaryRgb[2]})`,
    glowRgba: `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, 0.35)`,
    borderRgba: `rgba(${primaryRgb[0]}, ${primaryRgb[1]}, ${primaryRgb[2]}, 0.25)`,
    hex: rgbToHex(primaryRgb[0], primaryRgb[1], primaryRgb[2]),
  };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function useThumbnailColors(
  thumbnailUrl?: string,
  trackId?: string,
  trackTitle?: string
): DominantColors {
  const [colors, setColors] = useState<DominantColors>(() => {
    if (trackId && CURATED_PALETTES[trackId]) {
      const p = CURATED_PALETTES[trackId];
      return {
        primary: `rgb(${p.primary.join(',')})`,
        secondary: `rgb(${p.secondary.join(',')})`,
        glowRgba: `rgba(${p.primary.join(',')}, 0.35)`,
        borderRgba: `rgba(${p.primary.join(',')}, 0.25)`,
        hex: rgbToHex(p.primary[0], p.primary[1], p.primary[2]),
      };
    }
    return DEFAULT_PALETTE;
  });

  useEffect(() => {
    // 1. Check curated preset
    if (trackId && CURATED_PALETTES[trackId]) {
      const p = CURATED_PALETTES[trackId];
      setColors({
        primary: `rgb(${p.primary.join(',')})`,
        secondary: `rgb(${p.secondary.join(',')})`,
        glowRgba: `rgba(${p.primary.join(',')}, 0.35)`,
        borderRgba: `rgba(${p.primary.join(',')}, 0.25)`,
        hex: rgbToHex(p.primary[0], p.primary[1], p.primary[2]),
      });
      return;
    }

    if (!thumbnailUrl) {
      setColors(getFallbackFromHash(trackTitle || 'music'));
      return;
    }

    // 2. Extract colors dynamically from image using offscreen canvas
    let isCancelled = false;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = thumbnailUrl;

    img.onload = () => {
      if (isCancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setColors(getFallbackFromHash(thumbnailUrl));
          return;
        }

        ctx.drawImage(img, 0, 0, 24, 24);
        const data = ctx.getImageData(0, 0, 24, 24).data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let validPixels = 0;

        // Sample vibrant pixels (skip nearly black or pure white)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const brightness = (r + g + b) / 3;

          // Reject extreme darks (brightness < 35) or washed out whites (brightness > 240)
          if (brightness >= 35 && brightness <= 240 && max - min > 15) {
            totalR += r;
            totalG += g;
            totalB += b;
            validPixels++;
          }
        }

        if (validPixels > 5) {
          const avgR = Math.round(totalR / validPixels);
          const avgG = Math.round(totalG / validPixels);
          const avgB = Math.round(totalB / validPixels);

          // Boost saturation slightly for glow richness
          const secR = Math.min(255, Math.round(avgR * 0.85 + avgG * 0.15));
          const secG = Math.min(255, Math.round(avgG * 0.85 + avgB * 0.15));
          const secB = Math.min(255, Math.round(avgB * 0.85 + avgR * 0.15));

          setColors({
            primary: `rgb(${avgR}, ${avgG}, ${avgB})`,
            secondary: `rgb(${secR}, ${secG}, ${secB})`,
            glowRgba: `rgba(${avgR}, ${avgG}, ${avgB}, 0.38)`,
            borderRgba: `rgba(${avgR}, ${avgG}, ${avgB}, 0.28)`,
            hex: rgbToHex(avgR, avgG, avgB),
          });
        } else {
          setColors(getFallbackFromHash(thumbnailUrl));
        }
      } catch (err) {
        // If canvas is tainted due to CORS on external host, fallback safely
        setColors(getFallbackFromHash(thumbnailUrl));
      }
    };

    img.onerror = () => {
      if (!isCancelled) {
        setColors(getFallbackFromHash(trackTitle || thumbnailUrl));
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [thumbnailUrl, trackId, trackTitle]);

  return colors;
}
