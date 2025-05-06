import { ClientOnly } from "@/lib/client-only";
import { Gameboard } from "./gameboard";

export default function Home() {
    return (
        <>
            <div className="h-12"></div>
            <div className="my-auto">
                <ClientOnly>
                    <Gameboard />
                </ClientOnly>
            </div>
            <div className="h-24"></div>
        </>
    );
}
