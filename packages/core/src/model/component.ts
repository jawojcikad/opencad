import { Identifiable, Named, UUID } from './base';

export interface Component extends Identifiable, Named {
  description: string;
  /** Component value (e.g., "10kΩ", "100nF"). */
  value: string;
  /** Reference designator prefix (e.g., "R", "C", "U"). */
  reference: string;
  /** UUID of the linked Symbol definition. */
  symbolId: UUID;
  /** UUID of the linked Footprint definition. */
  footprintId: UUID;
  /** Optional UUID of a 3-D model. */
  model3dId?: UUID;
  /** Arbitrary key/value properties (manufacturer, datasheet URL, …). */
  properties: Record<string, string>;
}
