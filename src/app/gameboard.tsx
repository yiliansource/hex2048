"use client";

import { GRID_COORDS, GRID_RADIUS, useGameStore } from "@/lib/grid";
import {
    AXIAL_DOWN,
    AXIAL_DOWN_LEFT,
    AXIAL_DOWN_RIGHT,
    AXIAL_UP,
    AXIAL_UP_LEFT,
    AXIAL_UP_RIGHT,
    AxialCoord,
    axialToPixel,
} from "@/lib/hex";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { produce } from "immer";

const TILE_SIZE = 120;
const GAP = 10;
const TILE_PADDED_SIZE = TILE_SIZE + GAP;
const TILE_BACKGROUND_SIZE = TILE_PADDED_SIZE + 12;

const VALUE_TO_BACKGROUND_COLOR: Record<number, string> = {
    2: "#eee4da",
    4: "#ede0c8",
    8: "#f2b179",
    16: "#f59563",
    32: "#f67c5f",
};

const VALUE_TO_FOREGROUND_COLOR: Record<number, string> = {
    2: "#776e65",
    4: "#776e65",
    8: "#f9f6f2",
    16: "#f9f6f2",
    32: "#f9f6f2",
};

const VALUE_TO_FONT_SIZE: Record<number, string> = {
    2: "2rem",
    4: "2rem",
    8: "2rem",
    16: "2rem",
    32: "2rem",
};

const TRACKED_KEYS = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
] as const;

type KEYMAP = Partial<Record<string, boolean>>;

export function Gameboard() {
    const [pressedKeys, setPressedKeys] = useState<KEYMAP>({});
    const [silencedKeys, setSilencedKeys] = useState<KEYMAP>({});

    const { cells, spawnNewCell, swipe } = useGameStore();

    useEffect(() => {
        spawnNewCell();
    }, [spawnNewCell]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (TRACKED_KEYS.includes(e.key as (typeof TRACKED_KEYS)[number])) {
                setPressedKeys(
                    produce((draft) => {
                        draft[e.key] = true;
                    }),
                );
            }

            const isUp = e.key === "ArrowUp";
            const isDown = e.key === "ArrowDown";
            const isLeftModify = !!pressedKeys["ArrowLeft"];
            const isRightModify = !!pressedKeys["ArrowRight"];

            if (!silencedKeys[e.key] && (isUp || isDown)) {
                if (isUp)
                    swipe(
                        isLeftModify
                            ? AXIAL_UP_LEFT
                            : isRightModify
                              ? AXIAL_UP_RIGHT
                              : AXIAL_UP,
                    );
                if (isDown)
                    swipe(
                        isLeftModify
                            ? AXIAL_DOWN_LEFT
                            : isRightModify
                              ? AXIAL_DOWN_RIGHT
                              : AXIAL_DOWN,
                    );

                setSilencedKeys(
                    produce((draft) => {
                        draft[e.key] = true;
                    }),
                );
                setTimeout(() => {
                    setSilencedKeys(
                        produce((draft) => {
                            draft[e.key] = false;
                        }),
                    );
                }, 300);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (TRACKED_KEYS.includes(e.key as (typeof TRACKED_KEYS)[number]))
                setPressedKeys(
                    produce((draft) => {
                        draft[e.key] = false;
                    }),
                );
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    });

    return (
        <div className="relative">
            <div className="absolute text-center">
                {/* {JSON.stringify(pressedKeys)}
                {JSON.stringify(silencedKeys)} */}
            </div>
            <div
                className="relative mx-auto my-8"
                style={{
                    width: `${(GRID_RADIUS * 2 - 1) * TILE_PADDED_SIZE}px`,
                    aspectRatio: `1 / ${Math.cos((30 * Math.PI) / 180)}`,
                }}
            >
                <div className="absolute left-1/2 top-1/2 w-0 h-0">
                    {GRID_COORDS.map((axial) => (
                        <HexBackground key={axial.toString()} axial={axial} />
                    ))}

                    <AnimatePresence>
                        {cells.map(({ id, axial, value }) => (
                            <HexTile key={id} axial={axial} value={value} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function HexBackground({ axial }: { axial: AxialCoord }) {
    const pixel = axialToPixel(axial, TILE_PADDED_SIZE / 2);
    return (
        <div className="absolute">
            <div
                className="absolute hex text-[#9c8978] -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: `${pixel[0]}px`,
                    top: `${pixel[1]}px`,
                    width: `${TILE_BACKGROUND_SIZE}px`,
                }}
            ></div>
            <div
                className="absolute hex text-[#bdac97] -translate-x-1/2 -translate-y-1/2"
                style={{
                    left: `${pixel[0]}px`,
                    top: `${pixel[1]}px`,
                    width: `${TILE_SIZE}px`,
                }}
            ></div>
        </div>
    );
}

function HexTile({ axial, value }: { axial: AxialCoord; value: number }) {
    const pixel = axialToPixel(axial, TILE_PADDED_SIZE / 2);
    return (
        <motion.div
            className="absolute"
            initial={{
                x: pixel[0],
                y: pixel[1],
                scale: 0,
            }}
            animate={{
                x: pixel[0],
                y: pixel[1],
                scale: 1,
            }}
            exit={{
                scale: 0,
            }}
            transition={{
                type: "ease",
            }}
            layout
        >
            <div
                className="absolute hex -translate-x-1/2 -translate-y-1/2"
                style={{
                    width: `${TILE_SIZE}px`,
                    color: VALUE_TO_BACKGROUND_COLOR[value],
                }}
            ></div>
            <span
                className="absolute font-bold -translate-x-1/2 -translate-y-1/2"
                style={{
                    color: VALUE_TO_FOREGROUND_COLOR[value],
                    fontSize: VALUE_TO_FONT_SIZE[value],
                }}
            >
                {value}
            </span>
        </motion.div>
    );
}
