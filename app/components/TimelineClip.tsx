import { Clip } from "../types/timeline";

interface TimelineClipProps {
	clip: Clip;
	trackId: string;
	pixelsPerSecond: number;
	isSelected: boolean;
	isDragging: boolean;
	onSelect: () => void;
	onDragStart: (e: React.MouseEvent, type: "move" | "trim-start" | "trim-end") => void;
}

export default function TimelineClip({ clip, trackId, pixelsPerSecond, isSelected, isDragging, onSelect, onDragStart }: TimelineClipProps) {
	const left = clip.startTime * pixelsPerSecond;
	const width = clip.duration * pixelsPerSecond;

	const handleMouseDown = (e: React.MouseEvent) => {
		e.stopPropagation();

		onSelect();

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;

		let dragType: "move" | "trim-start" | "trim-end" = "move";
		if (clickX < 10) {
			dragType = "trim-start";
		} else if (clickX > width - 10) {
			dragType = "trim-end";
		}

		onDragStart(e, dragType);
	};

	return (
		<div
			className={`absolute h-full cursor-move select-none border-2 rounded ${clip.type === "video" ? "bg-purple-600" : "bg-green-600"} ${
				isSelected ? "border-red-500" : clip.type === "video" ? "border-purple-400" : "border-green-400"
			}`}
			style={{
				left: `${left}px`,
				width: `${width}px`,
				top: "0",
				zIndex: isSelected ? 50 : 10,
			}}
			onMouseDown={handleMouseDown}
			onClick={(e) => e.stopPropagation()}
		>
			<div className="h-full flex items-end px-2 pb-1 overflow-hidden">
				<span className="text-xs text-white truncate">{clip.src.split("/").pop()}</span>
			</div>

			<div
				className="absolute left-0 top-0 w-2 h-full cursor-ew-resize"
				onMouseDown={(e) => {
					e.stopPropagation();
					onSelect();
					onDragStart(e, "trim-start");
				}}
				onClick={(e) => e.stopPropagation()}
			/>
			<div
				className="absolute right-0 top-0 w-2 h-full cursor-ew-resize"
				onMouseDown={(e) => {
					e.stopPropagation();
					onSelect();
					onDragStart(e, "trim-end");
				}}
				onClick={(e) => e.stopPropagation()}
			/>
		</div>
	);
}
