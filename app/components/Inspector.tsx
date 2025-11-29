"use client";

import { useState } from "react";

export default function Inspector() {
  const [activeTab, setActiveTab] = useState<string>("Video");

  const tabs = ["Video", "Audio", "Color", "Effects"];

  return (
    <div className="h-full bg-[#1e1e1e] border-l border-zinc-800 flex flex-col">
      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm ${
              activeTab === tab
                ? "bg-[#2a2a2a] text-zinc-200 border-b-2 border-blue-500"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-zinc-500">Inspector panel - {activeTab}</p>
      </div>
    </div>
  );
}
