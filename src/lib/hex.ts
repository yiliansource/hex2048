import { range } from "./util";

export type AxialCoord = [number, number];
export type PixelCoord = [number, number];

export type HexGrid = AxialCoord[][];

export const UNIT_CORNERS: AxialCoord[] = range(6)
    .map((i) => 60 * i - 30)
    .map((deg) => (Math.PI / 180) * deg)
    .map((rad) => [Math.cos(rad), Math.sin(rad)]);

export const AXIAL_UP: AxialCoord = [0, -1];
export const AXIAL_UP_RIGHT: AxialCoord = [+1, -1];
export const AXIAL_DOWN_RIGHT: AxialCoord = [1, 0];
export const AXIAL_DOWN: AxialCoord = [0, 1];
export const AXIAL_DOWN_LEFT: AxialCoord = [-1, 1];
export const AXIAL_UP_LEFT: AxialCoord = [-1, 0];

export function axialToPixel(axial: AxialCoord, size: number): PixelCoord {
    const [q, r] = axial;
    const x = size * ((3 / 2) * q);
    const y = size * ((Math.sqrt(3) / 2) * q + Math.sqrt(3) * r);
    return [x, y];
}

export function pixelToAxial(pixel: PixelCoord, size: number): AxialCoord {
    const [x, y] = pixel;
    const q = ((2 / 3) * x) / size;
    const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / size;
    return [q, r];
}

export function pixelToAxialRounded(
    pixel: PixelCoord,
    size: number,
): AxialCoord {
    const [q, r] = pixelToAxial(pixel, size);
    return [Math.round(q), Math.round(r)];
}

export function directionToAxial(dx: number, dy: number): AxialCoord {
    const thetaRad = Math.atan2(-dy, dx);
    const thetaDeg = (thetaRad * 180) / Math.PI;

    if (thetaDeg >= 0 && thetaDeg <= 60) return AXIAL_UP_RIGHT;
    if (thetaDeg >= 60 && thetaDeg <= 120) return AXIAL_UP;
    if (thetaDeg >= 120 && thetaDeg <= 180) return AXIAL_UP_LEFT;

    if (thetaDeg <= 0 && thetaDeg >= -60) return AXIAL_DOWN_RIGHT;
    if (thetaDeg <= -60 && thetaDeg >= -120) return AXIAL_DOWN;
    if (thetaDeg <= -120 && thetaDeg >= -180) return AXIAL_DOWN_LEFT;

    return [0, 0];
}
