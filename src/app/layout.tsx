import type { Metadata } from "next";
import { Geist, Geist_Mono, Rubik } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { MdMenu } from "react-icons/md";
import { IoMenu, IoRefresh } from "react-icons/io5";
import Link from "next/link";

const rubik = Rubik({
    variable: "--font-rubik",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "hex2048",
    description: "a hexgrid version of the game 2048.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={clsx(
                    ...[rubik.className, rubik.variable],
                    `antialiased touch-none`,
                    `bg-[#faf8f0] text-[#9c8a7c]`,
                    `mx-auto max-w-6xl px-3`,
                    `flex flex-col min-h-dvh`,
                )}
            >
                <header className="flex flex-row items-center px-1 md:px-2 py-3 md:py-6 gap-2">
                    {/* <button className="text-xl md:text-2xl">
                        <IoMenu />
                    </button> */}
                    <h1 className="leading-0 text-[26px] md:text-4xl font-bold text-[#756452]">
                        <span>hex</span>
                        <span>2048</span>
                    </h1>
                    <button className="ml-auto text-2xl">
                        <IoRefresh />
                    </button>
                </header>
                <main className="relative flex grow flex-col justify-center">
                    {children}
                </main>
                <footer className="py-2">
                    <p className="text-sm opacity-40">
                        <Link href="https://hornik.dev">
                            made by ian hornik
                        </Link>
                    </p>
                </footer>
            </body>
        </html>
    );
}
