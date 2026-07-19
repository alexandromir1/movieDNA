export interface ImageViewerTransform {
  scale: number;
  x: number;
  y: number;
}

export const IMAGE_VIEWER_MIN_SCALE = 1;
export const IMAGE_VIEWER_MAX_SCALE = 4;
/** Двойной клик / тап: 100% ⇄ 200% */
export const IMAGE_VIEWER_DOUBLE_TAP_SCALE = 2;
export const IMAGE_VIEWER_OPEN_MS = 280;
