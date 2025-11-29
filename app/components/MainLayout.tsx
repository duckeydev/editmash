"use client";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import MediaBrowser from "./MediaBrowser";
import EffectsBrowser from "./EffectsBrowser";

interface MainLayoutProps {
  showMedia: boolean;
  showEffects: boolean;
}

export default function MainLayout({ showMedia, showEffects }: MainLayoutProps) {
  const bothVisible = showMedia && showEffects;
  const noneVisible = !showMedia && !showEffects;

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
          <div className="h-full bg-[#1a1a1a] flex items-center justify-center">
            <p className="text-zinc-600 text-lg">Workspace area</p>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
