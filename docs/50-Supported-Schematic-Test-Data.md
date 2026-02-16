# Supported Schematic Files in Test data

Current loaders support:
- KiCad S-expression schematics (`.kicad_sch`)
- Legacy KiCad text schematics (`.sch` starting with `EESchema Schematic File Version ...`)
- Eagle XML schematics (`.sch` with `<!DOCTYPE eagle>`)
- Legacy Eagle binary schematics (`.sch` binary payload) via **experimental approximate import**

In this workspace scan:
- Total schematic-like files: **171**
- Supported by current loaders: **171**
- Unsupported: **0**

## Example directly loadable paths

1. `Test data/A10-OLinuXino-LIME/2. Older hardware revisions/A10-OLinuXino-LIME hardware revision A/A10-OLinuXino-Lime_Rev_A.sch`
2. `Test data/A10-OLinuXino-LIME/2. Older hardware revisions/A10-OLinuXino-LIME hardware revision B/A10-OLinuXino-Lime_Rev_B.sch`
3. `Test data/A10-OLinuXino-LIME/3. Templates and more/A10-OLinuXino-LIME revision B SHIELD TEMPLATE EAGLE/A10-OLinuXino-Lime_Rev-B_SHIELD_TEMPLATE.sch`
4. `Test data/A10-OLinuXino-LIME/3. Templates and more/A10-OLinuXino-LIME revision B SHIELD TEMPLATE KiCAD/A10_OLinuXino_Lime_Rev-B_SHIELD_TEMPLATE.sch`
5. `Test data/A64-OLinuXino/1. Latest hardware revision/A64-OLinuXino hardware revision H/A64-OlinuXino_Rev_H.sch`
6. `Test data/A64-OLinuXino/1. Latest hardware revision/A64-OLinuXino hardware revision H/USB&HDMI,WiFi&BT,Ethernet,LCD.sch`
7. `Test data/A64-OLinuXino/2. Older hardware revisions/A64-OLinuXino hardware revision B/A64-OlinuXino_Rev_B.sch`
8. `Test data/A64-OLinuXino/2. Older hardware revisions/A64-OLinuXino hardware revision D/Power Supply, Extensions and MiPi-DSI .sch`
9. `Test data/LCDs/LCD-DRIVER/Hardware revision D/LCD-DRIVER_Rev_D.sch`
10. `Test data/LCDs/LCD-OLinuXino-15.6FHD/Hardware revision H/LCD-OLinuXino-15.6FHD_Rev_H.sch`
11. `Test data/Lime2-SATA/Lime2-SATA_RevA/Lime2-SATA_RevA.sch`
12. `Test data/STMP157-OLinuXino-LIME2/1. Latest hardware revision/STMP157-OLinuXino-LIME2_Rev_B1/STMP157-OLinuXino-LIME2_Rev_B1.sch`

## Important note on binary Eagle imports

Legacy Eagle binary schematics now open through token extraction and placeholder reconstruction.
This path is intentionally marked approximate and emits warnings in-app.
For authoritative geometry/connectivity, a full deterministic binary decoder is still required.

## Next improvement

Replace the approximate binary path with a deterministic Eagle binary decoder while keeping the same driver interface and corpus tests.
