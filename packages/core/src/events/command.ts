/**
 * A reversible action that can be executed and undone.
 */
export interface Command {
  execute(): void;
  undo(): void;
  readonly description: string;
}

/**
 * Manages an undo/redo stack of {@link Command}s.
 */
export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  /**
   * Execute a command and push it onto the undo stack.
   * Clears the redo stack (new action diverges from any redo history).
   */
  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  /**
   * Undo the most recent command.
   * @returns `true` if a command was undone, `false` if the stack was empty.
   */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /**
   * Redo the most recently undone command.
   * @returns `true` if a command was redone, `false` if the stack was empty.
   */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.execute();
    this.undoStack.push(command);
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }

  getUndoStack(): readonly Command[] {
    return this.undoStack;
  }

  getRedoStack(): readonly Command[] {
    return this.redoStack;
  }
}
