import { Identifiable, Named, UUID } from './base';

export interface Net extends Identifiable, Named {
  /** Optional reference to a NetClass. */
  classId?: UUID;
}

export interface NetClass extends Identifiable, Named {
  /** Minimum clearance in nanometers. */
  clearance: number;
  /** Default track width in nanometers. */
  trackWidth: number;
  /** Via pad diameter in nanometers. */
  viaDiameter: number;
  /** Via drill diameter in nanometers. */
  viaDrill: number;
  /** Differential-pair track width (nm). */
  diffPairWidth?: number;
  /** Differential-pair gap (nm). */
  diffPairGap?: number;
}
