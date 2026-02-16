import { Vector2D } from '../math/vector2d';
import { Identifiable, Named } from './base';

export enum PinType {
  Input,
  Output,
  Bidirectional,
  Passive,
  PowerInput,
  PowerOutput,
  OpenCollector,
  OpenEmitter,
  NotConnected,
  Unspecified,
}

export enum PinShape {
  Line,
  Clock,
  Inverted,
  InvertedClock,
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
