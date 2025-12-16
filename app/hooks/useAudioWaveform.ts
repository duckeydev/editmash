import { useEffect, useState } from "react";
import { mediaCache } from "../store/mediaCache";

interface WaveformOptions {
	sourceIn?: number;
	sourceDuration?: number;
}

export function useAudioWaveform(src: string, sampleCount: number = 100, options: WaveformOptions = {}): { min: number; max: number }[] {
	const [peaks, setPeaks] = useState<{ min: number; max: number }[]>([]);
	const { sourceIn = 0, sourceDuration } = options;

	useEffect(() => {
		if (!src) return;

		let isCancelled = false;

		const generateWaveform = async () => {
			try {
				let cachedData = mediaCache.getAudio(src);

				if (!cachedData) {
					const pending = mediaCache.getPendingAudio(src);
					if (pending) {
						cachedData = await pending;
					} else {
						const fetchPromise = (async () => {
							const audioContext = new AudioContext();
							const response = await fetch(src);
							const arrayBuffer = await response.arrayBuffer();
							const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

							const rawData = audioBuffer.getChannelData(0);

							let globalMax = 0;
							for (let i = 0; i < rawData.length; i++) {
								const absValue = Math.abs(rawData[i]);
								if (absValue > globalMax) globalMax = absValue;
							}

							const newData = {
								rawData,
								sampleRate: audioBuffer.sampleRate,
								duration: audioBuffer.duration,
								globalMax,
							};
							mediaCache.setAudio(src, newData);
							audioContext.close();
							return newData;
						})();

						mediaCache.setPendingAudio(src, fetchPromise);
						cachedData = await fetchPromise;
					}
				}

				if (isCancelled) return;

				const { rawData, sampleRate, duration: totalDuration, globalMax } = cachedData;

				const startSample = Math.floor(sourceIn * sampleRate);
				const effectiveDuration = sourceDuration !== undefined ? sourceDuration : totalDuration - sourceIn;
				const endSample = Math.min(Math.floor((sourceIn + effectiveDuration) * sampleRate), rawData.length);
				const totalSamples = endSample - startSample;

				if (totalSamples <= 0) {
					setPeaks([]);
					return;
				}

				const samples = sampleCount;
				const blockSize = Math.floor(totalSamples / samples);
				const bipolarPeaks: { min: number; max: number }[] = [];

				for (let i = 0; i < samples; i++) {
					const start = startSample + blockSize * i;
					let min = 0;
					let max = 0;

					for (let j = 0; j < blockSize && start + j < endSample; j++) {
						const sample = rawData[start + j];
						if (sample < min) min = sample;
						if (sample > max) max = sample;
					}

					bipolarPeaks.push({ min, max });
				}

				// normalize peaks to -1 to 1 range
				const normalizedPeaks = bipolarPeaks.map((peak) => ({
					min: globalMax > 0 ? peak.min / globalMax : 0,
					max: globalMax > 0 ? peak.max / globalMax : 0,
				}));

				if (!isCancelled) {
					setPeaks(normalizedPeaks);
				}
			} catch (error) {
				console.error("Error generating waveform:", error);
				setPeaks([]);
			}
		};

		generateWaveform();

		return () => {
			isCancelled = true;
		};
	}, [src, sampleCount, sourceIn, sourceDuration]);

	return peaks;
}
