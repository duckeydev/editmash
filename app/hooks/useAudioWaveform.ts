import { useEffect, useState } from "react";

interface WaveformData {
	peaks: { min: number; max: number }[];
	duration: number;
}

const waveformCache = new Map<string, WaveformData>();

export function useAudioWaveform(src: string, sampleCount: number = 100): { min: number; max: number }[] {
	const [peaks, setPeaks] = useState<{ min: number; max: number }[]>([]);

	useEffect(() => {
		if (!src) return;

		const cacheKey = `${src}-${sampleCount}`;

		if (waveformCache.has(cacheKey)) {
			setPeaks(waveformCache.get(cacheKey)!.peaks);
			return;
		}

		let isCancelled = false;

		const generateWaveform = async () => {
			try {
				const audioContext = new AudioContext();
				const response = await fetch(src);
				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

				if (isCancelled) {
					audioContext.close();
					return;
				}

				const rawData = audioBuffer.getChannelData(0); // first channel
				const samples = sampleCount;
				const blockSize = Math.floor(rawData.length / samples);
				const bipolarPeaks: { min: number; max: number }[] = [];

				for (let i = 0; i < samples; i++) {
					const start = blockSize * i;
					let min = 0;
					let max = 0;

					for (let j = 0; j < blockSize; j++) {
						const sample = rawData[start + j];
						if (sample < min) min = sample;
						if (sample > max) max = sample;
					}

					bipolarPeaks.push({ min, max });
				}

				// normalize peaks to -1 to 1 range
				const globalMax = Math.max(...bipolarPeaks.map((p) => Math.max(Math.abs(p.min), Math.abs(p.max))));
				const normalizedPeaks = bipolarPeaks.map((peak) => ({
					min: globalMax > 0 ? peak.min / globalMax : 0,
					max: globalMax > 0 ? peak.max / globalMax : 0,
				}));

				if (!isCancelled) {
					waveformCache.set(cacheKey, {
						peaks: normalizedPeaks,
						duration: audioBuffer.duration,
					});
					setPeaks(normalizedPeaks);
				}

				audioContext.close();
			} catch (error) {
				console.error("Error generating waveform:", error);
				setPeaks([]);
			}
		};

		generateWaveform();

		return () => {
			isCancelled = true;
		};
	}, [src, sampleCount]);

	return peaks;
}
