import { cn } from "@/lib/utils";

export default function ChatBubble({ type = "system", message, time, image }) {
    const isSystem = type === "system";

    return (
        <div className={cn("flex w-full mb-4", isSystem ? "justify-start" : "justify-end")}>
            <div className="flex flex-col max-w-[80%]">
                <div
                    className={cn(
                        "p-3 rounded-lg text-sm shadow-sm",
                        isSystem
                            ? "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                            : "bg-yellow-300 text-black rounded-tr-none" // Kakao style yellow
                    )}
                >
                    {image && (
                        <img
                            src={image}
                            alt="Chat attachment"
                            className="rounded-md mb-2 w-full object-cover max-h-48 border border-black/5"
                        />
                    )}
                    {message && message.split('\n').map((line, i) => (
                        <span key={i} className="block">{line}</span>
                    ))}
                </div>
                <span className={cn(
                    "text-[10px] text-gray-400 mt-1",
                    isSystem ? "text-left leading-none ml-1" : "text-right leading-none mr-1"
                )}>
                    {time}
                </span>
            </div>
        </div>
    );
}
