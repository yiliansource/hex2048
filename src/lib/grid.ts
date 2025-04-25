import { immer } from "zustand/middleware/immer";
import { AxialCoord } from "./hex";
import { range } from "./util";
import { create } from "zustand";
import clone from "clone";

export const GRID_RADIUS = 3;

export const GRID_COORDS = range(2 * GRID_RADIUS - 1).flatMap((r) =>
    range(2 * GRID_RADIUS - 1)
        .map((q) => [r - GRID_RADIUS + 1, q - GRID_RADIUS + 1] as AxialCoord)
        .filter(isInGrid),
);

interface CellState {
    id: number;
    axial: AxialCoord;
    value: number;
}

interface GameState {
    cells: CellState[];
    maxCellId: number;

    spawnNewCell(): void;
    swipe(direction: AxialCoord): void;
}

export const useGameStore = create<GameState>()(
    immer((set, get) => ({
        cells: [],
        maxCellId: 0,

        spawnNewCell: () => {
            const cells = get().cells;
            const existingPositions = cells.map((c) => c.axial.toString());
            const possiblePositions = GRID_COORDS.filter(
                (c) => !existingPositions.includes(c.toString()),
            );

            const axial =
                possiblePositions[
                    Math.floor(Math.random() * possiblePositions.length)
                ];

            set((draft) => {
                draft.cells.push({ id: draft.maxCellId, axial, value: 2 });
                draft.maxCellId++;
            });
        },
        swipe: (direction) => {
            const cells = clone(get().cells);
            cells.sort((a, b) => {
                const pa = dotProduct(a.axial, direction);
                const pb = dotProduct(b.axial, direction);
                return pb - pa; // descending: further in that direction comes first
            });
            const mutateds = new Set<number>();

            let moves = 0;
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                let cursor = cell.axial;

                while (true) {
                    if (mutateds.has(cell.id)) {
                        break;
                    }

                    cursor = addAxial(cursor, direction);
                    if (!isInGrid(cursor)) {
                        break;
                    }
                    const nextCellIndex = cells.findIndex(
                        (c) => c.axial.toString() === cursor.toString(),
                    );
                    const nextCell = cells[nextCellIndex];

                    if (!nextCell) {
                        console.log(cell);

                        cell.axial = cursor;
                        moves++;
                    }
                    if (nextCell && nextCell.value !== cell.value) {
                        break;
                    }
                    if (nextCell && nextCell.value === cell.value) {
                        if (nextCellIndex <= i) i--;
                        cells.splice(nextCellIndex, 1);
                        moves++;
                        mutateds.add(cell.id);

                        cell.axial = cursor;
                        cell.value *= 2;
                    }
                }
            }

            if (moves > 0) {
                set((draft) => {
                    draft.cells = cells;
                });

                get().spawnNewCell();
            }
        },
    })),
);

export function dotProduct(a: AxialCoord, b: AxialCoord): number {
    return a[0] * b[0] + a[1] * b[1];
}

export function isInGrid(axial: AxialCoord): boolean {
    const [q, r] = axial;
    return (
        q > -GRID_RADIUS &&
        q < GRID_RADIUS &&
        r > -GRID_RADIUS &&
        r < GRID_RADIUS &&
        q + r > -GRID_RADIUS &&
        q + r < GRID_RADIUS
    );
}

export function addAxial(a: AxialCoord, b: AxialCoord): AxialCoord {
    return [a[0] + b[0], a[1] + b[1]];
}
