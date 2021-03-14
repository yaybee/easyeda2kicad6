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
exports.convertFootprintV6 = exports.convertFp = void 0;
var board_v6_1 = require("./board-v6");
var spectra_1 = require("./spectra");
// doc: https://docs.easyeda.com/en/DocumentFormat/3-EasyEDA-PCB-File-Format/index.html#shapes
function convertLibHole(args, transform) {
    var x = args[0], y = args[1], radius = args[2], id = args[3], locked = args[4];
    var size = board_v6_1.kiUnits(radius) * 2;
    return [
        '_LF1_',
        [
            'pad',
            '',
            'np_thru_hole',
            'circle',
            board_v6_1.kiAt(x, y, undefined, transform),
            ['size', size, size],
            ['drill', size],
            ['layers', '*.Cu', '*.Mask'],
        ],
    ];
}
function convertLibVia(args, conversionState, isFp, transform) {
    // via without net becomes fp hole,
    // via with net becomes pcb via (not for footprint)
    var x = args[0], y = args[1], diameter = args[2], net = args[3], drill = args[4], id = args[5], locked = args[6];
    if (net === '' || net === '0') {
        var size = board_v6_1.kiUnits(drill) * 2;
        var hole = [
            '_LF1_',
            [
                'pad',
                '',
                'np_thru_hole',
                'circle',
                board_v6_1.kiAt(x, y, undefined, transform),
                ['size', size, size],
                ['drill', size],
                ['layers', '*.Cu', '*.Mask'],
            ],
        ];
        return [hole, null, null];
    }
    else {
        if (isFp) {
            var msg = "Warning: unsupported VIA found (" + id + "); via ignored";
            var error = board_v6_1.reportError(msg, conversionState);
            return [null, null, error];
        }
        else {
            var msg = "Warning: unsupported VIA found (" + id + ") of " + transform.fpId + " on net " + net + "; converted in pcb via";
            var error = board_v6_1.reportError(msg, conversionState);
            var via = [
                '_LF_',
                [
                    'via',
                    board_v6_1.kiAt(x, y, undefined),
                    ['size', board_v6_1.kiUnits(diameter)],
                    ['drill', board_v6_1.kiUnits(drill) * 2],
                    ['layers', 'F.Cu', 'B.Cu'],
                    ['net', board_v6_1.getNetId(conversionState, net)],
                ],
            ];
            return [null, via, error];
        }
    }
}
function convertHead(head, fpProp) {
    var libProperties = [];
    var label;
    var layer;
    var at;
    var effects;
    var properties = {
        value: ['package', 'fp_text', 'y', 'F.Fab', 'y'],
        tags: ['package', '', 'n', '', 'n'],
        descr: ['link', '', 'n', '', 'n'],
    };
    libProperties.push([
        '_LF1_',
        [
            'fp_text',
            'reference',
            'REF**',
            ['at', 0, 0],
            ['layer', 'F.SilkS'],
            ['effects', ['font', ['size', 1.27, 1.27]]],
        ],
    ]);
    fpProp.fpValue = 'unknown';
    Object.keys(properties).forEach(function (key) {
        var prop = '';
        var libkey = properties[key][0];
        if (head.c_para.hasOwnProperty(libkey)) {
            label = properties[key][1];
            at = properties[key][2];
            layer = properties[key][3];
            effects = properties[key][4];
            prop = head.c_para[libkey];
            switch (key) {
                case 'value':
                    // label = 'fp_text';
                    fpProp.fpValue = prop.replace(/[^\w\s\.\(\)\-]/g, 'x');
                    break;
                case 'tags':
                    prop = prop.split('_')[0] + ', EasyEDA conversion';
                    break;
                case 'descr':
                    prop = 'EasyEDA footprint: ' + prop;
            }
            libProperties.push([
                '_LF1_',
                [
                    label === '' ? null : label,
                    key,
                    prop,
                    at === 'y' ? ['at', 0, 0] : null,
                    layer === '' ? null : ['layer', layer],
                    effects === 'y' ? ['effects', ['font', ['size', 1.27, 1.27]]] : null,
                ],
            ]);
        }
    });
    return libProperties;
}
function flatten(arr) {
    var _a;
    return (_a = []).concat.apply(_a, arr);
}
function convertFp(boardLIB, conversionState, isBoard, footprint) {
    if (isBoard === void 0) { isBoard = true; }
    var footprintProp = [];
    var fpAttrs = [];
    var footprintText = [];
    var footprintArc = [];
    var footprintCircle = [];
    var footprintRect = [];
    var footprintPoly = [];
    var footprintLine = [];
    var footprintHole = [];
    var footprintPad = [];
    var footprintViaToPcb = [];
    //
    // called from board-v6 for processing LIB shape
    //
    if (isBoard) {
        var _a = boardLIB.split('#@$'), fpHead = _a[0], shapeList = _a.slice(1);
        var _b = fpHead.split('~'), x = _b[0], y = _b[1], attributes = _b[2], rotation = _b[3], id = _b[5], locked = _b[9];
        var attrList = attributes.split('`');
        var attrs = {};
        for (var i = 0; i < attrList.length; i += 2) {
            attrs[attrList[i]] = attrList[i + 1];
        }
        var transform = __assign(__assign({}, board_v6_1.kiCoords(x, y)), { angle: board_v6_1.kiAngle(rotation), fpId: id });
        for (var _i = 0, shapeList_1 = shapeList; _i < shapeList_1.length; _i++) {
            var shape = shapeList_1[_i];
            var _c = shape.split('~'), type = _c[0], shapeArgs = _c.slice(1);
            if (type === 'TRACK') {
                footprintLine.push.apply(footprintLine, board_v6_1.convertTrack(shapeArgs, conversionState, 'fp_line', transform));
            }
            else if (type === 'TEXT') {
                footprintText.push.apply(footprintText, board_v6_1.convertText(shapeArgs, conversionState, 'fp_text', transform));
            }
            else if (type === 'ARC') {
                footprintArc.push.apply(footprintArc, board_v6_1.convertArc(shapeArgs, conversionState, 'fp_arc', transform));
            }
            else if (type === 'HOLE') {
                footprintHole.push.apply(footprintHole, convertLibHole(shapeArgs, transform));
            }
            else if (type === 'PAD') {
                footprintPad.push.apply(footprintPad, board_v6_1.convertPad(shapeArgs, conversionState, transform));
            }
            else if (type === 'CIRCLE') {
                footprintCircle.push.apply(footprintCircle, board_v6_1.convertCircle(shapeArgs, conversionState, 'fp_circle', transform));
            }
            else if (type === 'SOLIDREGION') {
                footprintPoly.push.apply(footprintPoly, board_v6_1.convertPolygon(shapeArgs, conversionState, transform));
            }
            else if (type === 'RECT') {
                footprintRect.push.apply(footprintRect, board_v6_1.convertRect(shapeArgs, conversionState, 'fp_rect', transform));
            }
            else if (type === 'VIA') {
                var _d = convertLibVia(shapeArgs, conversionState, false, transform), fpHole = _d[0], pcbVia = _d[1], report = _d[2];
                if (fpHole !== null) {
                    footprintHole.push.apply(footprintHole, fpHole);
                }
                if (report !== null) {
                    footprintText.push.apply(footprintText, report);
                }
                if (pcbVia !== null) {
                    footprintViaToPcb.push.apply(footprintViaToPcb, pcbVia);
                }
            }
            else if (type !== 'SVGNODE') {
                var msg = "Warning: unsupported shape " + type + " found in footprint " + id + " on pcb";
                var error = board_v6_1.reportError(msg, conversionState);
            }
        }
        footprintText.push.apply(footprintText, [
            '_LF1_',
            [
                'fp_text',
                'user',
                id,
                ['at', 0, 0],
                ['layer', 'Cmts.User'],
                ['effects', ['font', ['size', 1, 1], ['thickness', 0.15]]],
            ],
        ]);
        var isSmd = footprintPad.some(function (pad) { return pad && pad[2] === 'smd'; });
        if (isSmd) {
            fpAttrs.push(['attr', 'smd']);
        }
        var fp = attrs.package.replace(/[^\w\s\.\(\)\-]/g, 'x');
        return __spreadArrays([
            '_LF_',
            __spreadArrays([
                'footprint',
                "EasyEDA:" + fp,
                locked === '1' ? 'locked' : null,
                ['layer', 'F.Cu'],
                board_v6_1.kiAt(x, y, rotation)
            ], fpAttrs, footprintText, footprintLine, footprintRect, footprintCircle, footprintArc, footprintPoly, footprintHole, footprintPad)
        ], footprintViaToPcb);
        //
        // called from convertFootprint for processing footprint.json
        //
    }
    else {
        var angle = void 0;
        if (footprint.head.rotation === undefined || isNaN(parseFloat(footprint.head.rotation))) {
            angle = 0;
        }
        else {
            angle = parseFloat(footprint.head.rotation);
        }
        var transform = {
            x: parseFloat(footprint.head.x) - 4000,
            y: parseFloat(footprint.head.y) - 3000,
            angle: angle,
            fpId: 'this fp',
            isFootprintFile: true,
        };
        footprintProp = flatten(convertHead(footprint.head, conversionState));
        for (var _e = 0, _f = footprint.shape; _e < _f.length; _e++) {
            var shape = _f[_e];
            var _g = shape.split('~'), type = _g[0], shapeArgs = _g.slice(1);
            if (type === 'TRACK') {
                footprintLine.push.apply(footprintLine, board_v6_1.convertTrack(shapeArgs, conversionState, 'fp_line', transform));
            }
            else if (type === 'TEXT') {
                footprintText.push.apply(footprintText, board_v6_1.convertText(shapeArgs, conversionState, 'fp_text', transform));
            }
            else if (type === 'ARC') {
                footprintArc.push.apply(footprintArc, board_v6_1.convertArc(shapeArgs, conversionState, 'fp_arc', transform));
            }
            else if (type === 'HOLE') {
                footprintHole.push.apply(footprintHole, convertLibHole(shapeArgs, transform));
            }
            else if (type === 'PAD') {
                footprintPad.push.apply(footprintPad, board_v6_1.convertPad(shapeArgs, conversionState, transform));
            }
            else if (type === 'CIRCLE') {
                footprintCircle.push.apply(footprintCircle, board_v6_1.convertCircle(shapeArgs, conversionState, 'fp_circle', transform));
            }
            else if (type === 'SOLIDREGION') {
                footprintPoly.push.apply(footprintPoly, board_v6_1.convertPolygon(shapeArgs, conversionState, transform));
            }
            else if (type === 'RECT') {
                footprintRect.push.apply(footprintRect, board_v6_1.convertRect(shapeArgs, conversionState, 'fp_rect', transform));
            }
            else if (type === 'VIA') {
                var _h = convertLibVia(shapeArgs, conversionState, true, transform), fpHole = _h[0], pcbVia = _h[1], report = _h[2];
                if (fpHole !== null) {
                    footprintHole.push.apply(footprintHole, fpHole);
                }
                if (report !== null) {
                    footprintText.push.apply(footprintText, report);
                }
            }
            else if (type !== 'SVGNODE') {
                var msg = "Warning: unsupported shape " + type + " found in footprint";
                footprintText.push.apply(footprintText, board_v6_1.reportError(msg, conversionState));
            }
        }
        var isSmd = footprintPad.some(function (pad) { return pad && pad[2] === 'smd'; });
        if (isSmd) {
            fpAttrs.push(['attr', 'smd']);
        }
        // date 20210220 > creation date of Kicad nightly
        // used for testing conversion results
        return __spreadArrays([
            'footprint',
            conversionState.fpValue,
            ['version', 20210220],
            ['generator', 'pcbnew'],
            ['layer', 'F.Cu']
        ], footprintProp, fpAttrs, footprintText, flatten(conversionState.msgReports), footprintLine, footprintRect, footprintCircle, footprintArc, footprintPoly, footprintHole, footprintPad, [
            '_LF1_',
            [
                'model',
                '${KICAD6_3DMODEL_DIR}/EasyEDA.3dshapes/' + conversionState.fpValue + '.wrl',
                ['offset', ['xyz', 0, 0, 0]],
                ['scale', ['xyz', 1, 1, 1]],
                ['rotate', ['xyz', 0, 0, 0]],
            ],
        ]).filter(function (obj) { return obj != null; });
    }
}
exports.convertFp = convertFp;
// main.ts will automatically detect an Eda library .json as input.
//
// How to get a Eda footprint .json file:
// go to Eda online editor and click on library icon (on left side),
// select wanted footprint and click EDIT button
// choose menu File > EasyEDa File Source > click DOWNLOAD button.
//
// The generated output file is saved as "footprintname".kicad_mod;
// Place it in a "pretty" folder, eg EasyEDA.pretty.
// Import folder in Kicad using:
// menu Preferences > Manage Footprint Libraries
function convertFootprintV6(footprint) {
    var conversionState = {
        nets: [],
        innerLayers: 0,
        fpValue: '',
        msgRepCnt: 0,
        msgReports: [],
        msgReportsPosition: 0,
        pcbCuZoneCount: 0,
        pcbKeepoutZoneCount: 0,
        convertingFpFile: true,
    };
    var result = spectra_1.encodeObject(convertFp('null', conversionState, false, footprint));
    if (conversionState.msgRepCnt > 0) {
        console.warn("In total " + conversionState.msgRepCnt + " messages were created during the conversion. " +
            "Check messages on fp layer User.Cmts for more details.");
    }
    return conversionState.fpValue + ".kicad_mod#@$" + result;
}
exports.convertFootprintV6 = convertFootprintV6;
//# sourceMappingURL=footprint-v6.js.map