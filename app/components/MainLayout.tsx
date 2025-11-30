"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import MediaBrowser from "./MediaBrowser";
import EffectsBrowser from "./EffectsBrowser";
import VideoPreview from "./VideoPreview";
import Inspector from "./Inspector";
import Timeline from "./Timeline";
import { Clip } from "../types/timeline";

interface MainLayoutProps {
  showMedia: boolean;
  showEffects: boolean;
}

export default function MainLayout({ showMedia, showEffects }: MainLayoutProps) {
  const bothVisible = showMedia && showEffects;
  const noneVisible = !showMedia && !showEffects;
  const [selectedClip, setSelectedClip] = useState<{ clip: Clip; trackId: string } | null>(null);

  return (
    <div className="h-screen pt-8 bg-[#0a0a0a]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {!noneVisible && (
          <>
            <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
              {bothVisible ? (
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <MediaBrowser />
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <EffectsBrowser />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : showMedia ? (
                <MediaBrowser />
              ) : (
                <EffectsBrowser />
              )}
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        <ResizablePanel defaultSize={noneVisible ? 100 : 60} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60} minSize={30}>
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={70} minSize={40}>
                  <VideoPreview />
                </ResizablePanel>

                <ResizableHandle />

                <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                  <Inspector selectedClip={selectedClip} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={40} minSize={20}>
              <Timeline onClipSelect={setSelectedClip} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
