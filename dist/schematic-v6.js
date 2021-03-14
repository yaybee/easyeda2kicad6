"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSchematicV6 = exports.convertBusEntry = exports.convertBus = exports.convertNetflag = exports.convertNetPort = exports.convertNetlabel = exports.convertWire = exports.convertJunction = exports.convertNoConnect = exports.convertText = exports.convertPolyline = exports.pointListToPolygon = exports.reportError = exports.kiUnits = void 0;
var uuid_1 = require("uuid");
var library_v6_1 = require("./library-v6");
var spectra_1 = require("./spectra");
function makeCRCTable() {
    var c;
    var crcTable = [];
    for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
            // tslint:disable-next-line
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        crcTable[n] = c;
    }
    return crcTable;
}
function kiUnits(value) {
    if (typeof value === 'string') {
        value = parseFloat(value);
    }
    // Note: unit conversion is done at the very end.
    // This makes debugging easier;
    // during debugging of functions the Eda
    // coordinates from .json  will be shown.
    // By removing the multiplication factor here
    // this is also reflected in the conversion
    // output file: 'return value; // * 0.254;'
    return value * 0.254;
}
exports.kiUnits = kiUnits;
function kiAngle(value) {
    if (value == null) {
        return null;
    }
    var angle = parseFloat(value);
    angle = angle + 180;
    if (!isNaN(angle)) {
        return angle < 360 ? angle : angle - 360;
    }
    return 0;
}
function kiCoords(x, y) {
    return {
        x: parseInt(x, 10),
        y: parseInt(y, 10),
    };
}
function kiAt(x, y, angle) {
    var coords = kiCoords(x, y);
    if (angle !== undefined) {
        return ['at', kiUnits(coords.x), kiUnits(coords.y), kiAngle(angle)];
    }
    else {
        return ['at', kiUnits(coords.x), kiUnits(coords.y)];
    }
}
function kiLineStyle(style) {
    // kicad default = solid
    var styleTable = {
        0: 'solid',
        1: 'dash',
        2: 'dot',
    };
    style = style === '' ? '0' : style;
    return styleTable[style];
}
function kiLineWidth(widthStr) {
    // Kicad default = 0 gives width of 0.152mm
    var width = parseInt(widthStr, 10);
    if (width > 1) {
        return width * 0.152;
    }
    else {
        return 0;
    }
}
function kiEffects(fontSize, visible, justify, bold, italic) {
    if (visible === void 0) { visible = '1'; }
    if (justify === void 0) { justify = ''; }
    if (bold === void 0) { bold = ''; }
    if (italic === void 0) { italic = ''; }
    // Fonts: kicad default = 1.27 mm; Eda between 5 - 7pt
    // note: library items are converted to 1.27 mm as standard.
    // to keep aligned with the libs all font sizes upto 7pt
    // are kept at 1.27mm; above 7pt the size will be scaled
    // note: Jan 2021 - thickness is not (yet?) supported by
    // Kicad gui. By editing, text item will loose this property.
    var size;
    var thickness = 0;
    fontSize = fontSize === '' ? '1.27' : fontSize;
    var font = parseFloat(fontSize.replace('pt', ''));
    if (isNaN(font)) {
        size = 1.27;
    }
    else {
        if (font > 7) {
            size = font * 0.2;
            thickness = font * 0.05;
        }
        else {
            size = 1.27;
        }
    }
    return [
        'effects',
        [
            'font',
            ['size', size, size],
            thickness === 0 ? null : ['thickness', thickness],
            italic === 'italic' ? 'italic' : null,
            bold === 'bold' ? 'bold' : null,
        ],
        justify === 'start' ? ['justify', 'left'] : justify === 'end' ? ['justify', 'right'] : null,
        visible === '1' ? null : 'hide',
    ];
}
function kiColor(hex) {
    // color support for selected Kicad items
    // note: not all Eda color support can be enabled in Kicad
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result != null) {
        var r = parseInt(result[1], 16);
        var g = parseInt(result[2], 16);
        var b = parseInt(result[3], 16);
        return ['color', r, g, b, 1];
    }
    else {
        return ['color', 0, 0, 0, 0];
    }
}
function reportLibError(msgNumber, msg, position) {
    // put error info near module 0,0 coords;
    var y = -position * 2;
    var text = "#" + msgNumber + ": " + msg;
    return [
        '_LF3_',
        ['text', text, ['at', 0, y, 0], ['effects', ['font', ['size', 1.27, 1.27]]]],
    ];
}
function reportSchError(msgNumber, msg, position) {
    // put error info on pcb just outside frame
    var y = 4 + position * 4;
    var text = "#" + msgNumber + ": " + msg;
    return [
        '_LF_',
        ['text', text, ['at', -200, y, 0], ['effects', ['font', ['size', 2, 2]], ['justify', 'left']]],
    ];
}
function reportError(msgSch, conversionState, multiLine) {
    conversionState.schRepCnt += 1;
    multiLine !== undefined
        ? (conversionState.schReportsPosition += multiLine)
        : (conversionState.schReportsPosition += 1);
    if (conversionState.convertingSymFile) {
        // console.info(`SYM: ${conversionState.schRepCnt} - ${msgSch}`);
        return reportLibError(conversionState.schRepCnt, msgSch, conversionState.schReportsPosition);
    }
    else {
        // console.info(`SCH: ${conversionState.schRepCnt} - ${msgSch}`);
        conversionState.schReports.push(reportSchError(conversionState.schRepCnt, msgSch, conversionState.schReportsPosition));
        return [];
    }
}
exports.reportError = reportError;
function nfToPolygon(points) {
    // special function for netflag support
    var polygonPoints = [];
    for (var i = 0; i < points.length; i += 2) {
        polygonPoints.push(['xy', parseFloat(points[i]), parseFloat(points[i + 1])]);
    }
    return polygonPoints;
}
function kiPts(startX, startY, endX, endY) {
    var start = kiCoords(startX, startY);
    var end = kiCoords(endX, endY);
    return [
        'pts',
        ['xy', kiUnits(start.x), kiUnits(start.y)],
        ['xy', kiUnits(end.x), kiUnits(end.y)],
    ];
}
function pointListToPolygon(points, closed) {
    if (closed === void 0) { closed = false; }
    var polygonPoints = [];
    for (var i = 0; i < points.length; i += 2) {
        var coords = kiCoords(points[i], points[i + 1]);
        polygonPoints.push(['xy', kiUnits(coords.x), kiUnits(coords.y)]);
    }
    if (closed) {
        var coords = kiCoords(points[0], points[1]);
        polygonPoints.push(['xy', kiUnits(coords.x), kiUnits(coords.y)]);
    }
    return polygonPoints;
}
exports.pointListToPolygon = pointListToPolygon;
function convertPolyline(args) {
    var points = args[0], strokeColor = args[1], strokeWidth = args[2], strokeStyle = args[3], fillColor = args[4], id = args[5], locked = args[6];
    return [
        '_LF_',
        [
            'polyline',
            __spreadArrays(['pts'], pointListToPolygon(points.split(' '))),
            [
                'stroke',
                ['width', kiLineWidth(strokeWidth)],
                ['type', kiLineStyle(strokeStyle)],
                kiColor(strokeColor),
            ],
        ],
    ];
}
exports.convertPolyline = convertPolyline;
function convertRect(args) {
    var rx = args[0], ry = args[1], u1 = args[2], u2 = args[3], width = args[4], height = args[5], strokeColor = args[6], strokeWidth = args[7], strokeStyle = args[8], fillColor = args[9], id = args[10], locked = args[11];
    var lines = [];
    var x = parseInt(rx, 10);
    var y = parseInt(ry, 10);
    var w = parseInt(width, 10);
    var h = parseInt(height, 10);
    var points = [x, y, x, y + h, x + w, y + h, x + w, y, x, y];
    for (var i = 0; i < points.length - 2; i += 2) {
        lines.push([
            '_LF_',
            [
                'polyline',
                [
                    'pts',
                    ['xy', kiUnits(points[i]), kiUnits(points[i + 1])],
                    ['xy', kiUnits(points[i + 2]), kiUnits(points[i + 3])],
                ],
                [
                    'stroke',
                    ['width', kiLineWidth(strokeWidth)],
                    ['type', kiLineStyle(strokeStyle)],
                    kiColor(strokeColor),
                ],
            ],
        ]);
    }
    return lines;
}
function convertText(args) {
    var type = args[0], x = args[1], y = args[2], rotation = args[3], fontSize = args[6], fontWeigth = args[7], fontStyle = args[8], spice = args[10], text = args[11], visable = args[12], textAnchor = args[13], id = args[14], locked = args[15];
    if (type === 'L') {
        // note: Jan 2021; no Kicad color support for text fields
        return [
            '_LF_',
            [
                'text',
                text,
                kiAt(x, y, rotation),
                kiEffects(fontSize, visable, textAnchor, fontWeigth, fontStyle),
            ],
        ];
    }
    else {
        return [null];
    }
}
exports.convertText = convertText;
function convertNoConnect(args) {
    // note: Eda does not require unused pins to have the noconnect flag
    // to run Kicad ERC it is recommended to add them manually
    var pinDotX = args[0], pinDotY = args[1], id = args[2], pathStr = args[3], color = args[4], locked = args[5];
    return ['_LF_', ['no_connect', kiAt(pinDotX, pinDotY)]];
}
exports.convertNoConnect = convertNoConnect;
function convertJunction(args) {
    // note: junction color and size are enabled
    var pinDotX = args[0], pinDotY = args[1], junctionCircleRadius = args[2], fillColor = args[3], id = args[4], locked = args[5];
    // Eda radius default = 2.5; Kicad default diameter = 1.016mm
    var edaRadius = parseFloat(junctionCircleRadius);
    var radius = edaRadius === 2.5 ? 1.016 : edaRadius * 0.4064;
    return ['_LF_', ['junction', kiAt(pinDotX, pinDotY), ['diameter', radius], kiColor(fillColor)]];
}
exports.convertJunction = convertJunction;
function convertWire(args) {
    // note: wire color and wire width are enabled
    var points = args[0], strokeColor = args[1], strokeWidth = args[2], strokeStyle = args[3], fillColor = args[4], id = args[5], locked = args[6];
    var coordList = points.split(' ');
    var wires = [];
    for (var i = 0; i < coordList.length - 2; i += 2) {
        wires.push('_LF_', [
            'wire',
            kiPts(coordList[i], coordList[i + 1], coordList[i + 2], coordList[i + 3]),
            [
                'stroke',
                ['width', kiLineWidth(strokeWidth)],
                ['type', kiLineStyle(strokeStyle)],
                kiColor(strokeColor),
            ],
        ]);
    }
    return wires;
}
exports.convertWire = convertWire;
function convertImage(args, ConversionState) {
    var x = args[0], y = args[1], width = args[2], height = args[3], rotation = args[4], href = args[5], id = args[6], locked = args[7];
    var _a = href.split(','), imageType = _a[0], imageString = _a[1];
    if (imageType === 'data:image/png;base64') {
        var msg1 = "Info: Found image (" + id + "): it probably needs to be resized and/or moved manually ";
        reportError(msg1, ConversionState);
        var imgUuid = uuid_1.v4();
        return [
            '_LF_',
            ['image', kiAt(x, y), ['scale', 0.2], ['uuid', imgUuid], '_LF1_', ['data', imageString]],
        ];
    }
    else {
        var msg2 = "Warning: Image (" + id + ") found is not an embedded png image; image ignored";
        return reportError(msg2, ConversionState);
    }
}
function convertNetlabel(args) {
    var pinDotX = args[0], pinDotY = args[1], rotation = args[2], fillColor = args[3], name = args[4], id = args[5], textAnchor = args[6], px = args[7], py = args[8], font = args[9], fontSize = args[10], locked = args[11];
    // Eda netlabels are converted to Kicad local labels.
    // Eda supports more than one netlabel per net; this causes problems in Kicad.
    // Run ERC to manually solve the conficting netlabel issues.
    // You can keep the conlicting labels by converting them to text labels:
    // select label > right mouse button > item "Change to text"
    // When needed they can be change back to label in the same way.
    //
    // note: local labels do not support multi sheet schematics and
    // Kicad global labels cannot be used to convert Eda netlabels.
    // Netlabels can however be converted to global labels in Kicad gui.
    // For global labels the Eda netport should have been used.
    return ['_LF_', ['label', name, kiAt(pinDotX, pinDotY, rotation), kiEffects('1.27')]];
}
exports.convertNetlabel = convertNetlabel;
function convertNetPort(args) {
    // netflag type netport are changed to Kicad global labels.
    var pinDotX = args[0], pinDotY = args[1], rotation = args[2], netFlag = args[3], textAnchor = args[4];
    return [
        '_LF_',
        [
            'global_label',
            netFlag,
            ['shape', 'bidirectional'],
            kiAt(pinDotX, pinDotY, rotation),
            kiEffects('1.27'),
        ],
    ];
}
exports.convertNetPort = convertNetPort;
function convertNetflag(args, nfSymbolPresent, conversionState, inputFileName) {
    // Eda netflags will be changed to Kicad power symbols, except
    // 'part_netLabel_netPort'. This will become a global label.
    var segments = args.join('~').split('^^');
    var _a = segments[0].split('~'), partId = _a[0], x = _a[1], y = _a[2], rotation = _a[3], id = _a[4], locked = _a[5];
    var _b = segments[1].split('~'), pinDotX = _b[0], pinDotY = _b[1];
    var _c = segments[2].split('~'), netFlag = _c[0], color = _c[1], px = _c[2], py = _c[3], rot = _c[4], textAnchor = _c[5], visible = _c[6], font = _c[7], fontSize = _c[8];
    var shape = [];
    var points;
    var libtype;
    var show;
    var createNewSymbol = false;
    switch (partId) {
        case 'part_netLabel_gnD':
            libtype = '$GND1';
            show = '0';
            if (!nfSymbolPresent.$GND1) {
                nfSymbolPresent.$GND1 = true;
                createNewSymbol = true;
                points = '0 0 0 -1.27 1.27 -1.27 0 -2.54 -1.27 -1.27 0 -1.27';
                shape = ['_LF3_', ['polyline', __spreadArrays(['pts'], nfToPolygon(points.split(' ')))]];
            }
            break;
        case 'part_netLabel_GNd':
            libtype = '$GND2';
            show = '0';
            if (!nfSymbolPresent.$GND2) {
                nfSymbolPresent.$GND2 = true;
                createNewSymbol = true;
                shape = [
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('-0.635 -1.905 0.635 -1.905'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('-0.127 -2.54 0.127 -2.54'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0 -1.27 0 0'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('1.27 -1.27 -1.27 -1.27'.split(' ')))],
                ];
            }
            break;
        case 'part_netLabel_gNd':
            libtype = '$GND3';
            show = '0';
            if (!nfSymbolPresent.$GND3) {
                nfSymbolPresent.$GND3 = true;
                createNewSymbol = true;
                shape = [
                    '_LF3_',
                    [
                        'rectangle',
                        ['start', -1.27, -1.524],
                        ['end', 1.27, -2.032],
                        ['stroke', ['width', 0.254]],
                        ['fill', ['type', 'outline']],
                    ],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0 0 0 -1.524'.split(' ')))],
                ];
            }
            break;
        case 'part_netLabel_GnD':
            libtype = '$EARTH';
            show = '0';
            if (!nfSymbolPresent.$EARTH) {
                nfSymbolPresent.$EARTH = true;
                createNewSymbol = true;
                shape = [
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0 -1.27 0 0'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('-1.016 -1.27 -1.27 -2.032'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('-0.508 -1.27 -0.762 -2.032'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0 -1.27 -0.254 -2.032'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0.508 -1.27 0.254 -2.032'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('1.016 -1.27 -1.016 -1.27'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('1.016 -1.27 0.762 -2.032'.split(' ')))],
                ];
            }
            break;
        case 'part_netLabel_VEE':
        case 'part_netLabel_-5V':
            libtype = '$Vminus';
            show = visible;
            if (!nfSymbolPresent.$Vminus) {
                nfSymbolPresent.$Vminus = true;
                createNewSymbol = true;
                points = '0 0 0 1.27 -0.762 1.27 0 2.54 0.762 1.27 0 1.27';
                shape = [
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon(points.split(' '))), ['fill', ['type', 'outline']]],
                ];
            }
            break;
        case 'part_netLabel_VCC':
        case 'part_netLabel_+5V':
            libtype = '$Vplus';
            if (!nfSymbolPresent.$Vplus) {
                nfSymbolPresent.$Vplus = true;
                createNewSymbol = true;
                shape = [
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('-0.762 1.27 0 2.54'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0 0 0 2.54'.split(' ')))],
                    '_LF3_',
                    ['polyline', __spreadArrays(['pts'], nfToPolygon('0 2.54 0.762 1.27'.split(' ')))],
                ];
            }
            break;
        case 'part_netLabel_netPort':
            return [[pinDotX, pinDotY, rotation, netFlag, textAnchor], null, null, null];
        default:
            var msg = "Warning: unsupported netflag partId: " + partId + " with id = " + id;
            reportError(msg, conversionState);
            return null;
    }
    var compUuid = uuid_1.v4();
    var newComponent = [
        '_LF_',
        '_LF_',
        [
            'symbol',
            ['lib_id', inputFileName + ":Powerflag_" + libtype],
            ['at', kiUnits(parseFloat(pinDotX)), kiUnits(parseFloat(pinDotY)), parseFloat(rotation)],
            ['unit', 1],
            ['in_bom', 'no'],
            ['on_board', 'yes'],
            ['uuid', compUuid],
            '_LF1_',
            ['property', 'Reference', '#PWR?', ['id', 0], ['at', 0, 0, 0], kiEffects('1.27', '0')],
            '_LF1_',
            [
                'property',
                'Value',
                netFlag,
                ['id', 1],
                ['at', kiUnits(parseFloat(px)), kiUnits(parseFloat(py)), parseFloat(rot)],
                kiEffects('1.27', show),
            ],
        ],
    ];
    var newComponentInstance = [
        '_LF2_',
        [
            'path',
            '/' + compUuid,
            ['reference', '#PWR?'],
            ['unit', 1],
            ['value', netFlag],
            ['footprint', '&'],
        ],
    ];
    if (createNewSymbol) {
        createNewSymbol = false;
        var compPin = [
            '_LF3_',
            [
                'pin',
                'power_in',
                'line',
                ['at', 0, 0, 0],
                ['length', 0],
                'hide',
                '_LF4_',
                ['name', netFlag, kiEffects('1.27')],
                '_LF4_',
                ['number', '&1', kiEffects('1.27')],
            ],
        ];
        var newSymbol = [
            '_LF1_',
            [
                'symbol',
                inputFileName + ":Powerflag_" + libtype,
                ['power'],
                ['pin_names', ['offset', 0]],
                ['in_bom', 'no'],
                ['on_board', 'yes'],
                '_LF2_',
                ['property', 'Reference', '#PWR', ['id', 0], ['at', 0, 0, 0], kiEffects('1.27', '0')],
                '_LF2_',
                [
                    'property',
                    'Value',
                    inputFileName + ":Powerflag_" + libtype,
                    ['id', 1],
                    ['at', 0, 0, 0],
                    kiEffects('1.27'),
                ],
                '_LF2_',
                __spreadArrays(['symbol', "Powerflag_" + libtype + "_0_1"], shape),
                '_LF2_',
                __spreadArrays(['symbol', "Powerflag_" + libtype + "_1_1"], compPin),
            ],
        ];
        conversionState.savedLibs.push(newSymbol);
        return [null, newSymbol, newComponentInstance, newComponent];
    }
    else {
        return [null, null, newComponentInstance, newComponent];
    }
}
exports.convertNetflag = convertNetflag;
function convertBus(args) {
    var points = args[0], strokeColor = args[1], strokeWidth = args[2], stokeStyle = args[3], fillColor = args[4], id = args[5], locked = args[6];
    var coordList = points.split(' ');
    var busses = [];
    for (var i = 0; i < coordList.length - 2; i += 2) {
        busses.push('_LF_', [
            'bus',
            kiPts(coordList[i], coordList[i + 1], coordList[i + 2], coordList[i + 3]),
        ]);
    }
    return busses;
}
exports.convertBus = convertBus;
function convertBusEntry(args) {
    var rotation = args[0], startX = args[1], startY = args[2], endX = args[3], endY = args[4], id = args[5], locked = args[6];
    var x = parseFloat(endX) - parseFloat(startX);
    var y = parseFloat(endY) - parseFloat(startY);
    return [
        '_LF_',
        ['bus_entry', kiAt(startX, startY), ['size', kiUnits(x), kiUnits(y)]],
    ];
}
exports.convertBusEntry = convertBusEntry;
function flatten(arr) {
    var _a;
    return (_a = []).concat.apply(_a, arr);
}
function convertSchematicV6ToArray(schematic, conversionState, inputFileName) {
    var _a;
    var shape;
    var knownNetflags = {
        $GND1: false,
        $GND2: false,
        $GND3: false,
        $EARTH: false,
        $Vplus: false,
        $Vminus: false,
    };
    var componentInstances = [];
    var components = [];
    var netlabels = [];
    var wires = [];
    var junctions = [];
    var noconnects = [];
    var busses = [];
    var busentries = [];
    var polylines = [];
    var texts = [];
    var images = [];
    var nfSymbols = [];
    var nfInstances = [];
    var netflags = [];
    var netports = [];
    var schNetPorts = [];
    var unsupportedShapes = {
        A: 'arc',
        AR: 'arrow',
        C: 'circle',
        E: 'ellipse',
        I: 'image',
        PI: 'pie',
        PG: 'polygon',
        PT: 'path',
    };
    // needed for symbol form compair
    var CRCTable;
    CRCTable = makeCRCTable();
    var msg = 'Info: below are the conversion remarks. The conversion may contain errors.' +
        '\\nPlease read the remarks carefully and run the ERC check to solve issues.' +
        '\\nTo find a component mentioned in the remarks go to:' +
        '\\nKicad menu Edit > Find and enter the EDA_id (gge....); search for hidden fields.' +
        '\\nOnly the id of the symbol can be found; the id of the shape is in the input json.';
    reportError(msg, conversionState, 5);
    for (var _i = 0, _b = schematic.shape; _i < _b.length; _i++) {
        shape = _b[_i];
        var _c = shape.split('~'), type = _c[0], args = _c.slice(1);
        if (type === 'B') {
            busses.push.apply(busses, convertBus(args));
        }
        else if (type === 'BE') {
            busentries.push.apply(busentries, convertBusEntry(args));
        }
        else if (type === 'F') {
            var nfresult = convertNetflag(args, knownNetflags, conversionState, inputFileName);
            if (nfresult != null) {
                var netport = nfresult[0], nfSymbol = nfresult[1], nfInstance = nfresult[2], netflag = nfresult[3];
                if (netport != null) {
                    schNetPorts.push(netport);
                }
                else {
                    if (nfSymbol != null) {
                        nfSymbols.push.apply(nfSymbols, nfSymbol);
                    }
                }
                if (nfInstance != null) {
                    nfInstances.push.apply(nfInstances, nfInstance);
                }
                if (netflag != null) {
                    netflags.push.apply(netflags, netflag);
                }
            }
        }
        else if (type === 'I') {
            junctions.push.apply(junctions, convertImage(args, conversionState));
        }
        else if (type === 'J') {
            junctions.push.apply(junctions, convertJunction(args));
        }
        else if (type === 'LIB') {
            var symbolInstance = [];
            var symbol = [];
            _a = library_v6_1.convertLibrary(args.join('~'), null, conversionState, CRCTable, inputFileName), symbolInstance = _a[0], symbol = _a[1];
            componentInstances.push.apply(componentInstances, symbolInstance);
            components.push.apply(components, symbol);
        }
        else if (type === 'N') {
            netlabels.push.apply(netlabels, convertNetlabel(args));
        }
        else if (type === 'O') {
            noconnects.push.apply(noconnects, convertNoConnect(args));
        }
        else if (type === 'PL') {
            polylines.push.apply(polylines, convertPolyline(args));
        }
        else if (type === 'R') {
            polylines.push.apply(polylines, flatten(convertRect(args)));
        }
        else if (type === 'T') {
            texts.push.apply(texts, convertText(args));
        }
        else if (type === 'W') {
            wires.push.apply(wires, convertWire(args));
        }
        else if (type === 'A' ||
            type === 'AR' ||
            type === 'C' ||
            type === 'E' ||
            type === 'PI' ||
            type === 'PG' ||
            type === 'PT') {
            var msg1 = "Warning: unsupported shape " + unsupportedShapes[type] + " found in schematics; shape ignored";
            reportError(msg1, conversionState);
        }
        else {
            var msg2 = "Warning: unknown shape " + type + " found in schematics; shape ignored";
            reportError(msg2, conversionState);
        }
    }
    for (var _d = 0, schNetPorts_1 = schNetPorts; _d < schNetPorts_1.length; _d++) {
        var nport = schNetPorts_1[_d];
        netports.push.apply(netports, convertNetPort(nport));
    }
    for (var _e = 0, _f = conversionState.savedLibMsgs; _e < _f.length; _e++) {
        var msg3 = _f[_e];
        reportError(msg3, conversionState);
    }
    var outputSymbols = __spreadArrays(flatten(conversionState.savedLibs), nfSymbols).filter(function (obj) { return obj != null; });
    var outputInstances = __spreadArrays(componentInstances, nfInstances).filter(function (obj) { return obj != null; });
    var outputObjs = __spreadArrays([
        '_LF_'
    ], components, netflags, netlabels, netports, wires, junctions, noconnects, polylines, busses, busentries, texts, [
        '_LF_',
        '_LF_',
    ]).filter(function (obj) { return obj != null; });
    // date 20210220 > creation date of Kicad nightly
    // used for testing conversion results
    return __spreadArrays([
        'kicad_sch',
        ['version', 20210220],
        ['generator', 'eeschema'],
        // adjust paper size after opening schematics in Kicad
        ['paper', 'A1'],
        '_LF_',
        __spreadArrays(['lib_symbols'], outputSymbols),
        '_LF_'
    ], outputObjs, flatten(conversionState.schReports), [
        '_LF_'
    ], images, [
        '_LF_',
        ['sheet_instances', ['path', '/', ['page', '&1']]],
        '_LF_',
        __spreadArrays(['symbol_instances'], outputInstances),
    ]);
}
function convertSchematicV6(input, sheet, inputFileName) {
    var numberOfSheet = input.schematics.length;
    var conversionState = {
        schRepCnt: 0,
        schReports: [],
        schReportsPosition: 0,
        libTypes: {},
        savedLibs: [],
        savedLibMsgs: [],
    };
    if (sheet > numberOfSheet) {
        console.warn("Request for conversion of sheet " + sheet + ", but only " + input.schematics.length + " sheet(s) exist.");
        process.exit(1);
    }
    else if (input.schematics.length > 1) {
        console.warn("Multi-sheet schematics: sheet " + sheet + " is used as input of the " + input.schematics.length + " available sheets.");
    }
    var schematic = input.schematics[sheet - 1].dataStr;
    var schematics = spectra_1.encodeObject(convertSchematicV6ToArray(schematic, conversionState, inputFileName));
    var schSymbols = __spreadArrays([
        'kicad_symbol_lib',
        ['version', 20200908],
        ['generator', 'kicad_symbol_editor']
    ], flatten(conversionState.savedLibs));
    var symbols = spectra_1.encodeObject(schSymbols);
    return [schematics, symbols];
}
exports.convertSchematicV6 = convertSchematicV6;
//# sourceMappingURL=schematic-v6.js.map