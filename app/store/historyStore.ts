import { TimelineState } from "../types/timeline";

interface HistoryState {
	past: TimelineState[];
	present: TimelineState | null;
	future: TimelineState[];
}

type Listener = () => void;

class HistoryStore {
	private state: HistoryState = {
		past: [],
		present: null,
		future: [],
	};
	private listeners: Set<Listener> = new Set();
	private maxHistorySize = 50;

	subscribe(listener: Listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notify() {
		this.listeners.forEach((listener) => listener());
	}

	getState() {
		return this.state;
	}

	canUndo() {
		return this.state.past.length > 0;
	}

	canRedo() {
		return this.state.future.length > 0;
	}

	push(newState: TimelineState) {
		if (this.state.present && JSON.stringify(this.state.present) === JSON.stringify(newState)) {
			return;
		}

		const newPast = this.state.present ? [...this.state.past, this.state.present] : this.state.past;

		const trimmedPast = newPast.length > this.maxHistorySize ? newPast.slice(-this.maxHistorySize) : newPast;

		this.state = {
			past: trimmedPast,
			present: newState,
			future: [],
		};

		this.notify();
	}

	undo() {
		if (!this.canUndo()) return null;

		const previous = this.state.past[this.state.past.length - 1];
		const newPast = this.state.past.slice(0, -1);

		this.state = {
			past: newPast,
			present: previous,
			future: this.state.present ? [this.state.present, ...this.state.future] : this.state.future,
		};

		this.notify();
		return previous;
	}

	redo() {
		if (!this.canRedo()) return null;

		const next = this.state.future[0];
		const newFuture = this.state.future.slice(1);

		this.state = {
			past: this.state.present ? [...this.state.past, this.state.present] : this.state.past,
			present: next,
			future: newFuture,
		};

		this.notify();
		return next;
	}

	clear() {
		this.state = {
			past: [],
			present: null,
			future: [],
		};
		this.notify();
	}
}

export const historyStore = new HistoryStore();
