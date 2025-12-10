"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DragNumberInputProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	className?: string;
	disabled?: boolean;
}

export default function DragNumberInput({
	value,
	onChange,
	min = -Infinity,
	max = Infinity,
	step = 1,
	className,
	disabled = false,
}: DragNumberInputProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [inputValue, setInputValue] = useState(value.toString());
	const dragStartXRef = useRef(0);
	const dragStartValueRef = useRef(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isEditing) {
			setInputValue(value.toFixed(3));
		}
	}, [value, isEditing]);

	const handleMouseDown = (e: React.MouseEvent) => {
		if (disabled || isEditing) return;
		e.preventDefault();
		setIsDragging(true);
		dragStartXRef.current = e.clientX;
		dragStartValueRef.current = value;
	};

	useEffect(() => {
		if (!isDragging) return;

		const handleMouseMove = (e: MouseEvent) => {
			const deltaX = e.clientX - dragStartXRef.current;
			const deltaValue = deltaX * step;
			const newValue = Math.max(min, Math.min(max, dragStartValueRef.current + deltaValue));
			const roundedValue = Math.round(newValue / step) * step;
			onChange(roundedValue);
		};

		const handleMouseUp = () => {
			setIsDragging(false);
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, min, max, step, onChange]);

	const handleDoubleClick = () => {
		if (disabled) return;
		setIsEditing(true);
		setTimeout(() => {
			inputRef.current?.select();
		}, 0);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
	};

	const handleInputBlur = () => {
		setIsEditing(false);
		const numValue = parseFloat(inputValue);
		if (!isNaN(numValue)) {
			const clampedValue = Math.max(min, Math.min(max, numValue));
			onChange(clampedValue);
		} else {
			setInputValue(value.toString());
		}
	};

	const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			inputRef.current?.blur();
		} else if (e.key === "Escape") {
			setInputValue(value.toString());
			setIsEditing(false);
		}
	};

	return (
		<input
			ref={inputRef}
			type="text"
			value={inputValue}
			onChange={handleInputChange}
			onBlur={handleInputBlur}
			onKeyDown={handleInputKeyDown}
			onMouseDown={isEditing ? undefined : handleMouseDown}
			onDoubleClick={handleDoubleClick}
			disabled={disabled}
			className={cn(
				"w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-zinc-200 text-xs h-6 text-center",
				"focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
				isDragging && "cursor-ew-resize select-none",
				!isEditing && !isDragging && "cursor-ew-resize",
				disabled && "opacity-50 cursor-not-allowed",
				className
			)}
			readOnly={!isEditing}
		/>
	);
}
