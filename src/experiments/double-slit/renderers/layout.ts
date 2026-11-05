/** Where everything sits on the stage, in CSS pixels. Pure function of canvas size and parameters. */
import { RANGES, SCREEN_HALF_WIDTH_MM, type DoubleSlitParams } from '../../../physics/double-slit/fraunhofer';
import { stageGeometry, type StageGeometry } from '../../../physics/double-slit/stageField';

export interface StageLayout {
  width: number;
  height: number;
  top: number;
  bottom: number;
  cy: number;
  screenHeight: number;
  sourceX: number;
  slitX: number;
  screenX: number;
  stripWidth: number;
  histX: number;
  histWidth: number;
  slitToScreen: number;
  slitToScreenMin: number;
  slitToScreenMax: number;
  geometry: StageGeometry;
  /** field grid cell size, px */
  cell: number;
  /** columns left of the slits (plane wave) and right of them (slit field) */
  nLeft: number;
  nRight: number;
  ny: number;
}

export function computeLayout(width: number, height: number, p: DoubleSlitParams): StageLayout {
  const pad = Math.max(10, Math.min(20, width * 0.02));
  const top = 34;
  const bottom = height - 30;
  const screenHeight = bottom - top;
  const cy = top + screenHeight / 2;
  const histWidth = Math.round(Math.min(150, Math.max(54, width * 0.14)));
  const stripWidth = 10;
  const histGap = 10;
  const sourceX = pad + 14;
  const slitX = sourceX + Math.max(46, width * 0.13);
  const screenXMax = width - pad - histWidth - histGap - stripWidth;
  const slitToScreenMax = Math.max(40, screenXMax - slitX);
  const slitToScreenMin = slitToScreenMax * 0.5;
  const f =
    (p.screenDistanceM - RANGES.screenDistanceM.min) /
    (RANGES.screenDistanceM.max - RANGES.screenDistanceM.min);
  const slitToScreen = slitToScreenMin + f * (slitToScreenMax - slitToScreenMin);
  const screenX = slitX + slitToScreen;
  // the histogram travels with the screen, so "where they land" always sits right beside it
  const histX = screenX + stripWidth + histGap;
  const geometry = stageGeometry(p, slitToScreen, screenHeight);
  // ~30k field cells keeps rebuilds fast while dragging
  const cell = Math.max(2, Math.ceil(Math.sqrt(((screenX - sourceX) * screenHeight) / 30000)));
  return {
    width,
    height,
    top,
    bottom,
    cy,
    screenHeight,
    sourceX,
    slitX,
    screenX,
    stripWidth,
    histX,
    histWidth,
    slitToScreen,
    slitToScreenMin,
    slitToScreenMax,
    geometry,
    cell,
    nLeft: Math.max(1, Math.ceil((slitX - sourceX) / cell)),
    nRight: Math.max(1, Math.ceil(slitToScreen / cell)),
    ny: Math.max(1, Math.ceil(screenHeight / cell)),
  };
}

/** Screen position (mm, + is up) → canvas y. */
export function screenMmToY(l: StageLayout, yMm: number): number {
  return l.cy - (yMm / SCREEN_HALF_WIDTH_MM) * (l.screenHeight / 2);
}

/** Inverse of the slit-to-screen drawing distance → screen distance in metres. */
export function slitToScreenToMetres(l: StageLayout, px: number): number {
  const f = (px - l.slitToScreenMin) / (l.slitToScreenMax - l.slitToScreenMin);
  return RANGES.screenDistanceM.min + f * (RANGES.screenDistanceM.max - RANGES.screenDistanceM.min);
}
