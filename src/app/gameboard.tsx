"use client";

import { GRID_COORDS, GRID_RADIUS, useGameStore } from "@/lib/grid";
import {
    AXIAL_DOWN,
    AXIAL_DOWN_LEFT,
    AXIAL_DOWN_RIGHT,
    AXIAL_UP,
    AXIAL_UP_LEFT,
    AXIAL_UP_RIGHT,
    axialToPixel,
    directionToAxial,
    PixelCoord,
} from "@/lib/hex";
import { useIsMobile } from "@/lib/use-is-mobile";
import { produce } from "immer";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

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

const VALUE_TO_FONT_SIZE_PX: Record<number, number> = {
    2: 36,
    4: 36,
    8: 36,
    16: 34,
    32: 34,
    64: 34,
    128: 32,
    256: 32,
    512: 32,
    1024: 28,
    2048: 28,
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

    const { score, cells, spawnNewCell, swipe } = useGameStore();

    const isMobile = useIsMobile();

    const SCALE_FACTOR = isMobile ? 0.6 : 1;

    const TILE_SIZE = 120 * SCALE_FACTOR;
    const GAP = 10 * SCALE_FACTOR;
    const TILE_PADDED_SIZE = TILE_SIZE + GAP;
    const TILE_BACKGROUND_SIZE = TILE_PADDED_SIZE + 12 * SCALE_FACTOR;

    const [bestScore, setBestScore] = useState(0);

    useEffect(() => {
        setBestScore((best) => Math.max(score, best));
    }, [score]);

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
    const [swipeStart, setSwipeStart] = useState<PixelCoord | null>(null);
    const SWIPE_THRESHOLD = 100 * SCALE_FACTOR;
    useEffect(() => {
        const attemptSwipe = (dx: number, dy: number) => {
            if (dx ** 2 + dy ** 2 < SWIPE_THRESHOLD ** 2) {
                setSwipeStart(null);
                return;
            }

            swipe(directionToAxial(dx, dy));
            setSwipeStart(null);
        };

        const handleTouchStart = (e: TouchEvent) => {
            setSwipeStart([e.touches[0].clientX, e.touches[0].clientY]);
        };
        const handleTouchEnd = (e: TouchEvent) => {
            if (!swipeStart) return;
            attemptSwipe(
                e.changedTouches[0].clientX - swipeStart[0],
                e.changedTouches[0].clientY - swipeStart[1],
            );
        };

        window.addEventListener("touchstart", handleTouchStart);
        window.addEventListener("touchend", handleTouchEnd);

        // add mouse support
        const handleMouseDown = (e: MouseEvent) => {
            setSwipeStart([e.clientX, e.clientY]);
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (!swipeStart) return;
            attemptSwipe(e.clientX - swipeStart[0], e.clientY - swipeStart[1]);
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
        <>
            <div className="absolute top-0 left-0 right-0 flex flex-row gap-2 w-full">
                <div className="grow py-1.5 rounded-xl bg-[#eae7d9]">
                    <div className="text-center">
                        <p className="mb-1 font-medium text-xs leading-none">
                            SCORE
                        </p>
                        <p className="font-bold text-lg leading-none">
                            {score}
                        </p>
                    </div>
                </div>
                <div className="grow py-1.5 rounded-xl ring-2 ring-[#eae7d9]">
                    <div className="text-center">
                        <p className="mb-1 font-medium text-xs leading-none">
                            BEST
                        </p>
                        <p className="font-bold text-lg leading-none">
                            {bestScore}
                        </p>
                    </div>
                </div>
            </div>
            <div
                className="relative mx-auto"
                style={{
                    width: `${(GRID_RADIUS * 2 - 1) * TILE_BACKGROUND_SIZE * (3 / 4)}px`,
                    height: `${((GRID_RADIUS * 2 - 1) * TILE_BACKGROUND_SIZE * Math.sqrt(3)) / 2}px`,
                }}
            >
                <div className="absolute left-1/2 top-1/2 select-none">
                    {GRID_COORDS.map((axial) => {
                        const pixel = axialToPixel(axial, TILE_PADDED_SIZE / 2);
                        return (
                            <div
                                className="absolute"
                                key={axial.toString()}
                                style={{
                                    left: `${pixel[0]}px`,
                                    top: `${pixel[1]}px`,
                                }}
                            >
                                <div
                                    className="absolute hex text-[#9c8978] -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        width: `${TILE_BACKGROUND_SIZE}px`,
                                    }}
                                ></div>
                                <div
                                    className="absolute hex text-[#bdac97] -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                        width: `${TILE_SIZE}px`,
                                    }}
                                ></div>
                            </div>
                        );
                    })}

                    <AnimatePresence mode={"popLayout"}>
                        {cells.map(({ id, axial, value }) => {
                            const pixel = axialToPixel(
                                axial,
                                TILE_PADDED_SIZE / 2,
                            );
                            return (
                                <motion.div
                                    key={id}
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
                                            color: VALUE_TO_BACKGROUND_COLOR[
                                                value
                                            ],
                                        }}
                                    ></div>
                                    <span
                                        className="absolute font-bold -translate-x-1/2 -translate-y-1/2"
                                        style={{
                                            color: VALUE_TO_FOREGROUND_COLOR[
                                                value
                                            ],
                                            fontSize:
                                                VALUE_TO_FONT_SIZE_PX[value] *
                                                (isMobile ? 0.7 : 1),
                                        }}
                                    >
                                        {value}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
