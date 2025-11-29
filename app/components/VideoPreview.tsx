"use client";

export default function VideoPreview() {
  return (
    <div className="h-full bg-[#1a1a1a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-full max-w-4xl aspect-video bg-black/50 rounded border border-zinc-800 flex items-center justify-center mb-4">
          <p className="text-zinc-600">Video Preview</p>
        </div>
      </div>
    </div>
  );
}
