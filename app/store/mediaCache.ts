// Audio waveform cache
// Manages caching of decoded audio data for waveform generation
// to be used foro ther stuff too, but for now just waveform

const MAX_CACHE_ENTRIES = 500;
const MAX_CACHE_BYTES = 150 * 1024 * 1024;

export interface AudioData {
	rawData: Float32Array;
	sampleRate: number;
	duration: number;
	globalMax: number;
}

interface CacheEntry {
	data: AudioData;
	byteSize: number;
	timestamp: number;
}

class MediaCache {
	private cache = new Map<string, CacheEntry>();
	private pendingAudio = new Map<string, Promise<AudioData>>();
	private totalBytes = 0;
	private hits = 0;
	private misses = 0;

	private evictIfNeeded(): void {
		const evicted: string[] = [];

		while (this.cache.size > MAX_CACHE_ENTRIES || this.totalBytes > MAX_CACHE_BYTES) {
			if (this.cache.size === 0) break;

			const oldestKey = this.cache.keys().next().value;
			if (oldestKey) {
				const entry = this.cache.get(oldestKey);
				if (entry) {
					this.totalBytes -= entry.byteSize;
					evicted.push(oldestKey);
				}
				this.cache.delete(oldestKey);
			}
		}

		if (evicted.length > 0) {
			console.log(`[MediaCache] Evicted ${evicted.length} entries | ${this.formatBytes(this.totalBytes)} used`);
		}
	}

	private formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes}B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
	}

	getAudio(src: string): AudioData | null {
		const entry = this.cache.get(src);

		if (entry) {
			this.hits++;
			return entry.data;
		}

		this.misses++;
		return null;
	}

	getPendingAudio(src: string): Promise<AudioData> | null {
		return this.pendingAudio.get(src) || null;
	}

	setPendingAudio(src: string, promise: Promise<AudioData>): void {
		this.pendingAudio.set(src, promise);
		promise.finally(() => this.pendingAudio.delete(src));
	}

	setAudio(src: string, data: AudioData): void {
		const byteSize = data.rawData.byteLength;

		const entry: CacheEntry = {
			data,
			byteSize,
			timestamp: Date.now(),
		};

		this.cache.set(src, entry);
		this.totalBytes += byteSize;
		this.evictIfNeeded();

		console.log(
			`[MediaCache] Audio cached: ${this.formatBytes(byteSize)} | Total: ${this.formatBytes(this.totalBytes)} (${this.cache.size} entries)`
		);
	}

	clear(): void {
		const prevSize = this.cache.size;
		const prevBytes = this.totalBytes;

		this.cache.clear();
		this.totalBytes = 0;

		console.log(`[MediaCache] Cleared ${prevSize} entries (${this.formatBytes(prevBytes)} freed)`);
	}

	getStats(): {
		entries: number;
		bytes: number;
		maxEntries: number;
		maxBytes: number;
		hitRate: string;
	} {
		const total = this.hits + this.misses;
		const hitRate = total > 0 ? `${((this.hits / total) * 100).toFixed(1)}%` : "N/A";

		return {
			entries: this.cache.size,
			bytes: this.totalBytes,
			maxEntries: MAX_CACHE_ENTRIES,
			maxBytes: MAX_CACHE_BYTES,
			hitRate,
		};
	}

	logStats(): void {
		const stats = this.getStats();
		console.log(
			`[MediaCache] Stats: ${stats.entries}/${stats.maxEntries} entries | ${this.formatBytes(stats.bytes)}/${this.formatBytes(
				stats.maxBytes
			)} | Hit rate: ${stats.hitRate}`
		);
	}
}

export const mediaCache = new MediaCache();

if (typeof window !== "undefined") {
	(window as unknown as { __mediaCache: MediaCache }).__mediaCache = mediaCache;
}
