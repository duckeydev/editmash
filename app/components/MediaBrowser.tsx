"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function MediaBrowser() {
  const [activeFolder, setActiveFolder] = useState<string | null>("All");

  const folders = ["All", "Footage", "Audio", "Graphics", "Titles", "Effects"];

  const clips = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Clip ${i + 1}`,
    thumbnail: `https://picsum.photos/seed/${i + 1}/320/180`,
  }));

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
        <div className="h-full bg-[#1e1e1e] border-r border-zinc-800">
          <div className="p-2">
            <button className="w-full px-4 py-2 text-left text-sm text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 rounded transition-colors">
              Master
            </button>
          </div>

          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50} minSize={5}>
              <div className="h-full bg-[#1a1a1a] p-2">
                {/* Empty panel */}
              </div>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={50} minSize={5}>
              <div className="h-full flex flex-col bg-[#1e1e1e]">
                <div className="px-3 py-2 text-xs font-medium text-zinc-400 border-b border-zinc-800">
                  Power Bins
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => setActiveFolder(folder)}
                        className={`w-full px-3 py-2 text-left text-sm rounded transition-colors flex items-center gap-2 ${
                          activeFolder === folder
                            ? "bg-blue-600/20 text-blue-400"
                            : "text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="flex-shrink-0"
                        >
                          <path
                            d="M2 3.5C2 2.67157 2.67157 2 3.5 2H6L7 4H12.5C13.3284 4 14 4.67157 14 5.5V12.5C14 13.3284 13.3284 14 12.5 14H3.5C2.67157 14 2 13.3284 2 12.5V3.5Z"
                            fill="currentColor"
                            fillOpacity="0.3"
                            stroke="currentColor"
                            strokeWidth="1"
                          />
                        </svg>
                        {folder}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={75}>
        <div className="h-full bg-[#1a1a1a] overflow-y-auto p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, 155px)', justifyContent: 'space-evenly' }}>
            {clips.map((clip) => (
              <div
                key={clip.id}
                className="group cursor-pointer w-[155px]"
              >
                <div className="w-[155px] h-[90px] bg-zinc-800 rounded overflow-hidden mb-2 hover:ring-2 hover:ring-blue-500">
                  <img
                    src={clip.thumbnail}
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-zinc-400 group-hover:text-zinc-200 text-center">
                  {clip.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
