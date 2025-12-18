"use client";

import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Layers01Icon,
	CircleIcon,
	ArrowLeft01Icon,
	ArrowRight01Icon,
	ArrowUp01Icon,
	ArrowDown01Icon,
	MoveLeftIcon,
	MoveRightIcon,
	ZoomInAreaIcon,
	DropletIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export default function EffectsBrowser() {
	const [activeCategory, setActiveCategory] = useState<string>("Video Transitions");

	const categories = ["Video Transitions", "Audio Transitions", "Titles", "Generators", "Effects"];

	const effects: { id: number; name: string; icon: IconSvgElement }[] = [
		{ id: 1, name: "Cross Dissolve", icon: Layers01Icon },
		{ id: 2, name: "Fade to Black", icon: CircleIcon },
		{ id: 3, name: "Fade to White", icon: CircleIcon },
		{ id: 4, name: "Dip to Color", icon: DropletIcon },
		{ id: 5, name: "Wipe Left", icon: ArrowLeft01Icon },
		{ id: 6, name: "Wipe Right", icon: ArrowRight01Icon },
		{ id: 7, name: "Wipe Up", icon: ArrowUp01Icon },
		{ id: 8, name: "Wipe Down", icon: ArrowDown01Icon },
		{ id: 9, name: "Push", icon: MoveLeftIcon },
		{ id: 10, name: "Slide", icon: MoveRightIcon },
		{ id: 11, name: "Zoom", icon: ZoomInAreaIcon },
		{ id: 12, name: "Blur Transition", icon: Layers01Icon },
	];

	return (
		<ResizablePanelGroup direction="horizontal" className="h-full">
			<ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
				<div className="h-full bg-card border-r border-border">
					<div className="p-2">
						<div className="space-y-1">
							{categories.map((category) => (
								<button
									key={category}
									onClick={() => setActiveCategory(category)}
									className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
										activeCategory === category ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-accent"
									}`}
								>
									{category}
								</button>
							))}
						</div>
					</div>
				</div>
			</ResizablePanel>

			<ResizableHandle />

			<ResizablePanel defaultSize={75}>
				<div className="h-full bg-background overflow-y-auto p-4">
					<div className="space-y-2">
						{effects.map((effect) => (
							<div
								key={effect.id}
								className="flex items-center w-full bg-card border border-border hover:border-muted-foreground/50 rounded-md cursor-pointer group h-11"
								draggable
							>
								<div className="flex items-center justify-center w-11 h-11 flex-shrink-0 border-r border-border">
									<HugeiconsIcon
										icon={effect.icon}
										size={18}
										strokeWidth={1.5}
										className="text-muted-foreground group-hover:text-foreground"
									/>
								</div>

								<div className="flex-1 px-3 text-[13px] font-medium text-muted-foreground group-hover:text-foreground tracking-tight">
									{effect.name}
								</div>
							</div>
						))}
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
