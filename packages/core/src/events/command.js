/**
 * Manages an undo/redo stack of {@link Command}s.
 */
export class CommandHistory {
    undoStack = [];
    redoStack = [];
    /**
     * Execute a command and push it onto the undo stack.
     * Clears the redo stack (new action diverges from any redo history).
     */
    execute(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack.length = 0;
    }
    /**
     * Undo the most recent command.
     * @returns `true` if a command was undone, `false` if the stack was empty.
     */
    undo() {
        const command = this.undoStack.pop();
        if (!command)
            return false;
        command.undo();
        this.redoStack.push(command);
        return true;
    }
    /**
     * Redo the most recently undone command.
     * @returns `true` if a command was redone, `false` if the stack was empty.
     */
    redo() {
        const command = this.redoStack.pop();
        if (!command)
            return false;
        command.execute();
        this.undoStack.push(command);
        return true;
    }
    canUndo() {
        return this.undoStack.length > 0;
    }
    canRedo() {
        return this.redoStack.length > 0;
    }
    clear() {
        this.undoStack.length = 0;
        this.redoStack.length = 0;
    }
    getUndoStack() {
        return this.undoStack;
    }
    getRedoStack() {
        return this.redoStack;
    }
}
//# sourceMappingURL=command.js.map