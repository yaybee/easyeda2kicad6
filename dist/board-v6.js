"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertBoardV6 = exports.convertBoardToArray = exports.convertHole = exports.convertSolidRegion = exports.convertCopperArea = exports.convertPolygon = exports.convertRect = exports.convertCircle = exports.convertBoardPad = exports.convertPad = exports.convertArc = exports.convertText = exports.convertTrack = exports.convertVia = exports.getNetId = exports.reportError = exports.kiAt = exports.kiCoords = exports.kiAngle = exports.kiUnits = exports.getLayerName = void 0;
var spectra_1 = require("./spectra");
var footprint_v6_1 = require("./footprint-v6");
var svg_arc_1 = require("./svg-arc");
var svgnode_1 = require("./svgnode");
function getLayerName(id, conversionState) {
    var layers = {
        1: 'F.Cu',
        2: 'B.Cu',
        3: 'F.SilkS',
        4: 'B.SilkS',
        5: 'F.Paste',
        6: 'B.Paste',
        7: 'F.Mask',
        8: 'B.Mask',
        10: 'Edge.Cuts',
        11: 'Edge.Cuts',
        12: 'Cmts.User',
        13: 'F.Fab',
        14: 'B.Fab',
        15: 'Dwgs.User',
    };
    if (id === '' || id === '0') {
        var msg = "#Error: no layer id ";
        return msg;
    }
    else if (id in layers) {
        return layers[id];
    }
    else {
        // Inner layers: 21 -> In1.Cu
        var intId = parseInt(id, 10);
        if (intId >= 21 && intId <= 50) {
            var innerLayerId = intId - 20;
            conversionState.innerLayers = Math.max(conversionState.innerLayers, innerLayerId);
            return "In" + innerLayerId + ".Cu";
        }
        else if (intId >= 99 && intId < 200) {
            var msg = "#Error: unsupported layer id: " + intId + " ";
            return msg;
        }
        else {
            var msg = "#Error: unknown layer id: " + id + " ";
            return msg;
        }
    }
}
exports.getLayerName = getLayerName;
function kiUnits(value, round) {
    if (round === void 0) { round = false; }
    if (typeof value === 'string') {
        value = parseFloat(value);
    }
    // Note: unit conversion is done at the very end.
    // This makes debugging easier;
    // during debugging of functions the Eda
    // coordinates from .json  will be shown.
    // By removing the multiplication factor here
    // this is also reflected in the conversion
    // output file of schematics and library:
    // 'return value; // * 0.254;'
    var kiValue = value * 0.254;
    if (round === true) {
        // rounded at 0.1mm for boardoutline (issue #45)
        // hopefully this clears the issue for all rounded rectangles
        // last resort: redraw edge manually
        return parseFloat(kiValue.toFixed(1));
    }
    return kiValue;
}
exports.kiUnits = kiUnits;
function kiAngle(value, parentAngle) {
    if (value) {
        var angle = parseFloat(value) + (parentAngle || 0);
        if (!isNaN(angle)) {
            return angle > 180 ? -(360 - angle) : angle;
        }
    }
    return null;
}
exports.kiAngle = kiAngle;
function rotate(_a, degrees) {
    var x = _a.x, y = _a.y;
    var radians = (degrees / 180) * Math.PI;
    return {
        x: x * Math.cos(radians) - y * Math.sin(radians),
        y: x * Math.sin(radians) + y * Math.cos(radians),
    };
}
function kiCoords(x, y, transform) {
    if (transform === void 0) { transform = { x: 0, y: 0, angle: 0 }; }
    return rotate({
        x: parseFloat(x) - 4000 - transform.x,
        y: parseFloat(y) - 3000 - transform.y,
    }, transform.angle || 0);
}
exports.kiCoords = kiCoords;
function kiAt(x, y, angle, transform) {
    var coords = kiCoords(x, y, transform);
    return ['at', kiUnits(coords.x), kiUnits(coords.y), kiAngle(angle)];
}
exports.kiAt = kiAt;
function kiStartEnd(startX, startY, endX, endY, round, parentCoords) {
    var start = kiCoords(startX, startY, parentCoords);
    var end = kiCoords(endX, endY, parentCoords);
    return [
        ['start', kiUnits(start.x, round), kiUnits(start.y, round)],
        ['end', kiUnits(end.x, round), kiUnits(end.y, round)],
    ];
}
function reportFpError(msgNumber, msg, lines, conversionState) {
    // put error info near footprint 0,0 coords;
    var y = conversionState.msgReportsPosition + lines + 1;
    conversionState.msgReportsPosition = y + (lines - 1);
    var text = "#" + msgNumber + ": " + msg;
    return [
        '_LF1_',
        [
            'fp_text',
            'user',
            text,
            ['at', 0, y, 0],
            ['layer', 'Cmts.User'],
            ['effects', ['font', ['size', 0.8, 0.8], ['thickness', 0.2]]],
        ],
    ];
}
function reportPcbError(msgNumber, msg, lines, conversionState) {
    // put error info on layer Cmts;
    var y = conversionState.msgReportsPosition + lines * 1.8 + 1.8;
    conversionState.msgReportsPosition = y + (lines - 1) * 1.8;
    var text = "#" + msgNumber + ": " + msg;
    return [
        '_LF_',
        [
            'gr_text',
            text,
            ['at', -200, y, 0],
            ['layer', 'Cmts.User'],
            ['effects', ['font', ['size', 2, 2], ['thickness', 0.4]], ['justify', 'left']],
        ],
    ];
}
function reportError(msg, conversionState, multiLine) {
    conversionState.msgRepCnt += 1;
    var lines = multiLine !== undefined ? multiLine : 1;
    if (conversionState.convertingFpFile) {
        // console.info(`MOD: ${conversionState.msgRepCnt} - ${msgPcb}`);
        conversionState.msgReports.push(reportFpError(conversionState.msgRepCnt, msg, lines, conversionState));
    }
    else {
        // console.info(`PCB: ${conversionState.msgRepCnt} - ${msgPcb}`);
        conversionState.msgReports.push(reportPcbError(conversionState.msgRepCnt, msg, lines, conversionState));
    }
    return [];
}
exports.reportError = reportError;
function isCopper(layerName) {
    return layerName.endsWith('.Cu');
}
function getNetId(_a, netName) {
    var nets = _a.nets;
    if (!netName) {
        return -1;
    }
    var index = nets.indexOf(netName);
    if (index >= 0) {
        return index;
    }
    nets.push(netName);
    return nets.length - 1;
}
exports.getNetId = getNetId;
function convertVia(args, conversionState, parentCoords) {
    var x = args[0], y = args[1], diameter = args[2], net = args[3], drill = args[4], id = args[5], locked = args[6];
    var netId = getNetId(conversionState, net);
    return [
        '_LF_',
        [
            'via',
            kiAt(x, y, undefined, parentCoords),
            ['size', kiUnits(diameter)],
            ['drill', kiUnits(drill) * 2],
            ['layers', 'F.Cu', 'B.Cu'],
            netId > 0 ? null : ['free'],
            ['net', netId > 0 ? netId : 0],
        ],
    ];
}
exports.convertVia = convertVia;
function convertTrack(args, conversionState, objName, parentCoords) {
    if (objName === void 0) { objName = 'segment'; }
    if (parentCoords === void 0) { parentCoords = { x: 0, y: 0, angle: 0 }; }
    var width = args[0], layer = args[1], net = args[2], coords = args[3], id = args[4], locked = args[5];
    var round = false;
    var netId = getNetId(conversionState, net);
    var coordList = coords.split(' ');
    var result = [];
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        return reportError(layerName.substring(1) + "found in TRACK (" + id + "); track ignored", conversionState);
    }
    // try to eliminate x/y differences by rounding
    // for segments of edge cut (broadoutline issue #45)
    if (layerName === 'Edge.Cuts') {
        round = true;
    }
    var lineType = objName === 'segment' && !isCopper(layerName) ? 'gr_line' : objName;
    for (var i = 0; i < coordList.length - 2; i += 2) {
        result.push(objName === 'fp_line' ? '_LF1_' : '_LF_');
        result.push(__spreadArrays([
            lineType
        ], kiStartEnd(coordList[i], coordList[i + 1], coordList[i + 2], coordList[i + 3], round, parentCoords), [
            ['width', kiUnits(width)],
            ['layer', layerName],
            isCopper(layerName) && netId > 0 ? ['net', netId] : null,
            locked === '1' ? ['status', 40000] : null,
        ]));
    }
    return result;
}
exports.convertTrack = convertTrack;
function textLayer(layer, conversionState, footprint, isName) {
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        return layerName;
    }
    else if (layerName && footprint && isName) {
        return layerName.replace('.SilkS', '.Fab');
    }
    else {
        return layerName;
    }
}
function convertText(args, conversionState, objName, parentCoords) {
    if (objName === void 0) { objName = 'gr_text'; }
    var type = args[0], // N/P/L (Name/Prefix/Label)
    x = args[1], y = args[2], lineWidth = args[3], angle = args[4], mirror = args[5], layer = args[6], net = args[7], fontSize = args[8], text = args[9], path = args[10], display = args[11], id = args[12], font = args[13], locked = args[14];
    var layerName = textLayer(layer, conversionState, objName === 'fp_text', type === 'N');
    var parent = parentCoords !== undefined ? " of " + parentCoords.fpId : '';
    if (layerName.charAt(0) === '#') {
        return reportError(layerName.substring(1) + "found in TEXT (" + id + ")" + parent + "; text ignored", conversionState);
    }
    var fontTable = {
        'NotoSerifCJKsc-Medium': { width: 0.8, height: 0.8, thickness: 0.3 },
        'NotoSansCJKjp-DemiLight': { width: 0.6, height: 0.6, thickness: 0.5 },
    };
    // enhancement: added height for better fit of font
    var fontMultiplier = font in fontTable ? fontTable[font] : { width: 0.75, height: 0.9, thickness: 0.8 };
    var actualFontWidth = kiUnits(fontSize) * fontMultiplier.width;
    var actualFontHeight = kiUnits(fontSize) * fontMultiplier.height;
    return [
        objName === 'gr_text' ? '_LF_' : '_LF1_',
        [
            objName,
            // with fp_text and N/P/L: (Name:value/Prefix:reference/Label:user); with gr_text:null (BUG FIX)
            objName === 'fp_text' ? (type === 'P' ? 'reference' : type === 'N' ? 'value' : 'user') : null,
            text,
            kiAt(x, y, angle, parentCoords),
            ['layer', layerName],
            display === 'none' ? 'hide' : null,
            [
                'effects',
                [
                    'font',
                    ['size', actualFontHeight, actualFontWidth],
                    ['thickness', kiUnits(lineWidth) * fontMultiplier.thickness],
                ],
                ['justify', 'left', layerName.charAt(0) === 'B' ? 'mirror' : null],
            ],
        ],
    ];
}
exports.convertText = convertText;
function convertArc(args, conversionState, objName, transform) {
    if (objName === void 0) { objName = 'gr_arc'; }
    var round = false;
    var width = args[0], layer = args[1], net = args[2], path = args[3], _ = args[4], id = args[5], locked = args[6];
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        var parent = transform !== undefined ? " of " + transform.fpId : '';
        return reportError(layerName + "found in ARC (" + id + ")" + parent + " ; arc ignored", conversionState);
    }
    var netId = getNetId(conversionState, net);
    if (isCopper(layerName) && netId > 0) {
        var msg = "Warning: Found arc (" + id + ") on " + layerName + " with netname " + netId + ": arc is kept; unsupported netname omitted." +
            '\\nNote: manual checks are needed; circle not part of ratsnest and this will isolate arc.';
        return reportError(msg, conversionState, 2);
    }
    var pathMatch = /^M\s*([-\d.\s]+)A\s*([-\d.\s]+)$/.exec(path.replace(/[,\s]+/g, ' '));
    if (!pathMatch) {
        var parent = transform !== undefined ? " of " + transform.fpId : '';
        var msg = "Error: invalid arc\\npath: " + path + "\\nfound in ARC (" + id + ")" + parent + " on layer " + layerName + "; arc ignored";
        return reportError(msg, conversionState, 3);
    }
    var match = pathMatch[0], startPoint = pathMatch[1], arcParams = pathMatch[2];
    var _a = startPoint.split(' '), startX = _a[0], startY = _a[1];
    var _b = arcParams.split(' '), svgRx = _b[0], svgRy = _b[1], xAxisRotation = _b[2], largeArc = _b[3], sweep = _b[4], endX = _b[5], endY = _b[6];
    var start = kiCoords(startX, startY, transform);
    var end = kiCoords(endX, endY, transform);
    var _c = rotate({ x: parseFloat(svgRx), y: parseFloat(svgRy) }, (transform === null || transform === void 0 ? void 0 : transform.angle) || 0), rx = _c.x, ry = _c.y;
    var _d = svg_arc_1.computeArc(start.x, start.y, rx, ry, parseFloat(xAxisRotation), largeArc === '1', sweep === '1', end.x, end.y), cx = _d.cx, cy = _d.cy, extent = _d.extent;
    var endPoint = sweep === '1' ? start : end;
    if (isNaN(cx) || isNaN(cy) || isNaN(extent)) {
        var parent = transform !== undefined ? " of " + transform.fpId : '';
        var msg = "Error :function svg-arc.ts returned invalid result for ARC (" + id + ")" + parent + " on layer " + layerName + "; arc ignored";
        return reportError(msg, conversionState);
    }
    var angle = Math.abs(extent);
    if (layerName === 'Edge.Cuts') {
        round = true;
        if (angle > 89 && angle < 91) {
            angle = 90;
        }
        if (angle > 44 && angle < 46) {
            angle = 45;
        }
    }
    return [
        objName === 'gr_arc' ? '_LF_' : '_LF1_',
        [
            objName,
            ['start', kiUnits(cx, round), kiUnits(cy, round)],
            ['end', kiUnits(endPoint.x, round), kiUnits(endPoint.y, round)],
            ['angle', angle],
            ['width', kiUnits(width)],
            ['layer', layerName],
        ],
    ];
}
exports.convertArc = convertArc;
function getDrill(holeRadius, holeLength, width, height) {
    // oval hole is dynamically changed by EasyEda based on relation between values (BUG FIX)
    if (holeRadius && holeLength) {
        if (holeLength > holeRadius && height > width) {
            return ['drill', 'oval', holeRadius * 2, holeLength];
        }
        else {
            return ['drill', 'oval', holeLength, holeRadius * 2];
        }
    }
    if (holeRadius) {
        return ['drill', holeRadius * 2];
    }
    return null;
}
function isRectangle(points) {
    if (points.length !== 8) {
        return false;
    }
    var eq = function (a, b) { return Math.abs(a - b) < 0.01; };
    var x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3], x3 = points[4], y3 = points[5], x4 = points[6], y4 = points[7];
    return ((eq(x1, x2) && eq(y2, y3) && eq(x3, x4) && eq(y4, y1)) ||
        (eq(y1, y2) && eq(x2, x3) && eq(y3, y4) && eq(x4, x1)));
}
function rectangleSize(points, rotation) {
    var x1 = points[0], y1 = points[1], x2 = points[2], y2 = points[3], x3 = points[4], y3 = points[5], x4 = points[6], y4 = points[7];
    var width = Math.max(x1, x2, x3, x4) - Math.min(x1, x2, x3, x4);
    var height = Math.max(y1, y2, y3, y4) - Math.min(y1, y2, y3, y4);
    return Math.round(Math.abs(rotation)) % 180 === 90 ? [height, width] : [width, height];
}
function convertPad(args, conversionState, transform, padOnBoard) {
    if (padOnBoard === void 0) { padOnBoard = false; }
    var shape = args[0], x = args[1], y = args[2], width = args[3], height = args[4], layerId = args[5], net = args[6], num = args[7], holeRadius = args[8], points = args[9], rotation = args[10], id = args[11], holeLength = args[12], holePoints = args[13], plated = args[14], locked = args[15], u1 = args[16], u2 = args[17], holeXY = args[18];
    var padShapes = {
        ELLIPSE: 'circle',
        RECT: 'rect',
        OVAL: 'oval',
        POLYGON: 'custom',
    };
    var centerCoords = kiCoords(x, y);
    var polygonTransform = {
        x: centerCoords.x,
        y: centerCoords.y,
        angle: parseFloat(rotation),
    };
    var pointList = points.split(' ').map(parseFloat);
    var pointsAreRectangle = padShapes[shape] === 'custom' && isRectangle(pointList);
    var actualShape = pointsAreRectangle ? 'RECT' : shape;
    var isCustomShape = padShapes[actualShape] === 'custom';
    if (isCustomShape && !points.length) {
        var parent = transform !== undefined ? " of " + transform.fpId : '';
        var msg = "Error: No points defined  for polygon in PAD (" + id + ")" + parent + "; pad ignored";
        return reportError(msg, conversionState);
    }
    var layers = {
        1: ['F.Cu', 'F.Paste', 'F.Mask'],
        2: ['B.Cu', 'B.Paste', 'B.Mask'],
        11: ['*.Cu', '*.Paste', '*.Mask'],
    };
    var _a = pointsAreRectangle
        ? rectangleSize(pointList, parseFloat(rotation))
        : [width, height], actualWidth = _a[0], actualHeight = _a[1];
    var padNum;
    padNum = padOnBoard ? 1 : parseInt(num, 10);
    var type = '';
    var netId = 0;
    var layer = [];
    var radius = holeRadius;
    // multilayer > tht pad
    if (layerId === '11') {
        if (plated === 'Y') {
            type = 'thru_hole';
            netId = getNetId(conversionState, net);
            layer = layers[layerId];
        }
        else {
            type = 'np_thru_hole';
            layer = ['F&B.Cu', '*.Mask'];
            if (net !== '') {
                var parent = !padOnBoard ? " of " + transform.fpId : '';
                var msg = "Error: netid not supported for PAD " + padNum + " (" + id + ")" + parent + "; netid ignored";
                reportError(msg, conversionState);
            }
        }
        // check for non centered holes (not implemented)
        var _b = holeXY.split(','), hx = _b[0], hy = _b[1];
        var neq = function (a, b) { return Math.abs(parseFloat(a) - parseFloat(b)) > 0.025; };
        if (hx !== '' && hy !== '' && (neq(x, hx) || neq(y, hy))) {
            var parent = !padOnBoard ? " of " + transform.fpId : '';
            var msg = "Warning: hole in pad may be misplaced for PAD " + padNum + " (" + id + ")" + parent;
            reportError(msg, conversionState);
        }
        // top or bottom layer > smd pad
    }
    else {
        type = 'smd';
        netId = getNetId(conversionState, net);
        layer = layers[layerId];
        radius = '0';
    }
    // strange behaviour of Kicad for custom pad;
    // workaround: make size = hole-radius*2 + 0.1 for custom shape
    var size = [];
    var xy = kiUnits(parseFloat(radius) * 2 + 0.1);
    isCustomShape
        ? (size = ['size', xy, xy])
        : (size = [
            'size',
            Math.max(kiUnits(actualWidth), 0.01),
            Math.max(kiUnits(actualHeight), 0.01),
        ]);
    return [
        '_LF1_',
        [
            'pad',
            isNaN(padNum) ? num : padNum,
            type,
            padShapes[actualShape],
            kiAt(x, y, rotation, transform),
            size,
            __spreadArrays(['layers'], layer),
            getDrill(kiUnits(radius), kiUnits(holeLength), kiUnits(actualWidth), kiUnits(actualHeight)),
            netId > 0 ? ['net', netId, net] : null,
            isCustomShape
                ? [
                    'primitives',
                    [
                        'gr_poly',
                        __spreadArrays(['pts'], pointListToPolygon(points.split(' '), polygonTransform)),
                        ['width', 0.1],
                    ],
                ]
                : null,
        ],
    ];
}
exports.convertPad = convertPad;
function convertBoardPad(args, conversionState) {
    var shape = args[0], x = args[1], y = args[2], width = args[3], height = args[4], layerId = args[5], net = args[6], num = args[7], holeRadius = args[8], points = args[9], rotation = args[10], id = args[11], holeLength = args[12], holePoints = args[13], plated = args[14], locked = args[15], u1 = args[16], u2 = args[17], holeXY = args[18];
    var size = kiUnits(holeRadius);
    var attr = null;
    var value = '';
    var fp = '';
    // multilayer > tht pad
    if (layerId === '11') {
        if (plated === 'Y') {
            fp = 'AutoGenerated:TH_pad_' + id;
            attr = 'through_hole';
            value = 'hole_' + (size * 2).toFixed(2) + '_mm';
        }
        else {
            fp = 'AutoGenerated:NPTH_pad_' + id;
            value = 'hole_' + (size * 2).toFixed(2) + '_mm';
        }
        // top or bottom layer > smd pad
    }
    else {
        fp = 'AutoGenerated:SMD_pad_' + id;
        attr = 'smd';
    }
    return [
        '_LF_',
        __spreadArrays([
            'footprint',
            fp,
            locked === '1' ? 'locked' : null,
            ['layer', 'F.Cu'],
            kiAt(x, y),
            ['attr', attr, 'board_only', 'exclude_from_pos_files', 'exclude_from_bom'],
            '_LF1_',
            ['fp_text', 'reference', id, ['at', 0, 0], ['layer', 'F.SilkS'], 'hide'],
            '_LF1_',
            ['fp_text', 'value', value, ['at', 0, 0], ['layer', 'F.SilkS'], 'hide'],
            '_LF1_'
        ], convertPad(args, conversionState, __assign(__assign({}, kiCoords(x, y)), { angle: 0 }), true)),
    ];
}
exports.convertBoardPad = convertBoardPad;
function convertCircle(args, conversionState, objName, parentCoords) {
    if (objName === void 0) { objName = 'gr_circle'; }
    var x = args[0], y = args[1], radius = args[2], strokeWidth = args[3], layer = args[4], id = args[5], locked = args[6], net = args[7];
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        var parent = parentCoords !== undefined ? " of " + parentCoords.fpId : '';
        return reportError(layerName.substring(1) + "found in CIRCLE (" + id + ")" + parent + "; circle ignored", conversionState);
    }
    var netId = getNetId(conversionState, net);
    if (isCopper(layerName) && netId > 0) {
        var msg = "Warning: Found circle (" + id + ") on " + layerName + " with netname " + netId + ": circle is kept; unsupported netname omitted." +
            '\\nNote: manual checks are needed; circle not part of ratsnest and this will isolate circle.';
        return reportError(msg, conversionState, 2);
    }
    var center = kiCoords(x, y, parentCoords);
    return [
        objName === 'gr_circle' ? '_LF_' : '_LF1_',
        [
            objName,
            ['center', kiUnits(center.x), kiUnits(center.y)],
            ['end', kiUnits(center.x) + kiUnits(radius), kiUnits(center.y)],
            ['layer', layerName],
            ['width', kiUnits(strokeWidth)],
        ],
    ];
}
exports.convertCircle = convertCircle;
function convertRect(args, conversionState, objName, parentCoords) {
    if (objName === void 0) { objName = 'gr_rect'; }
    var rx = args[0], ry = args[1], width = args[2], height = args[3], layer = args[4], id = args[5], locked = args[6], u1 = args[7], u2 = args[8], u3 = args[9], net = args[10];
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        var parent = parentCoords !== undefined ? " of " + parentCoords.fpId : '';
        return reportError(layerName.substring(1) + "found in RECT (" + id + ")" + parent + "; rect ignored", conversionState);
    }
    var start = kiCoords(rx, ry, parentCoords);
    var x = start.x;
    var y = start.y;
    var w = parseFloat(width);
    var h = parseFloat(height);
    var netId = getNetId(conversionState, net);
    var polygonPoints = [];
    // convert rectangle on copper with net to Kicad zone
    if (isCopper(layerName) && netId > 0) {
        var points = [x, y, x, y + h, x + w, y + h, x + w, y, x, y];
        for (var i = 0; i < points.length; i += 2) {
            polygonPoints.push(['xy', kiUnits(points[i]), kiUnits(points[i + 1])]);
        }
        conversionState.pcbCuZoneCount += 1;
        return [
            '_LF_',
            [
                'zone',
                ['net', netId],
                ['net_name', net],
                ['layer', layerName],
                id !== '' ? ['name', id] : null,
                ['hatch', 'edge', 0.508],
                ['priority', 1],
                ['connect_pads', 'yes', ['clearance', 0]],
                '_LF1_',
                ['fill', 'yes', ['thermal_gap', 0], ['thermal_bridge_width', 0.254]],
                '_LF1_',
                ['polygon', __spreadArrays(['pts'], polygonPoints)],
            ],
        ];
    }
    return [
        objName === 'gr_rect' ? '_LF_' : '_LF1_',
        [
            objName === 'fp_rect' ? 'fp_rect' : objName,
            ['start', kiUnits(start.x), kiUnits(start.y)],
            ['end', kiUnits(start.x + parseFloat(width)), kiUnits(start.y + parseFloat(height))],
            ['layer', layerName],
            ['width', 0.1],
            ['fill', 'solid'],
        ],
    ];
}
exports.convertRect = convertRect;
function pointListToPolygon(points, parentCoords) {
    var polygonPoints = [];
    for (var i = 0; i < points.length; i += 2) {
        var coords = kiCoords(points[i], points[i + 1], parentCoords);
        polygonPoints.push(['xy', kiUnits(coords.x), kiUnits(coords.y)]);
    }
    return polygonPoints;
}
function pathToPolygon(path, layer, parentCoords) {
    if (path.indexOf('A') >= 0) {
        return null;
    }
    var points = path.split(/[ ,LM]/).filter(function (p) { return !isNaN(parseFloat(p)); });
    return pointListToPolygon(points, parentCoords);
}
function convertPolygon(args, conversionState, parentCoords) {
    var layer = args[0], net = args[1], path = args[2], type = args[3], id = args[4], locked = args[7];
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        var parent = parentCoords !== undefined ? " of " + parentCoords.fpId : '';
        return reportError(layerName.substring(1) + "found in SOLIDREGION (" + id + ")" + parent + "; solidregion ignored", conversionState);
    }
    if (type !== 'solid') {
        var parent = parentCoords !== undefined ? " of " + parentCoords.fpId : '';
        return reportError("Warning: unsupported type " + type + " found in SOLIDREGION " + id + parent +
            (" on layer " + layerName + "; solidregion ignored"), conversionState);
    }
    var polygonPoints = pathToPolygon(path, layer, parentCoords);
    if (!polygonPoints) {
        var parent = parentCoords !== undefined ? " of " + parentCoords.fpId : '';
        return reportError("Error: No points defined  for polygon in SOLIDREGION (" + id + ")" + parent +
            (" on layer " + layerName + "; solidregion ignored"), conversionState);
    }
    return [
        '_LF1_',
        ['fp_poly', __spreadArrays(['pts'], polygonPoints), ['layer', layerName], ['width', 0]],
    ];
}
exports.convertPolygon = convertPolygon;
function convertCopperArea(args, conversionState) {
    var strokeWidth = args[0], layer = args[1], net = args[2], path = args[3], clearanceWidth = args[4], fillStyle = args[5], id = args[6], thermalType = args[7], keepIsland = args[8], copperZone = args[9], locked = args[10], areaName = args[11], unknown = args[12], gridLineWidth = args[13], gridLineSpacing = args[14], copperToBoardoutline = args[15], improveFab = args[16], spokeWidth = args[17];
    var netId = getNetId(conversionState, net);
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        return reportError(layerName.substring(1) + "found in COPPERAREA (" + id + "); copperarea ignored", conversionState);
    }
    if (fillStyle === 'none' || fillStyle === '') {
        return reportError("Warning: Unsupported type \"No Solid\" of COPPERAREA (" + id + ") on layer " + layerName + "; copperarea ignored", conversionState);
    }
    var pointList = path.split(/[ ,LM]/).filter(function (p) { return !isNaN(parseFloat(p)); });
    var polygonPoints = [];
    for (var i = 0; i < pointList.length; i += 2) {
        var coords = kiCoords(pointList[i], pointList[i + 1]);
        polygonPoints.push(['xy', kiUnits(coords.x), kiUnits(coords.y)]);
    }
    conversionState.pcbCuZoneCount += 1;
    return [
        '_LF_',
        [
            'zone',
            ['net', netId],
            ['net_name', net],
            ['layer', layerName],
            areaName !== '' ? ['name', areaName] : null,
            ['hatch', 'edge', 0.508],
            net === 'GND' ? ['priority', 0] : ['priority', 1],
            [
                'connect_pads',
                thermalType === 'direct' ? 'yes' : null,
                ['clearance', kiUnits(clearanceWidth)],
            ],
            '_LF1_',
            [
                'fill',
                'yes',
                fillStyle === 'grid' ? ['mode', 'hatch'] : null,
                ['thermal_gap', kiUnits(clearanceWidth)],
                kiUnits(spokeWidth) >= 0.254
                    ? ['thermal_bridge_width', kiUnits(spokeWidth)]
                    : ['thermal_bridge_width', 0.254],
                keepIsland === 'yes' ? ['island_removal_mode', 1] : null,
                keepIsland === 'yes' ? ['island_area_min', 0] : null,
                fillStyle === 'grid' ? ['hatch_thickness', kiUnits(gridLineWidth)] : null,
                fillStyle === 'grid' ? ['hatch_gap', kiUnits(gridLineSpacing)] : null,
                fillStyle === 'grid' ? ['hatch_orientation', 0] : null,
            ],
            '_LF1_',
            ['polygon', __spreadArrays(['pts'], polygonPoints)],
        ],
    ];
}
exports.convertCopperArea = convertCopperArea;
function convertSolidRegion(args, conversionState) {
    var layer = args[0], net = args[1], path = args[2], type = args[3], id = args[4], locked = args[5];
    var layerName = getLayerName(layer, conversionState);
    if (layerName.charAt(0) === '#') {
        return reportError(layerName.substring(1) + "found in SOLIDREGION (" + id + "); solidregion ignored", conversionState);
    }
    if (type === '') {
        return reportError("Warning: No type supplied of SOLIDREGION (" + id + ") on layer " + layerName + "; solidregion ignored", conversionState);
    }
    var polygonPoints = pathToPolygon(path, layer);
    var netId = getNetId(conversionState, net);
    if (!polygonPoints) {
        return reportError("Warning: Unsupported path with arcs found in SOLIDREGION (" + id + ") on layer " + layerName + "; solidregion ignored", conversionState);
    }
    switch (type) {
        case 'cutout':
            // keepout zone; allowed / not_allowed can not be checked, needs checking by user
            // note: cutout is no longer supported by EasyEda gui; use No Solid as replacement without net name
            conversionState.pcbKeepoutZoneCount += 1;
            return [
                '_LF_',
                [
                    'zone',
                    ['net', 0],
                    ['net_name', ''],
                    ['hatch', 'edge', 0.508],
                    ['layer', layerName],
                    id !== '' ? ['name', id] : null,
                    '_LF1_',
                    [
                        'keepout',
                        ['tracks', 'allowed'],
                        ['vias', 'allowed'],
                        ['pads', 'allowed'],
                        ['copperpour', 'not_allowed'],
                        ['footprints', 'allowed'],
                    ],
                    '_LF1_',
                    ['polygon', __spreadArrays(['pts'], polygonPoints)],
                ],
            ];
        case 'solid':
            // convert solidregion with net to Kicad Cu zone
            if (type === 'solid' && isCopper(layerName) && netId > 0) {
                conversionState.pcbCuZoneCount += 1;
                return [
                    '_LF_',
                    [
                        'zone',
                        ['net', netId],
                        ['net_name', net],
                        ['layer', layerName],
                        ['hatch', 'edge', 0.508],
                        layerName === 'GND' ? ['priority', 0] : ['priority', 1],
                        ['connect_pads', 'yes', ['clearance', 0]],
                        '_LF1_',
                        ['fill', 'yes', ['thermal_gap', 0], ['thermal_bridge_width', 0.254]],
                        '_LF1_',
                        ['polygon', __spreadArrays(['pts'], polygonPoints)],
                    ],
                ];
                // filled shape
            }
            else {
                return [
                    '_LF_',
                    [
                        'gr_poly',
                        __spreadArrays(['pts'], polygonPoints),
                        ['layer', layerName],
                        ['width', 0],
                        ['fill', 'solid'],
                    ],
                ];
            }
        case 'npth':
            // board cutout (layer Edge.Cuts)
            return [
                '_LF_',
                ['gr_poly', __spreadArrays(['pts'], polygonPoints), ['layer', layerName], ['width', 0.254]],
            ];
        default:
            return reportError("Warning: unsupported type " + type + " found in SOLIDREGION " + id + " on layer " + layerName + "; solidregion ignored", conversionState);
    }
}
exports.convertSolidRegion = convertSolidRegion;
function convertHole(args) {
    var x = args[0], y = args[1], radius = args[2], id = args[3], locked = args[4];
    var size = kiUnits(radius) * 2;
    return [
        '_LF_',
        [
            'footprint',
            "AutoGenerated:MountingHole_" + size.toFixed(2) + "mm",
            locked === '1' ? 'locked' : null,
            ['layer', 'F.Cu'],
            kiAt(x, y),
            ['attr', 'virtual'],
            '_LF1_',
            ['fp_text', 'reference', '', ['at', 0, 0], ['layer', 'F.SilkS']],
            '_LF1_',
            ['fp_text', 'value', '', ['at', 0, 0], ['layer', 'F.SilkS']],
            '_LF1_',
            [
                'pad',
                '',
                'np_thru_hole',
                'circle',
                ['at', 0, 0],
                ['size', size, size],
                ['drill', size],
                ['layers', '*.Cu', '*.Mask'],
            ],
        ],
    ];
}
exports.convertHole = convertHole;
function convertSvgNode(args, conversionState) {
    var origin = [4000, 3000]; // Eda origin
    var scale = 0.254; // 10 mill Eda units to mm
    var resolution = 1; // 4 points per mm curve
    var result = [];
    var svgShapes;
    var imageSvg = JSON.parse(args[0]);
    var layerName = getLayerName(imageSvg.layerid, conversionState);
    if (layerName.charAt(0) === '#') {
        return reportError(layerName.substring(1) + "found in SVGNODE (" + imageSvg.gId + "); svgnode ignored", conversionState);
    }
    var data = svgnode_1.parseSvgPath(imageSvg.attrs.d, conversionState, layerName);
    if (data) {
        svgShapes = svgnode_1.svgToPoly(data, resolution, origin, scale);
        var svgShape = void 0;
        for (var _i = 0, svgShapes_1 = svgShapes; _i < svgShapes_1.length; _i++) {
            svgShape = svgShapes_1[_i];
            result.push([
                'gr_poly',
                __spreadArrays(['pts'], svgShape),
                ['layer', layerName],
                ['width', 0.127],
                ['fill', 'solid'],
            ]);
        }
        return result;
    }
    else {
        return [];
    }
}
function flatten(arr) {
    var _a;
    return (_a = []).concat.apply(_a, arr);
}
function convertBoardToArray(board) {
    var shape;
    var vias = [];
    var tracks = [];
    var texts = [];
    var arcs = [];
    var copperareas = [];
    var solidregions = [];
    var circles = [];
    var holes = [];
    var footprints = [];
    var padvias = [];
    var rects = [];
    var svgnodes = [];
    var nets = (board.routerRule || { nets: [] }).nets;
    var conversionState = {
        nets: nets,
        innerLayers: 0,
        fpValue: '',
        msgRepCnt: 0,
        msgReports: [],
        msgReportsPosition: 0,
        pcbCuZoneCount: 0,
        pcbKeepoutZoneCount: 0,
    };
    // Kicad expects net 0 to be empty
    nets.unshift('');
    /*
    const [type, bw, bh, bg, gv, gc, gs, cw, ch, gst, ss, u,
    as, u1, u2, u3, ox, oy,] = board.canvas.split('~');
    */
    var msg = 'Info: below are the conversion remarks. The conversion may contain errors.' +
        '\\nPlease read the remarks carefully and run the DRC check to solve issues.' +
        '\\nTo find a component mentioned in the remarks go to:' +
        '\\nKicad menu Edit > Find and enter the EDA_id (gge....); search for other text items.' +
        '\\nOnly the id of the footprint can be found; the id of the shape is in the input json.' +
        '\\nYou can export the footprints to a library by Kicad menu File > Export > Export Fps to (new) Library';
    reportError(msg, conversionState, 8);
    for (var _i = 0, _a = board.shape; _i < _a.length; _i++) {
        shape = _a[_i];
        var _b = shape.split('~'), type = _b[0], args = _b.slice(1);
        if (type === 'VIA') {
            vias.push.apply(vias, convertVia(args, conversionState));
        }
        else if (type === 'TRACK') {
            tracks.push.apply(tracks, convertTrack(args, conversionState));
        }
        else if (type === 'TEXT') {
            texts.push.apply(texts, convertText(args, conversionState));
        }
        else if (type === 'ARC') {
            arcs.push.apply(arcs, convertArc(args, conversionState));
        }
        else if (type === 'COPPERAREA') {
            copperareas.push.apply(copperareas, convertCopperArea(args, conversionState));
        }
        else if (type === 'SOLIDREGION') {
            solidregions.push.apply(solidregions, convertSolidRegion(args, conversionState));
        }
        else if (type === 'CIRCLE') {
            circles.push.apply(circles, convertCircle(args, conversionState));
        }
        else if (type === 'HOLE') {
            holes.push.apply(holes, convertHole(args));
        }
        else if (type === 'LIB') {
            footprints.push.apply(footprints, footprint_v6_1.convertFp(args.join('~'), conversionState));
        }
        else if (type === 'PAD') {
            padvias.push.apply(padvias, convertBoardPad(args, conversionState));
        }
        else if (type === 'RECT') {
            rects.push.apply(rects, convertRect(args, conversionState));
        }
        else if (type === 'SVGNODE') {
            svgnodes.push.apply(svgnodes, convertSvgNode(args, conversionState));
        }
        else {
            reportError("Warning: unsupported shape " + type + " found on pcb board; ignored", conversionState);
        }
    }
    if (conversionState.pcbCuZoneCount > 0) {
        var msg1 = "Info: total of " + conversionState.pcbCuZoneCount + " Cu zones were created. Run DRC to check for overlap of zones." +
            '\\nAdjust zone priority to solve this. Adjust other parameters as needed.' +
            '\\nNote: merge zones if possible (right click selected 2 zones > Zones > Merge zones).';
        reportError(msg1, conversionState, 3);
    }
    if (conversionState.pcbKeepoutZoneCount > 0) {
        var msg2 = "Info: total of " + conversionState.pcbKeepoutZoneCount + " keep-out zones were create. Run DRC to check for zone settings." +
            '\\nAdjust zone keep-out checkboxes as needed.';
        reportError(msg2, conversionState, 2);
    }
    if (conversionState.msgRepCnt > 1) {
        console.warn("In total " + conversionState.msgRepCnt + " messages were created during the conversion. " +
            "Check messages on pcb layer User.Cmts for more details.");
    }
    var netlist = flatten(nets.map(function (net, idx) { return [['net', idx, net], '_LF_']; }));
    var outputObjs = __spreadArrays([
        '_LF_'
    ], netlist, footprints, tracks, copperareas, solidregions, svgnodes, arcs, rects, circles, holes, vias, padvias, texts).filter(function (obj) { return obj != null; });
    var innerLayers = [];
    for (var i = 1; i <= conversionState.innerLayers; i++) {
        innerLayers.push('_LF_');
        innerLayers.push([i, "In" + i + ".Cu", 'signal']);
    }
    var layers = __spreadArrays([
        '_LF1_',
        [0, 'F.Cu', 'signal'],
        '_LF1_'
    ], innerLayers, [
        [31, 'B.Cu', 'signal'],
        '_LF1_',
        [32, 'B.Adhes', 'user'],
        '_LF1_',
        [33, 'F.Adhes', 'user'],
        '_LF1_',
        [34, 'B.Paste', 'user'],
        '_LF1_',
        [35, 'F.Paste', 'user'],
        '_LF1_',
        [36, 'B.SilkS', 'user'],
        '_LF1_',
        [37, 'F.SilkS', 'user'],
        '_LF1_',
        [38, 'B.Mask', 'user'],
        '_LF1_',
        [39, 'F.Mask', 'user'],
        '_LF1_',
        [40, 'Dwgs.User', 'user'],
        '_LF1_',
        [41, 'Cmts.User', 'user'],
        '_LF1_',
        [42, 'Eco1.User', 'user'],
        '_LF1_',
        [43, 'Eco2.User', 'user'],
        '_LF1_',
        [44, 'Edge.Cuts', 'user'],
        '_LF1_',
        [45, 'Margin', 'user'],
        '_LF1_',
        [46, 'B.CrtYd', 'user'],
        '_LF1_',
        [47, 'F.CrtYd', 'user'],
        '_LF1_',
        [48, 'B.Fab', 'user', 'hide'],
        '_LF1_',
        [49, 'F.Fab', 'user', 'hide'],
    ]);
    // date 20210220 > creation date of Kicad nightly
    // used for testing conversion results
    return __spreadArrays([
        'kicad_pcb',
        ['version', 20210220],
        ['generator', 'pcbnew'],
        ['general', ['thickness', 1.6]],
        ['paper', 'A4'],
        '_LF_',
        __spreadArrays(['layers'], layers)
    ], outputObjs, flatten(conversionState.msgReports));
}
exports.convertBoardToArray = convertBoardToArray;
function convertBoardV6(board) {
    return spectra_1.encodeObject(convertBoardToArray(board));
}
exports.convertBoardV6 = convertBoardV6;
//# sourceMappingURL=board-v6.js.map