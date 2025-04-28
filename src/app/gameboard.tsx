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
    PixelCoord,
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
    64: "#f65e3b",
    128: "#edcf72",
    256: "#edcc61",
    512: "#edc850",
    1024: "#edc53f",
    2048: "#edc22e",
};

const VALUE_TO_FOREGROUND_COLOR: Record<number, string> = {
    2: "#776e65",
    4: "#776e65",
    8: "#f9f6f2",
    16: "#f9f6f2",
    32: "#f9f6f2",
    64: "#f9f6f2",
    128: "#f9f6f2",
    256: "#f9f6f2",
    512: "#f9f6f2",
    1024: "#f9f6f2",
    2048: "#f9f6f2",
};

const VALUE_TO_FONT_SIZE: Record<number, string> = {
    2: "36px",
    4: "36px",
    8: "36px",
    16: "34px",
    32: "34px",
    64: "34px",
    128: "32px",
    256: "32px",
    512: "32px",
    1024: "28px",
    2048: "28px",
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

    // keyboard controls
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

    // swipe controls
    const [touchStart, setTouchStart] = useState<PixelCoord | null>(null);
    useEffect(() => {
        const attemptSwipe = (dx: number, dy: number) => {
            if (dx ** 2 + dy ** 2 < 100) {
                setTouchStart(null);
                return;
            }

            if (Math.abs(dx) > Math.abs(dy)) {
                swipe(dx > 0 ? AXIAL_UP_RIGHT : AXIAL_UP_LEFT);
            } else {
                swipe(dy > 0 ? AXIAL_DOWN : AXIAL_UP);
            }
            setTouchStart(null);
        };

        const handleTouchStart = (e: TouchEvent) => {
            setTouchStart([e.touches[0].clientX, e.touches[0].clientY]);
        };
        const handleTouchEnd = (e: TouchEvent) => {
            if (!touchStart) return;
            const touchEnd = [
                e.changedTouches[0].clientX,
                e.changedTouches[0].clientY,
            ];
            const dx = touchEnd[0] - touchStart[0];
            const dy = touchEnd[1] - touchStart[1];

            if (Math.abs(dx) > Math.abs(dy)) {
                swipe(dx > 0 ? AXIAL_UP_RIGHT : AXIAL_UP_LEFT);
            } else {
                swipe(dy > 0 ? AXIAL_DOWN : AXIAL_UP);
            }
            setTouchStart(null);
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchend", handleTouchEnd);

        // add mouse support
        const handleMouseDown = (e: MouseEvent) => {
            setTouchStart([e.clientX, e.clientY]);
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (!touchStart) {
                setTouchStart(null);
                return;
            }

            const touchEnd = [e.clientX, e.clientY];
            const dx = touchEnd[0] - touchStart[0];
            const dy = touchEnd[1] - touchStart[1];
        };
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);

            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    });

    return (
        <div className="relative scale-60 md:scale-100 -my-16 touch-none">
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
                <div className="absolute left-1/2 top-1/2 w-0 h-0 select-none">
                    {GRID_COORDS.map((axial) => (
                        <HexBackground key={axial.toString()} axial={axial} />
                    ))}

                    <AnimatePresence mode={"popLayout"}>
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
            className="absolute z-10"
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
                zIndex: 5,
            }}
            transition={{
                type: "spring",
                duration: 0.3,
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
