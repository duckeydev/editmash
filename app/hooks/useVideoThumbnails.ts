import { useEffect, useState, useRef } from "react";

const thumbnailCache = new Map<string, string[]>();

export function useVideoThumbnails(src: string, duration: number, thumbnailCount: number = 10) {
	const [thumbnails, setThumbnails] = useState<string[]>([]);
	const videoRef = useRef<HTMLVideoElement | null>(null);

	useEffect(() => {
		if (!src) return;

		const cached = thumbnailCache.get(src);
		if (cached) {
			setThumbnails(cached);
			return;
		}

		const video = document.createElement("video");
		video.src = src;
		video.crossOrigin = "anonymous";
		video.muted = true;
		video.preload = "metadata";
		videoRef.current = video;

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 80;
		canvas.height = 45;

		const generatedThumbnails: string[] = [];
		let currentIndex = 0;

		const captureThumbnail = () => {
			if (!ctx || !video) return;

			try {
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
				generatedThumbnails.push(dataUrl);
				currentIndex++;

				if (currentIndex < thumbnailCount) {
					const nextTime = (currentIndex / thumbnailCount) * duration;
					video.currentTime = nextTime;
				} else {
					thumbnailCache.set(src, generatedThumbnails);
					setThumbnails(generatedThumbnails);
					video.remove();
				}
			} catch (err) {
				console.error("Error capturing thumbnail:", err);
			}
		};

		const onSeeked = () => {
			captureThumbnail();
		};

		const onLoadedData = () => {
			captureThumbnail();
		};

		video.addEventListener("loadeddata", onLoadedData);
		video.addEventListener("seeked", onSeeked);

		return () => {
			video.removeEventListener("loadeddata", onLoadedData);
			video.removeEventListener("seeked", onSeeked);
			if (videoRef.current) {
				videoRef.current.remove();
			}
		};
	}, [src, duration, thumbnailCount]);

	return thumbnails;
}
