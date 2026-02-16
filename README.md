# OpenCAD

Open-source Electronic Design Automation (EDA) tool — a modern alternative to Altium Designer and KiCad, built as a TypeScript monorepo.

## Packages

| Package | Name | Description |
|---------|------|-------------|
| `packages/core` | `@opencad/core` | Core data model and utilities |
| `packages/renderer` | `@opencad/renderer` | 2D rendering engine for schematics and PCB |
| `packages/schematic` | `@opencad/schematic` | Schematic capture editor |
| `packages/pcb` | `@opencad/pcb` | PCB layout editor |
| `packages/library` | `@opencad/library` | Component library management |
| `packages/fileio` | `@opencad/fileio` | File import/export (KiCad, Altium, Gerber, etc.) |
| `packages/viewer3d` | `@opencad/viewer3d` | 3D board viewer |
| `packages/ui` | `@opencad/ui` | React UI components and panels |
| `packages/app` | `@opencad/app` | Main application (Vite + React) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

### Setup

```bash
# Install dependencies
pnpm install

# Start the dev server
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test

# Type-check all packages
pnpm typecheck

# Lint all packages
pnpm lint
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the system design and package dependency graph.

## License

MIT
