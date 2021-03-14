"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertLibraryV6 = exports.convertLibrary = exports.convertText = exports.convertPin = void 0;
var uuid_1 = require("uuid");
var schematic_v6_1 = require("./schematic-v6");
var spectra_1 = require("./spectra");
var svg_arc_1 = require("./svg-arc");
function kiY(coordY) {
    // Eda versus Kicad y-axis coordinates.
    // For Kicad lib is seems to work differently
    // compared to schematics.
    // The mind mind boggles!
    var kiy;
    if (coordY.includes('-')) {
        kiy = coordY.substring(1);
    }
    else {
        kiy = '-' + coordY;
    }
    return kiy;
}
function kiCoords(x, y, transform) {
    if (transform === void 0) { transform = { x: 0, y: 0 }; }
    return {
        x: parseFloat(x) - transform.x,
        // Eda versus Kicad y-axis coordinates
        y: transform.y - parseFloat(y),
    };
}
function kiAt(x, y, angle, parentCoords) {
    var coords = kiCoords(x, y, parentCoords);
    return ['at', schematic_v6_1.kiUnits(coords.x), schematic_v6_1.kiUnits(coords.y), angle];
}
function kiEffects(fontSize, visible, justify, bold, italic) {
    if (visible === void 0) { visible = '1'; }
    if (justify === void 0) { justify = ''; }
    if (bold === void 0) { bold = ''; }
    if (italic === void 0) { italic = ''; }
    // FONT: 1.27 for the best layout in Kicad
    return [
        'effects',
        ['font', ['size', 1.27, 1.27]],
        italic === 'italic' ? 'italic' : null,
        bold === 'bold' ? 'bold' : null,
        justify === 'start' ? ['justify', 'left'] : justify === 'end' ? ['justify', 'right'] : null,
        visible === '1' ? null : 'hide',
    ];
}
function kiFillColor(stroke, fill) {
    if (fill === 'none' || fill === '') {
        return 'none';
    }
    else if (stroke === fill) {
        return 'outline';
    }
    else {
        return 'background';
    }
}
function convertPin(args, parentCoords, symbolProp, conversionState) {
    var pinRotation = 0;
    var segments = args.join('~').split('^^');
    var _a = segments[0].split('~'), pinDisplay = _a[0], pinElectric = _a[1], pinX = _a[3], pinY = _a[4], pinRotate = _a[5], id = _a[6], locked = _a[7];
    var _b = segments[1].split('~'), pinDotX = _b[0], pinDotY = _b[1];
    var _c = segments[2].split('~'), pinPath = _c[0], pinColor = _c[1];
    var _d = segments[3].split('~'), nameVisible = _d[0], nameX = _d[1], nameY = _d[2], nameRotation = _d[3], nameText = _d[4], nameAnchor = _d[5], nameFont = _d[6], nameFontSize = _d[7];
    var _e = segments[4].split('~'), numberVisible = _e[0], numberX = _e[1], numberY = _e[2], numberRotation = _e[3], numberText = _e[4], numberAnchor = _e[5], numberFont = _e[6], numberFontSize = _e[7];
    var _f = segments[5].split('~'), dotVisible = _f[0], dotX = _f[1], dotY = _f[2];
    var _g = segments[6].split('~'), clockVisible = _g[0], clockPath = _g[1];
    // pinElectric=0 has been set to passive not to undefined for ERC reasons
    var electricType = {
        0: 'passive',
        1: 'input',
        2: 'output',
        3: 'bidirectional',
        4: 'power_in',
    };
    var graphicStyle = {
        '00': 'line',
        '01': 'clock',
        '10': 'inverted',
        '11': 'inverted_clock',
    };
    var pinLength = '0';
    var orientation = 'h';
    var startPoint = '0';
    var result = /^M\s*([-\d.\s]+)([h|v])\s*([-\d.\s]+)$/.exec(pinPath.replace(/[,\s]+/g, ' '));
    if (result != null) {
        startPoint = result[1], orientation = result[2], pinLength = result[3];
    }
    else {
        var msg = "Warning: pin (" + id + ")" + (parentCoords.id !== undefined ? " of " + parentCoords.id : '') + ": could not determine pin location; pin ignored ";
        return schematic_v6_1.reportError(msg, conversionState);
    }
    // inverted pins have a length minus 6; add this to the length
    var pinlength = parseFloat(pinLength);
    var length;
    dotVisible === '1'
        ? pinlength > 0
            ? (length = pinlength + 6)
            : (length = pinlength - 6)
        : (length = pinlength);
    // Eda allows pins with zero length but seems to ignores them
    // Kicad will show them, so we ignore them.
    if (pinLength === '0') {
        var msg = "Warning: pin (" + id + ")" + (parentCoords.id !== undefined ? " of " + parentCoords.id : '') + " with length = 0 found in symbol; pin ignored ";
        return schematic_v6_1.reportError(msg, conversionState);
    }
    if (pinElectric === '4') {
        var msg = "Warning: pinElectric = power; power_in is assumed for pin " + nameText + " (" + id + ")" + (parentCoords.id !== undefined ? " of " + parentCoords.id : '') + '\\nAdjust symbol electric properties when needed based on ERC check.';
        schematic_v6_1.reportError(msg, conversionState, 2);
    }
    var _h = startPoint.split(' '), startX = _h[0], startY = _h[1];
    if (orientation === 'h') {
        if (parseFloat(startX) === parseFloat(pinX) && parseFloat(pinLength) < 0) {
            pinRotation = 180;
        }
        else if (parseFloat(startX) === parseFloat(pinX) && parseFloat(pinLength) > 0) {
            pinRotation = 0;
        }
        else if (parseFloat(startX) !== parseFloat(pinX) && parseFloat(pinLength) < 0) {
            pinRotation = 0;
        }
        else if (parseFloat(startX) !== parseFloat(pinX) && parseFloat(pinLength) > 0) {
            pinRotation = 180;
        }
    }
    if (orientation === 'v') {
        if (parseFloat(startY) === parseFloat(pinY) && parseFloat(pinLength) < 0) {
            pinRotation = 90;
        }
        else if (parseFloat(startY) === parseFloat(pinY) && parseFloat(pinLength) > 0) {
            pinRotation = 270;
        }
        else if (parseFloat(startY) !== parseFloat(pinY) && parseFloat(pinLength) < 0) {
            pinRotation = 270;
        }
        else if (parseFloat(startY) !== parseFloat(pinY) && parseFloat(pinLength) > 0) {
            pinRotation = 90;
        }
    }
    // no individual pin/name hide in Kicad; base hide on overall hide status
    if (nameVisible === '1') {
        symbolProp.pinNameShowCount += 1;
    }
    else {
        symbolProp.pinNameHideCount += 1;
    }
    if (numberVisible === '1') {
        symbolProp.pinNumberShowCount += 1;
    }
    else {
        symbolProp.pinNumberHideCount += 1;
    }
    // note: Jan 2021; no color support for name & number fields
    return [
        '_LF3_',
        [
            'pin',
            electricType[pinElectric],
            graphicStyle[dotVisible + clockVisible],
            kiAt(pinDotX, pinDotY, pinRotation, parentCoords),
            ['length', Math.abs(schematic_v6_1.kiUnits(length))],
            '_LF4_',
            ['name', nameText === '' ? '~' : nameText, kiEffects(nameFontSize)],
            '_LF4_',
            ['number', numberText, kiEffects(numberFontSize)],
        ],
    ];
}
exports.convertPin = convertPin;
function convertRect(args, parentCoords) {
    var x = args[0], y = args[1], width = args[4], height = args[5], strokeColor = args[6], strokeWidth = args[7], fillColor = args[9], id = args[10], locked = args[11];
    var start = kiCoords(x, y, parentCoords);
    var endX = start.x + parseFloat(width);
    var endY = start.y - parseFloat(height);
    var fill = 'outline';
    return [
        '_LF3_',
        [
            'rectangle',
            ['start', schematic_v6_1.kiUnits(start.x), schematic_v6_1.kiUnits(start.y)],
            ['end', schematic_v6_1.kiUnits(endX), schematic_v6_1.kiUnits(endY)],
            ['stroke', ['width', 0]],
            ['fill', ['type', kiFillColor(strokeColor, fillColor)]],
        ],
    ];
}
function convertCircle(args, parentCoords) {
    var cx = args[0], cy = args[1], radius = args[2], strokeColor = args[3], strokeWidth = args[4], fillColor = args[6], id = args[7], locked = args[8];
    var center = kiCoords(cx, cy, parentCoords);
    return [
        '_LF3_',
        [
            'circle',
            ['center', schematic_v6_1.kiUnits(center.x), schematic_v6_1.kiUnits(center.y)],
            ['radius', schematic_v6_1.kiUnits(radius)],
            ['stroke', ['width', 0]],
            ['fill', ['type', kiFillColor(strokeColor, fillColor)]],
        ],
    ];
}
function convertEllipse(args, parentCoords, conversionState) {
    var cx = args[0], cy = args[1], rx = args[2], ry = args[3], strokeColor = args[4], strokeWidth = args[5], fillColor = args[7], id = args[8], locked = args[9];
    if (rx === ry) {
        var center = kiCoords(cx, cy, parentCoords);
        return [
            '_LF3_',
            [
                'circle',
                ['center', schematic_v6_1.kiUnits(center.x), schematic_v6_1.kiUnits(center.y)],
                ['radius', schematic_v6_1.kiUnits(rx)],
                ['stroke', ['width', 0]],
                ['fill', ['type', kiFillColor(strokeColor, fillColor)]],
            ],
        ];
    }
    else {
        var msg = "Warning: shape E (ellips) with unequal radiuses (" + id + ")" + (parentCoords.id !== undefined ? " of " + parentCoords.id : '') + " in symbol; not supported by Kicad";
        return schematic_v6_1.reportError(msg, conversionState);
    }
}
function convertArc(args, parentCoords, conversionState) {
    var path = args[0], strokeColor = args[2], strokeWidth = args[3], fillColor = args[5], id = args[6], locked = args[7];
    var startPoint;
    var arcParams;
    var result = /^M\s*([-\d.\s]+)A\s*([-\d.\s]+)$/.exec(path.replace(/[,\s]+/g, ' '));
    if (result != null) {
        startPoint = result[1], arcParams = result[2];
    }
    else {
        var msg = "Warning: arc (" + id + ")" + (parentCoords.id !== undefined ? " of " + parentCoords.id : '') + ": could not determine arc shape; arc ignored ";
        return schematic_v6_1.reportError(msg, conversionState);
    }
    // note: Kicad schematics uses a different (strange?) arc configuraton than the pcb version.
    // It seems not possible to create arcs over 180 degrees.
    // Conversion of eda svg to Kicad is at best marginal
    var _a = startPoint.split(' '), startX = _a[0], startY = _a[1];
    var _b = arcParams.split(' '), svgRx = _b[0], svgRy = _b[1], xAxisRotation = _b[2], largeArc = _b[3], sweep = _b[4], endX = _b[5], endY = _b[6];
    var start = kiCoords(startX, startY, parentCoords);
    var end = kiCoords(endX, endY, parentCoords);
    var _c = { x: parseFloat(svgRx), y: parseFloat(svgRy) }, rx = _c.x, ry = _c.y;
    if (sweep) {
        var save = start;
        start = end;
        end = save;
    }
    var _d = svg_arc_1.computeArc(start.x, start.y, rx, ry, parseFloat(xAxisRotation), largeArc === '1', sweep === '1', end.x, end.y), cx = _d.cx, cy = _d.cy, extent = _d.extent;
    return [
        '_LF3_',
        [
            'arc',
            ['start', schematic_v6_1.kiUnits(start.x), schematic_v6_1.kiUnits(start.y)],
            ['end', schematic_v6_1.kiUnits(end.x), schematic_v6_1.kiUnits(end.y)],
            [
                'radius',
                ['at', schematic_v6_1.kiUnits(cx), schematic_v6_1.kiUnits(cy)],
                ['length', schematic_v6_1.kiUnits(rx)],
            ],
            ['stroke', ['width', 0]],
            ['fill', ['type', kiFillColor(strokeColor, fillColor)]],
        ],
    ];
}
function pointListToPolygon(points, closed, strokeColor, fillColor, parentCoords) {
    if (closed === void 0) { closed = false; }
    if (parentCoords === void 0) { parentCoords = { x: 0, y: 0 }; }
    var polygonPoints = [];
    for (var i = 0; i < points.length; i += 2) {
        var coords = kiCoords(points[i], points[i + 1], parentCoords);
        polygonPoints.push(['xy', schematic_v6_1.kiUnits(coords.x), schematic_v6_1.kiUnits(coords.y)]);
    }
    if (closed) {
        var coords = kiCoords(points[0], points[1], parentCoords);
        polygonPoints.push(['xy', schematic_v6_1.kiUnits(coords.x), schematic_v6_1.kiUnits(coords.y)]);
    }
    return [
        '_LF3_',
        [
            'polyline',
            __spreadArrays(['pts'], polygonPoints),
            ['stroke', ['width', 0]],
            ['fill', ['type', kiFillColor(strokeColor, fillColor)]],
        ],
    ];
}
function convertPolyline(args, parentCoords) {
    var points = args[0], strokeColor = args[1], strokeWidth = args[2], fillColor = args[4], id = args[5], locked = args[6];
    return __spreadArrays(pointListToPolygon(points.split(' '), false, strokeColor, fillColor, parentCoords));
}
function convertPolygon(args, parentCoords) {
    var points = args[0], strokeColor = args[1], strokeWidth = args[2], fillColor = args[4], id = args[5], locked = args[6];
    return __spreadArrays(pointListToPolygon(points.split(' '), true, strokeColor, fillColor, parentCoords));
}
function convertPath(args, parentCoords, conversionState) {
    var points = args[0], strokeColor = args[1], strokeWidth = args[2], fillColor = args[4], id = args[5], locked = args[6];
    var closed = false;
    if (/[A,C,H,Q,S,V]/gi.exec(points)) {
        var msg = "Warning: PT (path) with arcs/circles (" + id + ")" + (parentCoords.id !== undefined ? " of " + parentCoords.id : '') + " in symbol; not supported by Kicad";
        return schematic_v6_1.reportError(msg, conversionState);
    }
    if (/[Z]/gi.exec(points)) {
        closed = true;
    }
    var filteredPoints = points.split(/[ ,LMZ]/).filter(function (p) { return !isNaN(parseFloat(p)); });
    return __spreadArrays(pointListToPolygon(filteredPoints, closed, strokeColor, fillColor, parentCoords));
}
function convertLine(args, parentCoords) {
    var sx = args[0], sy = args[1], ex = args[2], ey = args[3], strokeColor = args[4], strokeWidth = args[5], fillColor = args[7], id = args[8], locked = args[9];
    var points = [sx, sy, ex, ey];
    return __spreadArrays(pointListToPolygon(points, true, strokeColor, fillColor, parentCoords));
}
function convertText(args, parentCoords) {
    var type = args[0], x = args[1], y = args[2], rotation = args[3], fontSize = args[6], fontWeigth = args[7], fontStyle = args[8], spice = args[10], text = args[11], visable = args[12], textAnchor = args[13], id = args[14], locked = args[15];
    if (type === 'L') {
        var coords = kiCoords(x, y, parentCoords);
        // note: Jan 2021; no color support for text fields
        return [
            '_LF3_',
            [
                'text',
                text,
                // possible error in Kicad: angle 90 is in config 900
                ['at', schematic_v6_1.kiUnits(coords.x), schematic_v6_1.kiUnits(coords.y), rotation === '90' ? 900 : 0],
                kiEffects(fontSize, visable, textAnchor, fontWeigth, fontStyle),
            ],
        ];
    }
    else {
        return null;
    }
}
exports.convertText = convertText;
function convertAnnotations(args, parentCoords, compProp, conversionState) {
    var type = args[0], x = args[1], y = args[2], rotation = args[3], fontSize = args[6], text = args[11], visible = args[12];
    var k = '';
    var numbr = 0;
    var prop;
    if (type === 'P' || type === 'N') {
        if (type === 'P') {
            k = 'Reference';
            numbr = 0;
            if (text.indexOf('.') > 0) {
                var msg = "Warning: multipart shape " + text + " found on schematics; not yet supported." +
                    '\\nDrawn parts cannot share one footprint. Current solution: ' +
                    '\\nCreate new multi-unit symbol and paste existing symbols into the units' +
                    '\\nChange symbols in schematics with the new units of the multi-part symbol.';
                schematic_v6_1.reportError(msg, conversionState, 4);
            }
            prop = "" + text.replace(/[0-9\.]/g, '');
            compProp.ref = text;
            compProp.pre = prop;
        }
        if (type === 'N') {
            k = 'Value';
            numbr = 1;
            prop = '';
            compProp.value = text;
        }
        compProp.component = [
            '_LF1_',
            [
                'property',
                k,
                text,
                ['id', numbr],
                kiAt(x, kiY(y), 0),
                kiEffects(fontSize, visible, 'start'),
            ],
        ];
    }
    else {
        compProp.component = [];
        return [];
    }
    return [
        '_LF2_',
        [
            'property',
            k,
            prop,
            ['id', numbr],
            ['at', 0, 0, 0],
            ['effects', ['font', ['size', 1.27, 1.27]], visible === '1' ? null : 'hide'],
        ],
    ];
}
function convertHead(head, compProp) {
    var libProperties = [];
    var numbr;
    var hide;
    var properties = {
        Reference: ['pre', 0, ''],
        Value: ['name', 1, ''],
        Footprint: ['package', 2, 'hide'],
        // Datasheet: ['', 3, 'hide'], NOT AVAILABLE
        ki_keywords: ['name', 4, 'hide'],
        ki_description: ['BOM_Manufacturer', 5, 'hide'],
    };
    compProp.value = '';
    Object.keys(properties).forEach(function (key) {
        var libkey = properties[key][0];
        if (head.c_para.hasOwnProperty(libkey)) {
            numbr = properties[key][1];
            hide = properties[key][2];
            var prop = head.c_para[libkey];
            switch (key) {
                case 'Reference':
                    prop = prop.split('?')[0];
                    break;
                case 'Value':
                    compProp.value = prop;
                    compProp.lib = prop;
                    break;
                case 'ki_keywords':
                    prop = prop.split('(')[0];
                    break;
                case 'ki_description':
                    prop = 'part manufactured by: ' + prop;
            }
            libProperties.push([
                '_LF2_',
                [
                    'property',
                    key,
                    prop,
                    ['id', numbr],
                    ['at', 0, 0, 0],
                    ['effects', ['font', ['size', 1.27, 1.27]], hide === 'hide' ? 'hide' : null],
                ],
            ]);
        }
    });
    return libProperties;
}
function shapeToCRC32(str, CRCTable) {
    var crc = -1;
    for (var i = 0, iTop = str.length; i < iTop; i++) {
        // tslint:disable-next-line
        crc = (crc >>> 8) ^ CRCTable[(crc ^ str.charCodeAt(i)) & 0xff];
    }
    // tslint:disable-next-line
    return (crc ^ -1) >>> 0;
}
function symbolCompare(symbol, shape, conversionState, compProp, CRCTable) {
    var crcKey = shapeToCRC32(spectra_1.encodeObject(shape), CRCTable);
    if (conversionState.libTypes.hasOwnProperty(crcKey)) {
        compProp.lib = conversionState.libTypes[crcKey];
        conversionState.savedLibMsgs.push("Info: symbol for " + symbol + " (rotation:" + compProp.rotation + ") exits as " + compProp.lib);
        return false;
    }
    else {
        var name = compProp.pre + "_" + crcKey.toString(16).toUpperCase();
        conversionState.libTypes[crcKey] = name;
        compProp.lib = name;
        conversionState.savedLibMsgs.push("Info: symbol for " + symbol + " (rotation:" + compProp.rotation + ") is new as " + name);
        return true;
    }
}
function convertLibrary(schematicsLIB, library, conversionState, CRCTable, inputFileName) {
    var compProp = {
        ref: '',
        value: '',
        pre: '',
        lib: '',
        rotation: 0,
        package: '',
        pinNameShowCount: 0,
        pinNameHideCount: 0,
        pinNumberShowCount: 0,
        pinNumberHideCount: 0,
        component: [],
    };
    var unsupportedShapes = {
        AR: 'arrow',
        I: 'image',
        PI: 'pie',
    };
    var symbolLibText = [];
    var symbolLibArc = [];
    var symbolLibCircle = [];
    var symbolLibRect = [];
    var symbolLibPoly = [];
    var symbolLibPin = [];
    var symbolLibProp = [];
    var errorReports = [];
    var newComponent = [];
    var newComponentInstance = [];
    var newComponentProp = [];
    //
    // Eda library .json input document is processed
    //
    if (library !== null) {
        var transform = { x: library.head.x, y: library.head.y };
        symbolLibProp = flatten(convertHead(library.head, compProp));
        for (var _i = 0, _a = library.shape; _i < _a.length; _i++) {
            var shape = _a[_i];
            var _b = shape.split('~'), type = _b[0], shapeArgs = _b.slice(1);
            if (type === 'P') {
                var result = convertPin(shapeArgs, transform, compProp, conversionState);
                if (result !== null) {
                    symbolLibPin.push.apply(symbolLibPin, result);
                }
            }
            else if (type === 'T') {
                var result = convertText(shapeArgs, transform);
                if (result !== null) {
                    symbolLibText.push.apply(symbolLibText, result);
                }
            }
            else if (type === 'A') {
                var result = convertArc(shapeArgs, transform, conversionState);
                if (result !== null) {
                    symbolLibArc.push.apply(symbolLibArc, result);
                }
            }
            else if (type === 'C') {
                symbolLibCircle.push.apply(symbolLibCircle, convertCircle(shapeArgs, transform));
            }
            else if (type === 'E') {
                var result = convertEllipse(shapeArgs, transform, conversionState);
                if (result !== null) {
                    symbolLibCircle.push.apply(symbolLibCircle, result);
                }
            }
            else if (type === 'R') {
                symbolLibRect.push.apply(symbolLibRect, convertRect(shapeArgs, transform));
            }
            else if (type === 'L') {
                symbolLibPoly.push.apply(symbolLibPoly, convertLine(shapeArgs, transform));
            }
            else if (type === 'PL') {
                symbolLibPoly.push.apply(symbolLibPoly, convertPolyline(shapeArgs, transform));
            }
            else if (type === 'PG') {
                symbolLibPoly.push.apply(symbolLibPoly, convertPolygon(shapeArgs, transform));
            }
            else if (type === 'PT') {
                var result = convertPath(shapeArgs, transform, conversionState);
                if (result !== null) {
                    symbolLibPoly.push.apply(symbolLibPoly, result);
                }
            }
            else if (unsupportedShapes.hasOwnProperty(type)) {
                var msg = "Warning: " + unsupportedShapes[type] + " (" + type + ") shape found in library; not supported by Kicad ";
                schematic_v6_1.reportError(msg, conversionState);
            }
            else {
                var msg = "Warning: unknown shape " + type + " found; ignored";
                schematic_v6_1.reportError(msg, conversionState);
            }
        }
        errorReports = flatten(conversionState.schReports);
        return [
            '_LF1_',
            __spreadArrays([
                'symbol',
                // The library name is derived from the json input file.
                // This creates a symbol file per pcb project.
                inputFileName + ':' + compProp.lib,
                // pin names and number are auto placed (no coords needed)
                // show or hide are controlled globally based on the
                // show & hide count of the Eda symbol
                compProp.pinNumberShowCount < compProp.pinNumberHideCount ? ['pin_numbers', 'hide'] : null,
                // X controls name placing : (pin_names (offset X))
                // 0 = outside (above/below pin); 2 = inside (next to pin)
                [
                    'pin_names',
                    ['offset', 2],
                    compProp.pinNameShowCount < compProp.pinNameHideCount ? 'hide' : null,
                ],
                // standard defaults
                ['in_bom', 'yes'],
                ['on_board', 'yes']
            ], symbolLibProp, [
                '_LF2_',
                __spreadArrays(['symbol', compProp.lib + '_0_0'], symbolLibText, errorReports),
                '_LF2_',
                __spreadArrays([
                    'symbol',
                    compProp.lib + "_0_1"
                ], symbolLibArc, symbolLibCircle, symbolLibRect, symbolLibPoly),
                '_LF2_',
                __spreadArrays(['symbol', compProp.lib + "_1_1"], symbolLibPin),
            ]),
        ];
        //
        // called from schematics-v6 for processing LIB shape
        //
    }
    else if (schematicsLIB !== null) {
        var _c = schematicsLIB.split('#@$'), libHead = _c[0], shapeList = _c.slice(1);
        var _d = libHead.split('~'), x = _d[0], y = _d[1], attributes = _d[2], rotation = _d[3], importFlag = _d[4], id = _d[5], locked = _d[6];
        // don't process sheet layout LIB
        if (id === 'frame_lib_1') {
            return [];
        }
        var angle = rotation === '' ? 0 : parseInt(rotation, 10);
        var transform = {
            x: parseInt(x, 10),
            y: parseInt(y, 10),
            id: id,
        };
        var attrList = attributes.split('`');
        var attrs = {};
        for (var i = 0; i < attrList.length; i += 2) {
            attrs[attrList[i]] = attrList[i + 1];
        }
        compProp.package = attrs.package;
        compProp.rotation = rotation === '' ? 0 : parseInt(rotation, 10);
        newComponentProp.push.apply(newComponentProp, [
            '_LF2_',
            [
                'property',
                'EDA_id',
                id,
                ['id', 4],
                ['at', schematic_v6_1.kiUnits(x), schematic_v6_1.kiUnits(y), 0],
                ['effects', ['font', ['size', 1.27, 1.27]], 'hide'],
            ],
        ]);
        for (var _e = 0, shapeList_1 = shapeList; _e < shapeList_1.length; _e++) {
            var shape = shapeList_1[_e];
            var _f = shape.split('~'), type = _f[0], shapeArgs = _f.slice(1);
            if (type === 'P') {
                var result = convertPin(shapeArgs, transform, compProp, conversionState);
                if (result !== null) {
                    symbolLibPin.push.apply(symbolLibPin, result);
                }
            }
            else if (type === 'T') {
                var result = convertText(shapeArgs, transform);
                if (result !== null) {
                    symbolLibText.push.apply(symbolLibText, result);
                }
                symbolLibProp.push.apply(symbolLibProp, convertAnnotations(shapeArgs, transform, compProp, conversionState));
                if (compProp.component !== []) {
                    newComponentProp.push.apply(newComponentProp, compProp.component);
                    compProp.component = [];
                }
            }
            else if (type === 'A') {
                var result = convertArc(shapeArgs, transform, conversionState);
                if (result !== null) {
                    symbolLibArc.push.apply(symbolLibArc, result);
                }
            }
            else if (type === 'C') {
                symbolLibCircle.push.apply(symbolLibCircle, convertCircle(shapeArgs, transform));
            }
            else if (type === 'E') {
                var result = convertEllipse(shapeArgs, transform, conversionState);
                if (result !== null) {
                    symbolLibCircle.push.apply(symbolLibCircle, result);
                }
            }
            else if (type === 'R') {
                symbolLibRect.push.apply(symbolLibRect, convertRect(shapeArgs, transform));
            }
            else if (type === 'L') {
                symbolLibPoly.push.apply(symbolLibPoly, convertLine(shapeArgs, transform));
            }
            else if (type === 'PL') {
                symbolLibPoly.push.apply(symbolLibPoly, convertPolyline(shapeArgs, transform));
            }
            else if (type === 'PG') {
                symbolLibPoly.push.apply(symbolLibPoly, convertPolygon(shapeArgs, transform));
            }
            else if (type === 'PT') {
                var result = convertPath(shapeArgs, transform, conversionState);
                if (result !== null) {
                    symbolLibPoly.push.apply(symbolLibPoly, result);
                }
            }
            else if (unsupportedShapes.hasOwnProperty(type)) {
                var msg = "Warning: " + unsupportedShapes[type] + " (" + type + ") shape found in library " + id + "; not supported by Kicad ";
                schematic_v6_1.reportError(msg, conversionState);
            }
            else {
                var msg = "Warning: unknown shape " + type + " found with id " + id + "; ignored";
                schematic_v6_1.reportError(msg, conversionState);
            }
        }
        // collect the shape info to compare symbols
        var symbolShape = __spreadArrays(symbolLibText, symbolLibArc, symbolLibCircle, symbolLibRect, symbolLibPoly, symbolLibPin);
        //
        // create new lib symbol if compare fails
        //
        var newSymbol = false;
        if (symbolCompare(compProp.ref, symbolShape, conversionState, compProp, CRCTable)) {
            var symbol = [];
            newSymbol = true;
            symbol = [
                '_LF1_',
                __spreadArrays([
                    'symbol',
                    inputFileName + ':' + compProp.lib,
                    compProp.pinNumberShowCount < compProp.pinNumberHideCount
                        ? ['pin_numbers', 'hide']
                        : null,
                    [
                        'pin_names',
                        ['offset', 2],
                        compProp.pinNameShowCount < compProp.pinNameHideCount ? 'hide' : null,
                    ],
                    ['in_bom', 'yes'],
                    ['on_board', 'yes']
                ], symbolLibProp, [
                    '_LF2_',
                    __spreadArrays(['symbol', compProp.lib + '_0_0'], symbolLibText, errorReports),
                    '_LF2_',
                    __spreadArrays([
                        'symbol',
                        compProp.lib + "_0_1"
                    ], symbolLibArc, symbolLibCircle, symbolLibRect, symbolLibPoly),
                    '_LF2_',
                    __spreadArrays(['symbol', compProp.lib + "_1_1"], symbolLibPin),
                ]),
            ];
            conversionState.savedLibs.push(symbol);
        }
        //
        // create component & component instance
        //
        var compUuid = uuid_1.v4();
        newComponent = [
            '_LF_',
            '_LF_',
            __spreadArrays([
                'symbol',
                ['lib_id', inputFileName + ':' + compProp.lib],
                kiAt(x, kiY(y), 0),
                ['unit', 1],
                ['in_bom', 'yes'],
                ['on_board', 'yes'],
                ['uuid', compUuid]
            ], newComponentProp),
        ];
        newComponentInstance = [
            '_LF1_',
            [
                'path',
                '/' + compUuid,
                ['reference', compProp.ref],
                ['unit', 1],
                ['value', compProp.value],
                ['footprint', compProp.package],
            ],
        ];
        return [newComponentInstance, newComponent];
    }
    return ['Conversion error'];
}
exports.convertLibrary = convertLibrary;
function flatten(arr) {
    var _a;
    return (_a = []).concat.apply(_a, arr);
}
function convertLibraryToV6Array(library, inputFileName) {
    var conversionState = {
        schRepCnt: 0,
        schReports: [],
        schReportsPosition: 0,
        libTypes: {},
        savedLibs: [],
        savedLibMsgs: [],
        convertingSymFile: true,
    };
    var result = convertLibrary(null, library, conversionState, [0], inputFileName);
    return __spreadArrays([
        //
        // Kicad lib symbols are normalized with 0,0 as center
        // based on the head x,y coords of the Eda LIB
        //
        // note-1: multi part symbols NOT YET supported.
        // note-2: schematics shared symbols are only implemented
        //         for symbols with the same Eda rotation angle.
        //
        'kicad_symbol_lib',
        ['version', 20210126],
        ['generator', 'kicad_symbol_editor']
    ], result);
}
// main.ts will automatically detect an Eda library .json as input.
//
// How to get a Eda library .json file:
// go to Eda on line editor and click on library icon (on left side),
// select wanted symbol and click EDIT button
// choose menu File > EasyEDa File Source > click DOWNLOAD button.
//
// The generated output file is saved as symbol-name.kicad_sym.
// Import file in Kicad using:
// menu Preferences > Manage Symbol Libraries
function convertLibraryV6(library, inputFileName) {
    return spectra_1.encodeObject(convertLibraryToV6Array(library, inputFileName));
}
exports.convertLibraryV6 = convertLibraryV6;
//# sourceMappingURL=library-v6.js.map