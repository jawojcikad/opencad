import * as THREE from 'three';
// Default dimensions (mm)
const DEFAULT_COMPONENT_HEIGHT = 1.5;
const PIN_RADIUS = 0.15;
const PIN_HEIGHT = 0.8;
export class ComponentBuilder {
    // ---------------------------------------------------------------------------
    // Generic component — auto-sized box from footprint bounding box
    // ---------------------------------------------------------------------------
    buildGenericComponent(footprint, position, rotation, side) {
        const group = new THREE.Group();
        group.name = `component-${footprint.reference ?? 'generic'}`;
        // Estimate body size from pads bounding box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        if (footprint.pads && footprint.pads.length > 0) {
            for (const pad of footprint.pads) {
                const px = pad.position?.x ?? 0;
                const py = pad.position?.y ?? 0;
                const pw = (pad.width ?? 1) / 2;
                const ph = (pad.height ?? pad.width ?? 1) / 2;
                minX = Math.min(minX, px - pw);
                maxX = Math.max(maxX, px + pw);
                minY = Math.min(minY, py - ph);
                maxY = Math.max(maxY, py + ph);
            }
        }
        else {
            minX = -1;
            maxX = 1;
            minY = -0.5;
            maxY = 0.5;
        }
        const bodyW = maxX - minX;
        const bodyL = maxY - minY;
        const bodyH = DEFAULT_COMPONENT_HEIGHT;
        const geo = new THREE.BoxGeometry(bodyW, bodyL, bodyH);
        const mesh = new THREE.Mesh(geo, this.componentBodyMaterial());
        mesh.position.set((minX + maxX) / 2, (minY + maxY) / 2, side === 'top' ? bodyH / 2 : -bodyH / 2);
        group.add(mesh);
        // Position the whole group
        group.position.set(position.x, position.y, side === 'top' ? 1.6 : 0);
        group.rotation.z = (rotation * Math.PI) / 180;
        if (side === 'bottom') {
            group.scale.z = -1;
        }
        return group;
    }
    // ---------------------------------------------------------------------------
    // SMD chip (0402, 0603, 0805, etc.)
    // ---------------------------------------------------------------------------
    buildSMDChip(width, length, height) {
        const geo = new THREE.BoxGeometry(width, length, height);
        geo.translate(0, 0, height / 2);
        const mesh = new THREE.Mesh(geo, this.componentBodyMaterial(0x1a1a1a));
        mesh.name = 'smd-chip';
        return mesh;
    }
    // ---------------------------------------------------------------------------
    // SOIC package
    // ---------------------------------------------------------------------------
    buildSOIC(pinCount, bodyWidth, bodyLength) {
        const group = new THREE.Group();
        group.name = 'soic';
        const bodyHeight = 1.5;
        const body = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyLength, bodyHeight), this.componentBodyMaterial(0x1a1a1a));
        body.position.z = bodyHeight / 2;
        group.add(body);
        // Pins — two rows along Y axis
        const pinsPerSide = pinCount / 2;
        const pitch = 1.27;
        const pinWidth = 0.4;
        const pinLength = 1.0;
        const pinThickness = 0.2;
        for (let side = 0; side < 2; side++) {
            const xSign = side === 0 ? -1 : 1;
            const xPos = xSign * (bodyWidth / 2 + pinLength / 2);
            for (let i = 0; i < pinsPerSide; i++) {
                const yPos = (i - (pinsPerSide - 1) / 2) * pitch;
                const pinGeo = new THREE.BoxGeometry(pinLength, pinWidth, pinThickness);
                const pin = new THREE.Mesh(pinGeo, this.pinMaterial());
                pin.position.set(xPos, yPos, pinThickness / 2);
                group.add(pin);
            }
        }
        // Pin 1 indicator
        const dotGeo = new THREE.CircleGeometry(0.3, 12);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(-bodyWidth / 2 + 0.6, -bodyLength / 2 + 0.6, bodyHeight + 0.01);
        group.add(dot);
        return group;
    }
    // ---------------------------------------------------------------------------
    // QFP package
    // ---------------------------------------------------------------------------
    buildQFP(pinCount, bodySize, pitch) {
        const group = new THREE.Group();
        group.name = 'qfp';
        const bodyHeight = 1.2;
        const body = new THREE.Mesh(new THREE.BoxGeometry(bodySize, bodySize, bodyHeight), this.componentBodyMaterial(0x1a1a1a));
        body.position.z = bodyHeight / 2;
        group.add(body);
        const pinsPerSide = pinCount / 4;
        const pinWidth = pitch * 0.5;
        const pinLength = 1.2;
        const pinThickness = 0.15;
        // Four sides: 0=bottom, 1=right, 2=top, 3=left
        for (let side = 0; side < 4; side++) {
            for (let i = 0; i < pinsPerSide; i++) {
                const offset = (i - (pinsPerSide - 1) / 2) * pitch;
                const pinGeo = new THREE.BoxGeometry(side % 2 === 0 ? pinWidth : pinLength, side % 2 === 0 ? pinLength : pinWidth, pinThickness);
                const pin = new THREE.Mesh(pinGeo, this.pinMaterial());
                let px = 0, py = 0;
                switch (side) {
                    case 0: // bottom edge (-Y)
                        px = offset;
                        py = -(bodySize / 2 + pinLength / 2);
                        break;
                    case 1: // right edge (+X)
                        px = bodySize / 2 + pinLength / 2;
                        py = offset;
                        break;
                    case 2: // top edge (+Y)
                        px = offset;
                        py = bodySize / 2 + pinLength / 2;
                        break;
                    case 3: // left edge (-X)
                        px = -(bodySize / 2 + pinLength / 2);
                        py = offset;
                        break;
                }
                pin.position.set(px, py, pinThickness / 2);
                group.add(pin);
            }
        }
        // Pin 1 indicator
        const dotGeo = new THREE.CircleGeometry(0.4, 12);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(-bodySize / 2 + 0.8, -bodySize / 2 + 0.8, bodyHeight + 0.01);
        group.add(dot);
        return group;
    }
    // ---------------------------------------------------------------------------
    // DIP package
    // ---------------------------------------------------------------------------
    buildDIP(pinCount, rowSpacing, pitch) {
        const group = new THREE.Group();
        group.name = 'dip';
        const pinsPerSide = pinCount / 2;
        const bodyLength = (pinsPerSide - 1) * pitch + 2;
        const bodyWidth = rowSpacing - 2;
        const bodyHeight = 3.5;
        const body = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyLength, bodyHeight), this.componentBodyMaterial(0x1a1a1a));
        body.position.z = bodyHeight / 2;
        group.add(body);
        // Through-hole pins
        for (let side = 0; side < 2; side++) {
            const xPos = (side === 0 ? -1 : 1) * rowSpacing / 2;
            for (let i = 0; i < pinsPerSide; i++) {
                const yPos = (i - (pinsPerSide - 1) / 2) * pitch;
                const pinGeo = new THREE.CylinderGeometry(PIN_RADIUS, PIN_RADIUS, PIN_HEIGHT + bodyHeight, 8);
                pinGeo.rotateX(0); // pins go along Z; cylinder default is along Y, so rotate
                // Actually CylinderGeometry is along Y axis by default. We need along Z.
                const pin = new THREE.Mesh(new THREE.BoxGeometry(PIN_RADIUS * 2, PIN_RADIUS * 2, PIN_HEIGHT + bodyHeight), this.pinMaterial());
                pin.position.set(xPos, yPos, (bodyHeight - PIN_HEIGHT) / 2);
                group.add(pin);
            }
        }
        // Notch indicator
        const notchGeo = new THREE.CircleGeometry(0.5, 16, 0, Math.PI);
        const notchMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
        const notch = new THREE.Mesh(notchGeo, notchMat);
        notch.position.set(0, -bodyLength / 2, bodyHeight + 0.01);
        notch.rotation.z = Math.PI / 2;
        group.add(notch);
        return group;
    }
    // ---------------------------------------------------------------------------
    // Through-hole resistor
    // ---------------------------------------------------------------------------
    buildThroughHoleResistor(bodyLength, bodyDiameter, leadSpacing) {
        const group = new THREE.Group();
        group.name = 'th-resistor';
        // Body — cylinder lying on its side
        const bodyGeo = new THREE.CylinderGeometry(bodyDiameter / 2, bodyDiameter / 2, bodyLength, 16);
        bodyGeo.rotateZ(Math.PI / 2); // align along X
        const body = new THREE.Mesh(bodyGeo, this.componentBodyMaterial(0xd2b48c));
        body.position.z = bodyDiameter / 2 + 1.6; // sit above board
        group.add(body);
        // Color bands (simplified as ring meshes)
        const bandColors = [0xff0000, 0x000000, 0xff0000, 0xffd700]; // R, black, R, gold
        const bandWidth = bodyLength * 0.08;
        for (let i = 0; i < bandColors.length; i++) {
            const bandGeo = new THREE.CylinderGeometry(bodyDiameter / 2 + 0.02, bodyDiameter / 2 + 0.02, bandWidth, 16);
            bandGeo.rotateZ(Math.PI / 2);
            const bandMat = new THREE.MeshStandardMaterial({
                color: bandColors[i],
                roughness: 0.5,
            });
            const band = new THREE.Mesh(bandGeo, bandMat);
            const t = (i + 1) / (bandColors.length + 1) - 0.5;
            band.position.set(t * bodyLength, 0, bodyDiameter / 2 + 1.6);
            group.add(band);
        }
        // Leads
        const leadGeo = new THREE.CylinderGeometry(0.15, 0.15, bodyDiameter + 1.6, 8);
        const leadMat = this.pinMaterial();
        const leftLead = new THREE.Mesh(leadGeo, leadMat);
        leftLead.position.set(-leadSpacing / 2, 0, (bodyDiameter + 1.6) / 2);
        group.add(leftLead);
        const rightLead = new THREE.Mesh(leadGeo, leadMat);
        rightLead.position.set(leadSpacing / 2, 0, (bodyDiameter + 1.6) / 2);
        group.add(rightLead);
        // Horizontal leads connecting body to vertical leads
        const hLeadLen = (leadSpacing - bodyLength) / 2;
        if (hLeadLen > 0) {
            const hLeadGeo = new THREE.CylinderGeometry(0.15, 0.15, hLeadLen, 8);
            hLeadGeo.rotateZ(Math.PI / 2);
            const hLeft = new THREE.Mesh(hLeadGeo, leadMat);
            hLeft.position.set(-bodyLength / 2 - hLeadLen / 2, 0, bodyDiameter / 2 + 1.6);
            group.add(hLeft);
            const hRight = new THREE.Mesh(hLeadGeo, leadMat);
            hRight.position.set(bodyLength / 2 + hLeadLen / 2, 0, bodyDiameter / 2 + 1.6);
            group.add(hRight);
        }
        return group;
    }
    // ---------------------------------------------------------------------------
    // Electrolytic capacitor
    // ---------------------------------------------------------------------------
    buildElectrolyticCap(diameter, height) {
        const group = new THREE.Group();
        group.name = 'electrolytic-cap';
        // Body — upright cylinder
        const bodyGeo = new THREE.CylinderGeometry(diameter / 2, diameter / 2, height, 24);
        bodyGeo.rotateX(Math.PI / 2); // default Y-up → Z-up
        const body = new THREE.Mesh(bodyGeo, this.componentBodyMaterial(0x222222));
        body.position.z = height / 2 + 1.6;
        group.add(body);
        // Polarity stripe
        const stripeGeo = new THREE.CylinderGeometry(diameter / 2 + 0.05, diameter / 2 + 0.05, height * 0.9, 24, 1, true, 0, Math.PI * 0.3);
        stripeGeo.rotateX(Math.PI / 2);
        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            roughness: 0.5,
            side: THREE.DoubleSide,
        });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.z = height / 2 + 1.6;
        group.add(stripe);
        // Top scoring (cross pattern on top)
        const topGeo = new THREE.CircleGeometry(diameter / 2 - 0.2, 24);
        const topMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.z = height + 1.6 + 0.01;
        group.add(top);
        // Two leads
        const leadGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.6 + 1, 8);
        leadGeo.rotateX(Math.PI / 2);
        const leadSpacing = diameter * 0.4;
        const lead1 = new THREE.Mesh(leadGeo.clone(), this.pinMaterial());
        lead1.position.set(-leadSpacing / 2, 0, (1.6 + 1) / 2 - 1);
        group.add(lead1);
        const lead2 = new THREE.Mesh(leadGeo.clone(), this.pinMaterial());
        lead2.position.set(leadSpacing / 2, 0, (1.6 + 1) / 2 - 1);
        group.add(lead2);
        return group;
    }
    // ---------------------------------------------------------------------------
    // Connector pin header
    // ---------------------------------------------------------------------------
    buildConnectorPinHeader(rows, cols, pitch) {
        const group = new THREE.Group();
        group.name = 'pin-header';
        const pinHeight = 6;
        const baseHeight = 2.5;
        const baseWidth = cols * pitch;
        const baseLength = rows * pitch;
        // Plastic base
        const baseGeo = new THREE.BoxGeometry(baseWidth, baseLength, baseHeight);
        const base = new THREE.Mesh(baseGeo, this.componentBodyMaterial(0x1a1a1a));
        base.position.z = baseHeight / 2 + 1.6;
        group.add(base);
        // Pins
        const pinGeo = new THREE.BoxGeometry(0.6, 0.6, pinHeight);
        const pinMat = this.pinMaterial();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const pin = new THREE.Mesh(pinGeo.clone(), pinMat);
                pin.position.set((c - (cols - 1) / 2) * pitch, (r - (rows - 1) / 2) * pitch, pinHeight / 2 + 1.6 - 1);
                group.add(pin);
            }
        }
        return group;
    }
    // ---------------------------------------------------------------------------
    // TO-220 package
    // ---------------------------------------------------------------------------
    buildTO220() {
        const group = new THREE.Group();
        group.name = 'to220';
        const bodyWidth = 10;
        const bodyHeight = 9;
        const bodyThick = 4.5;
        // Main body
        const bodyGeo = new THREE.BoxGeometry(bodyWidth, bodyThick, bodyHeight);
        const body = new THREE.Mesh(bodyGeo, this.componentBodyMaterial(0x1a1a1a));
        body.position.z = bodyHeight / 2 + 1.6;
        group.add(body);
        // Metal tab
        const tabWidth = bodyWidth;
        const tabHeight = 4;
        const tabThick = 0.5;
        const tabGeo = new THREE.BoxGeometry(tabWidth, tabThick, tabHeight);
        const tabMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.2,
        });
        const tab = new THREE.Mesh(tabGeo, tabMat);
        tab.position.set(0, -bodyThick / 2 + tabThick / 2, bodyHeight + tabHeight / 2 + 1.6);
        group.add(tab);
        // Mounting hole in tab
        const holeGeo = new THREE.RingGeometry(1.0, 1.8, 16);
        const holeMat = new THREE.MeshStandardMaterial({
            color: 0x999999,
            metalness: 0.8,
            roughness: 0.3,
            side: THREE.DoubleSide,
        });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(0, -bodyThick / 2 - 0.01, bodyHeight + tabHeight / 2 + 1.6);
        hole.rotation.x = Math.PI / 2;
        group.add(hole);
        // 3 leads
        const leadPitch = 2.54;
        const leadGeo = new THREE.BoxGeometry(0.5, 0.6, 3 + 1.6);
        for (let i = -1; i <= 1; i++) {
            const lead = new THREE.Mesh(leadGeo.clone(), this.pinMaterial());
            lead.position.set(i * leadPitch, 0, (3 + 1.6) / 2 - 1);
            group.add(lead);
        }
        return group;
    }
    // ---------------------------------------------------------------------------
    // Auto-generate: detect component type from footprint name
    // ---------------------------------------------------------------------------
    autoGenerateComponent(footprint) {
        const name = (footprint.reference ?? '' + footprint.value ?? '').toUpperCase();
        const fpName = (footprint.footprintName ?? '').toUpperCase();
        const combined = name + ' ' + fpName;
        const position = footprint.position ?? { x: 0, y: 0 };
        const rotation = footprint.rotation ?? 0;
        const side = footprint.layer === 'B.Cu' || footprint.layer === 'bottom' ? 'bottom' : 'top';
        // Try to match known patterns
        if (/\b(0402|0603|0805|1206|1210|0201)\b/.test(combined)) {
            const sizeMap = {
                '0201': [0.6, 0.3, 0.3],
                '0402': [1.0, 0.5, 0.35],
                '0603': [1.6, 0.8, 0.45],
                '0805': [2.0, 1.25, 0.5],
                '1206': [3.2, 1.6, 0.6],
                '1210': [3.2, 2.5, 0.6],
            };
            for (const [key, [w, l, h]] of Object.entries(sizeMap)) {
                if (combined.includes(key)) {
                    const chip = this.buildSMDChip(w, l, h);
                    const g = new THREE.Group();
                    g.name = `component-${footprint.reference ?? 'chip'}`;
                    g.add(chip);
                    g.position.set(position.x, position.y, side === 'top' ? 1.6 : 0);
                    g.rotation.z = (rotation * Math.PI) / 180;
                    return g;
                }
            }
        }
        if (/\bSOIC|SOP\b/.test(combined)) {
            const pinMatch = combined.match(/(\d+)/);
            const pinCount = pinMatch ? parseInt(pinMatch[1], 10) : 8;
            const comp = this.buildSOIC(pinCount >= 4 ? pinCount : 8, 3.9, pinCount * 0.635 + 1);
            comp.position.set(position.x, position.y, side === 'top' ? 1.6 : 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        if (/\bQFP|TQFP|LQFP\b/.test(combined)) {
            const pinMatch = combined.match(/(\d+)/);
            const pinCount = pinMatch ? Math.max(parseInt(pinMatch[1], 10), 8) : 32;
            const pc = Math.ceil(pinCount / 4) * 4; // ensure divisible by 4
            const comp = this.buildQFP(pc, pc * 0.15 + 4, 0.5);
            comp.position.set(position.x, position.y, side === 'top' ? 1.6 : 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        if (/\bDIP|PDIP\b/.test(combined)) {
            const pinMatch = combined.match(/(\d+)/);
            const pinCount = pinMatch ? Math.max(parseInt(pinMatch[1], 10), 4) : 8;
            const pc = Math.ceil(pinCount / 2) * 2;
            const comp = this.buildDIP(pc, 7.62, 2.54);
            comp.position.set(position.x, position.y, side === 'top' ? 1.6 : 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        if (/\bTO.?220\b/.test(combined)) {
            const comp = this.buildTO220();
            comp.position.set(position.x, position.y, 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        if (/\bCONN|HDR|HEADER|PIN_HEADER\b/.test(combined)) {
            const nums = combined.match(/(\d+)\s*[xX]\s*(\d+)/);
            let rows = 1, cols = 2;
            if (nums) {
                rows = parseInt(nums[1], 10);
                cols = parseInt(nums[2], 10);
            }
            else {
                const pinMatch = combined.match(/(\d+)/);
                if (pinMatch) {
                    cols = parseInt(pinMatch[1], 10);
                }
            }
            const comp = this.buildConnectorPinHeader(Math.max(rows, 1), Math.max(cols, 1), 2.54);
            comp.position.set(position.x, position.y, 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        if (/\bCP|ELEC|ELECTROLYTIC\b/.test(combined)) {
            const comp = this.buildElectrolyticCap(8, 10);
            comp.position.set(position.x, position.y, 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        if (/\bR_AXIAL|RESISTOR_TH\b/.test(combined)) {
            const comp = this.buildThroughHoleResistor(6, 2.2, 10);
            comp.position.set(position.x, position.y, 0);
            comp.rotation.z = (rotation * Math.PI) / 180;
            return comp;
        }
        // Fallback: generic box-shaped component
        return this.buildGenericComponent(footprint, position, rotation, side);
    }
    // ---------------------------------------------------------------------------
    // Materials
    // ---------------------------------------------------------------------------
    componentBodyMaterial(color = 0x2a2a2a) {
        return new THREE.MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: 0.0,
        });
    }
    pinMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0xc0c0c0, // silver
            metalness: 0.85,
            roughness: 0.25,
        });
    }
}
//# sourceMappingURL=component-builder.js.map