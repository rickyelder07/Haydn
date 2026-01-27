/**
 * Generic undo/redo history manager for any state type T.
 * Uses structuredClone for immutable snapshots.
 */
export class HistoryManager<T> {
  private history: T[] = [];
  private currentIndex: number = -1;
  private maxHistory: number;

  constructor(initialState: T, maxHistory: number = 100) {
    this.maxHistory = maxHistory;
    this.history = [structuredClone(initialState)];
    this.currentIndex = 0;
  }

  /**
   * Push a new state onto the history stack.
   * Clears any redo states ahead of current position.
   */
  push(state: T): void {
    // Remove any redo history ahead of current position
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new state
    this.history.push(structuredClone(state));
    this.currentIndex++;

    // Cap history at maxHistory
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  /**
   * Move back one state in history.
   * Returns the previous state, or null if at beginning.
   */
  undo(): T | null {
    if (!this.canUndo()) {
      return null;
    }

    this.currentIndex--;
    return structuredClone(this.history[this.currentIndex]);
  }

  /**
   * Move forward one state in history.
   * Returns the next state, or null if at end.
   */
  redo(): T | null {
    if (!this.canRedo()) {
      return null;
    }

    this.currentIndex++;
    return structuredClone(this.history[this.currentIndex]);
  }

  /**
   * Check if undo is available.
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available.
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get the current state without modifying history.
   */
  getCurrent(): T {
    return structuredClone(this.history[this.currentIndex]);
  }

  /**
   * Clear all history and start fresh with new initial state.
   */
  clear(initialState: T): void {
    this.history = [structuredClone(initialState)];
    this.currentIndex = 0;
  }
}
