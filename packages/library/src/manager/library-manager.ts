// --------------------------------------------------------------------------
// packages/library/src/manager/library-manager.ts
// Central library manager: symbols, footprints, components & categories.
// --------------------------------------------------------------------------

import {
  Symbol,
  Footprint,
  Component,
  UUID,
  generateId,
} from '@opencad/core';

import { getAllBuiltinSymbols } from '../symbols/basic-symbols';
import { getAllBuiltinFootprints } from '../footprints/basic-footprints';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LibraryCategory {
  name: string;
  subcategories: LibraryCategory[];
  componentIds: UUID[];
}

/* ------------------------------------------------------------------ */
/*  Default category tree                                              */
/* ------------------------------------------------------------------ */

function defaultCategories(): LibraryCategory[] {
  return [
    {
      name: 'Passive',
      componentIds: [],
      subcategories: [
        { name: 'Resistors', componentIds: [], subcategories: [] },
        { name: 'Capacitors', componentIds: [], subcategories: [] },
        { name: 'Inductors', componentIds: [], subcategories: [] },
        { name: 'Crystals', componentIds: [], subcategories: [] },
      ],
    },
    {
      name: 'Diodes',
      componentIds: [],
      subcategories: [
        { name: 'Standard', componentIds: [], subcategories: [] },
        { name: 'LED', componentIds: [], subcategories: [] },
      ],
    },
    {
      name: 'Transistors',
      componentIds: [],
      subcategories: [
        { name: 'BJT', componentIds: [], subcategories: [] },
        { name: 'MOSFET', componentIds: [], subcategories: [] },
      ],
    },
    {
      name: 'ICs',
      componentIds: [],
      subcategories: [
        { name: 'Op-Amps', componentIds: [], subcategories: [] },
        { name: 'Logic', componentIds: [], subcategories: [] },
        { name: 'Generic', componentIds: [], subcategories: [] },
      ],
    },
    {
      name: 'Connectors',
      componentIds: [],
      subcategories: [
        { name: 'Headers', componentIds: [], subcategories: [] },
        { name: 'USB', componentIds: [], subcategories: [] },
        { name: 'Power', componentIds: [], subcategories: [] },
      ],
    },
    {
      name: 'Power',
      componentIds: [],
      subcategories: [],
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  LibraryManager                                                     */
/* ------------------------------------------------------------------ */

export class LibraryManager {
  private symbols: Map<UUID, Symbol> = new Map();
  private footprints: Map<UUID, Footprint> = new Map();
  private components: Map<UUID, Component> = new Map();
  private categories: LibraryCategory[] = [];

  constructor() {
    this.categories = defaultCategories();
  }

  /* ================================================================ */
  /*  Built-in loading                                                 */
  /* ================================================================ */

  /**
   * Populate the library with all built-in symbols, footprints and
   * convenience components that pair them together.
   */
  loadBuiltins(): void {
    // ── Symbols ──
    const builtinSymbols = getAllBuiltinSymbols();
    for (const s of builtinSymbols) {
      this.symbols.set(s.id, s);
    }

    // ── Footprints ──
    const builtinFootprints = getAllBuiltinFootprints();
    for (const f of builtinFootprints) {
      this.footprints.set(f.id, f);
    }

    // ── Convenience components ──
    // Map well-known symbol names to default footprint names and categories.
    const pairings: {
      symName: string;
      fpName: string;
      compName: string;
      category: string;
    }[] = [
      { symName: 'Resistor',   fpName: 'C_0805',   compName: 'R_0805',         category: 'Passive/Resistors' },
      { symName: 'Capacitor',  fpName: 'C_0805',   compName: 'C_0805',         category: 'Passive/Capacitors' },
      { symName: 'Inductor',   fpName: 'C_1206',   compName: 'L_1206',         category: 'Passive/Inductors' },
      { symName: 'Crystal',    fpName: 'C_0805',   compName: 'Crystal_0805',   category: 'Passive/Crystals' },
      { symName: 'Diode',      fpName: 'SOT-23-3', compName: 'D_SOT-23',       category: 'Diodes/Standard' },
      { symName: 'LED',        fpName: 'C_0805',   compName: 'LED_0805',       category: 'Diodes/LED' },
      { symName: 'NPN',        fpName: 'SOT-23-3', compName: 'NPN_SOT-23',     category: 'Transistors/BJT' },
      { symName: 'PNP',        fpName: 'SOT-23-3', compName: 'PNP_SOT-23',     category: 'Transistors/BJT' },
      { symName: 'N-MOSFET',   fpName: 'SOT-23-3', compName: 'NMOS_SOT-23',    category: 'Transistors/MOSFET' },
      { symName: 'P-MOSFET',   fpName: 'SOT-23-3', compName: 'PMOS_SOT-23',    category: 'Transistors/MOSFET' },
      { symName: 'OpAmp',      fpName: 'SOIC-8',   compName: 'OpAmp_SOIC-8',   category: 'ICs/Op-Amps' },
      { symName: 'AND',        fpName: 'SOIC-14',  compName: 'AND_SOIC-14',    category: 'ICs/Logic' },
      { symName: 'OR',         fpName: 'SOIC-14',  compName: 'OR_SOIC-14',     category: 'ICs/Logic' },
      { symName: 'NOT',        fpName: 'SOIC-14',  compName: 'NOT_SOIC-14',    category: 'ICs/Logic' },
      { symName: 'NAND',       fpName: 'SOIC-14',  compName: 'NAND_SOIC-14',   category: 'ICs/Logic' },
      { symName: 'NOR',        fpName: 'SOIC-14',  compName: 'NOR_SOIC-14',    category: 'ICs/Logic' },
      { symName: 'XOR',        fpName: 'SOIC-14',  compName: 'XOR_SOIC-14',    category: 'ICs/Logic' },
    ];

    const symByName = new Map<string, Symbol>();
    for (const s of builtinSymbols) symByName.set(s.name.toLowerCase(), s);

    const fpByName = new Map<string, Footprint>();
    for (const f of builtinFootprints) fpByName.set(f.name.toLowerCase(), f);

    for (const p of pairings) {
      const s = symByName.get(p.symName.toLowerCase());
      const f = fpByName.get(p.fpName.toLowerCase());
      if (s && f) {
        const comp: Component = {
          id: generateId(),
          name: p.compName,
          description: `${s.name} / ${f.name}`,
          value: '',
          reference: '',
          symbolId: s.id,
          footprintId: f.id,
          properties: {},
        };
        this.components.set(comp.id, comp);
        this.addComponentToCategory(p.category, comp.id);
      }
    }
  }

  /* ================================================================ */
  /*  Symbol operations                                                */
  /* ================================================================ */

  addSymbol(symbol: Symbol): void {
    this.symbols.set(symbol.id, symbol);
  }

  getSymbol(id: UUID): Symbol | undefined {
    return this.symbols.get(id);
  }

  searchSymbols(query: string): Symbol[] {
    const lower = query.toLowerCase();
    const results: Symbol[] = [];
    for (const s of this.symbols.values()) {
      if (s.name.toLowerCase().includes(lower)) {
        results.push(s);
      }
    }
    return results;
  }

  /* ================================================================ */
  /*  Footprint operations                                             */
  /* ================================================================ */

  addFootprint(footprint: Footprint): void {
    this.footprints.set(footprint.id, footprint);
  }

  getFootprint(id: UUID): Footprint | undefined {
    return this.footprints.get(id);
  }

  searchFootprints(query: string): Footprint[] {
    const lower = query.toLowerCase();
    const results: Footprint[] = [];
    for (const f of this.footprints.values()) {
      if (f.name.toLowerCase().includes(lower)) {
        results.push(f);
      }
    }
    return results;
  }

  /* ================================================================ */
  /*  Component operations                                             */
  /* ================================================================ */

  addComponent(component: Component): void {
    this.components.set(component.id, component);
  }

  getComponent(id: UUID): Component | undefined {
    return this.components.get(id);
  }

  searchComponents(query: string): Component[] {
    const lower = query.toLowerCase();
    const results: Component[] = [];
    for (const c of this.components.values()) {
      if (
        c.name.toLowerCase().includes(lower) ||
        (c.description && c.description.toLowerCase().includes(lower))
      ) {
        results.push(c);
      }
    }
    return results;
  }

  getAllComponents(): Component[] {
    return Array.from(this.components.values());
  }

  /* ================================================================ */
  /*  Category management                                              */
  /* ================================================================ */

  getCategories(): LibraryCategory[] {
    return this.categories;
  }

  /**
   * Get components belonging to a category path, e.g. `['Passive', 'Resistors']`.
   * Also includes components from sub-categories recursively.
   */
  getComponentsByCategory(categoryPath: string[]): Component[] {
    const cat = this.findCategory(categoryPath, this.categories);
    if (!cat) return [];
    const ids = this.collectComponentIds(cat);
    return ids
      .map((id) => this.components.get(id))
      .filter((c): c is Component => c !== undefined);
  }

  /* ================================================================ */
  /*  Serialization                                                    */
  /* ================================================================ */

  /** Export the entire library to a JSON string. */
  exportLibrary(): string {
    const data = {
      symbols: Array.from(this.symbols.values()),
      footprints: Array.from(this.footprints.values()),
      components: Array.from(this.components.values()),
      categories: this.categories,
    };
    return JSON.stringify(data, null, 2);
  }

  /** Import a library from a JSON string (merges into current state). */
  importLibrary(json: string): void {
    const data = JSON.parse(json) as {
      symbols?: Symbol[];
      footprints?: Footprint[];
      components?: Component[];
      categories?: LibraryCategory[];
    };

    if (data.symbols) {
      for (const s of data.symbols) this.symbols.set(s.id, s);
    }
    if (data.footprints) {
      for (const f of data.footprints) this.footprints.set(f.id, f);
    }
    if (data.components) {
      for (const c of data.components) this.components.set(c.id, c);
    }
    if (data.categories) {
      this.mergeCategories(this.categories, data.categories);
    }
  }

  /* ================================================================ */
  /*  Private helpers                                                  */
  /* ================================================================ */

  private addComponentToCategory(path: string, componentId: UUID): void {
    const parts = path.split('/');
    const cat = this.findOrCreateCategory(parts, this.categories);
    if (cat && !cat.componentIds.includes(componentId)) {
      cat.componentIds.push(componentId);
    }
  }

  private findCategory(
    path: string[],
    cats: LibraryCategory[],
  ): LibraryCategory | undefined {
    if (path.length === 0) return undefined;
    const first = path[0].toLowerCase();
    const cat = cats.find((c) => c.name.toLowerCase() === first);
    if (!cat) return undefined;
    if (path.length === 1) return cat;
    return this.findCategory(path.slice(1), cat.subcategories);
  }

  private findOrCreateCategory(
    path: string[],
    cats: LibraryCategory[],
  ): LibraryCategory | undefined {
    if (path.length === 0) return undefined;
    const first = path[0];
    let cat = cats.find((c) => c.name.toLowerCase() === first.toLowerCase());
    if (!cat) {
      cat = { name: first, subcategories: [], componentIds: [] };
      cats.push(cat);
    }
    if (path.length === 1) return cat;
    return this.findOrCreateCategory(path.slice(1), cat.subcategories);
  }

  private collectComponentIds(cat: LibraryCategory): UUID[] {
    const ids = [...cat.componentIds];
    for (const sub of cat.subcategories) {
      ids.push(...this.collectComponentIds(sub));
    }
    return ids;
  }

  private mergeCategories(
    target: LibraryCategory[],
    source: LibraryCategory[],
  ): void {
    for (const sc of source) {
      let existing = target.find(
        (t) => t.name.toLowerCase() === sc.name.toLowerCase(),
      );
      if (!existing) {
        existing = { name: sc.name, subcategories: [], componentIds: [] };
        target.push(existing);
      }
      // Merge component IDs (deduplicated)
      for (const id of sc.componentIds) {
        if (!existing.componentIds.includes(id)) {
          existing.componentIds.push(id);
        }
      }
      // Recursively merge subcategories
      this.mergeCategories(existing.subcategories, sc.subcategories);
    }
  }
}
