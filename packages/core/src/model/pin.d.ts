import { Vector2D } from '../math/vector2d';
import { Identifiable, Named } from './base';
export declare enum PinType {
    Input = 0,
    Output = 1,
    Bidirectional = 2,
    Passive = 3,
    PowerInput = 4,
    PowerOutput = 5,
    OpenCollector = 6,
    OpenEmitter = 7,
    NotConnected = 8,
    Unspecified = 9
}
export declare enum PinShape {
    Line = 0,
    Clock = 1,
    Inverted = 2,
    InvertedClock = 3
}
export interface Pin extends Identifiable, Named {
    /** Physical pin designator (e.g. "1", "A3"). */
    number: string;
    type: PinType;
    shape: PinShape;
    /** Position relative to the parent symbol origin. */
    position: Vector2D;
    /** Visible pin-line length in display units. */
    length: number;
    /** Orientation in degrees — 0, 90, 180, or 270. */
    orientation: number;
}
//# sourceMappingURL=pin.d.ts.map