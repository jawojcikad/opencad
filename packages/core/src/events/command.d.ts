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
export declare class CommandHistory {
    private undoStack;
    private redoStack;
    /**
     * Execute a command and push it onto the undo stack.
     * Clears the redo stack (new action diverges from any redo history).
     */
    execute(command: Command): void;
    /**
     * Undo the most recent command.
     * @returns `true` if a command was undone, `false` if the stack was empty.
     */
    undo(): boolean;
    /**
     * Redo the most recently undone command.
     * @returns `true` if a command was redone, `false` if the stack was empty.
     */
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
    clear(): void;
    getUndoStack(): readonly Command[];
    getRedoStack(): readonly Command[];
}
//# sourceMappingURL=command.d.ts.map