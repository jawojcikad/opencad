export var PinType;
(function (PinType) {
    PinType[PinType["Input"] = 0] = "Input";
    PinType[PinType["Output"] = 1] = "Output";
    PinType[PinType["Bidirectional"] = 2] = "Bidirectional";
    PinType[PinType["Passive"] = 3] = "Passive";
    PinType[PinType["PowerInput"] = 4] = "PowerInput";
    PinType[PinType["PowerOutput"] = 5] = "PowerOutput";
    PinType[PinType["OpenCollector"] = 6] = "OpenCollector";
    PinType[PinType["OpenEmitter"] = 7] = "OpenEmitter";
    PinType[PinType["NotConnected"] = 8] = "NotConnected";
    PinType[PinType["Unspecified"] = 9] = "Unspecified";
})(PinType || (PinType = {}));
export var PinShape;
(function (PinShape) {
    PinShape[PinShape["Line"] = 0] = "Line";
    PinShape[PinShape["Clock"] = 1] = "Clock";
    PinShape[PinShape["Inverted"] = 2] = "Inverted";
    PinShape[PinShape["InvertedClock"] = 3] = "InvertedClock";
})(PinShape || (PinShape = {}));
//# sourceMappingURL=pin.js.map