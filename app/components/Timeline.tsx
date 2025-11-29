"use client";

export default function Timeline() {
  return (
    <div className="h-full bg-[#1a1a1a] border-t border-zinc-800 flex flex-col">
      <div className="h-10 bg-[#1e1e1e] border-b border-zinc-800 flex items-center px-4">
        <p className="text-sm text-zinc-400">Timeline</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="min-h-full flex items-center justify-center">
          <p className="text-zinc-600">Timeline tracks</p>
        </div>
      </div>
    </div>
  );
}
