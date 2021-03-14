"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svgToPoly = exports.parseSvgPath = void 0;
var board_v6_1 = require("./board-v6");
function parseSvgPath(path, conversionState, layerName) {
    var paths = [];
    var svg;
    // do we have path commands unsupported by svgToPoly?
    var regex1 = /[aAsStTvVzZhHmlcq]/g;
    if (regex1.test(path)) {
        var msg1 = "Warning : unsupported SVGNODE found on layer " + layerName + "; svgnode ignored";
        board_v6_1.reportError(msg1, conversionState);
        return null;
    }
    var regex2 = /([MLCQ])([^MLCQ]*)/g;
    // tslint:disable-next-line
    while ((svg = regex2.exec(path)) !== null) {
        var checkedPath = check(svg[1], svg[2]);
        if (checkedPath === null) {
            return null;
        }
        else {
            paths.push.apply(paths, checkedPath);
        }
    }
    // do we have multiple polylines at the end?
    var count = function (str) {
        return ((str || '').match(/M/g) || []).length;
    };
    var polycnt = count(path);
    if (polycnt > 1) {
        var msg2 = "Info : SVGNODE on layer " + layerName + " has been converted into " + polycnt + " polylines." +
            '\\nSvg cutouts are not supported and result in overlapping filled polylines.' +
            '\\nNot OK? -> You can change the fill of some polylines to change the image.';
        board_v6_1.reportError(msg2, conversionState, 3);
    }
    return paths;
    function parseValues(args) {
        var regex = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;
        var numbers = args.match(regex);
        return numbers ? numbers.map(function (numbr) { return parseFloat(numbr); }) : [];
    }
    function check(command, args) {
        var length = {
            a: 7,
            c: 6,
            h: 1,
            l: 2,
            m: 2,
            q: 4,
            s: 4,
            t: 2,
            v: 1,
            z: 0,
        };
        var data = [];
        var type = command.toLowerCase();
        var numbers = parseValues(args);
        // overloaded moveTo: insert l/L after first 2 numbers
        if (type === 'm' && numbers.length > 2) {
            data.push({ cmd: command, numbrs: numbers.splice(0, 2) });
            type = 'l';
            command = command === 'm' ? 'l' : 'L';
        }
        while (true) {
            if (numbers.length === length[type]) {
                data.push({ cmd: command, numbrs: numbers });
                return data;
            }
            if (numbers.length < length[type]) {
                var msg2 = "Error : incorrect SVGNODE found on layer " + layerName + "; svgnode ignored";
                board_v6_1.reportError(msg2, conversionState);
                return null;
            }
            data.push({ cmd: command, numbrs: numbers.splice(0, length[type]) });
        }
    }
}
exports.parseSvgPath = parseSvgPath;
function svgToPoly(paths, resolution, // relative size of segments
o, // global origin coords
s // required scale factor
) {
    var poly = [];
    var xy = [];
    var curX = 0;
    var curY = 0;
    for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
        var path = paths_1[_i];
        var cmd = path.cmd;
        var p = path.numbrs;
        if (cmd === 'M') {
            // we have the start of a new polyline
            if (xy.length !== 0) {
                poly.push(xy);
                xy = [];
            }
            xy.push(['xy', normX(p[0], o, s), normY(p[1], o, s)]);
            curX = p[0];
            curY = p[1];
        }
        else if (cmd === 'C') {
            var len = length(cmd, p, curX, curY);
            var nbrOfXY = Math.ceil(len * resolution);
            for (var j = 0; j < nbrOfXY; j++) {
                var t = j / nbrOfXY;
                var x = xOf_C(p, t, curX);
                var y = yOf_C(p, t, curY);
                xy.push(['xy', normX(x, o, s), normY(y, o, s)]);
            }
            xy.push(['xy', normX(p[4], o, s), normY(p[5], o, s)]);
            curX = p[4];
            curY = p[5];
        }
        else if (cmd === 'Q') {
            var len = length(cmd, p, curX, curY);
            var nbrOfXY = Math.ceil(len * resolution);
            for (var j = 0; j < nbrOfXY; j++) {
                var t = j / nbrOfXY;
                var x = xOf_Q(p, t, curX);
                var y = yOf_Q(p, t, curY);
                xy.push(['xy', normX(x, o, s), normY(y, o, s)]);
            }
            xy.push(['xy', normX(p[2], o, s), normY(p[3], o, s)]);
            curX = p[2];
            curY = p[3];
        }
        else if (cmd === 'L') {
            xy.push(['xy', normX(p[0], o, s), normY(p[1], o, s)]);
            curX = p[0];
            curY = p[1];
        }
    }
    poly.push(xy);
    return poly;
    function normX(x, origin, scale) {
        return (x - origin[0]) * scale;
    }
    function normY(y, origin, scale) {
        return (y - origin[1]) * scale;
    }
    function xOf_C(p, t, startX) {
        return (Math.pow(1 - t, 3) * startX +
            3 * Math.pow(1 - t, 2) * t * p[0] +
            3 * (1 - t) * Math.pow(t, 2) * p[2] +
            Math.pow(t, 3) * p[4]);
    }
    function yOf_C(p, t, startY) {
        return (Math.pow(1 - t, 3) * startY +
            3 * Math.pow(1 - t, 2) * t * p[1] +
            3 * (1 - t) * Math.pow(t, 2) * p[3] +
            Math.pow(t, 3) * p[5]);
    }
    function xOf_Q(p, t, startX) {
        return Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * p[0] + Math.pow(t, 2) * p[2];
    }
    function yOf_Q(p, t, startY) {
        return Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * p[1] + Math.pow(t, 2) * p[3];
    }
    function dist(ax, ay, bx, by) {
        var x = ax - bx;
        var y = ay - by;
        return Math.sqrt(x * x + y * y);
    }
    function length(cmd, p, startX, startY) {
        var currentX = startX;
        var currentY = startY;
        var len = 0;
        var n = 100;
        for (var j = 0; j <= n; j++) {
            var t = j / n;
            var x = 0;
            var y = 0;
            if (cmd === 'C') {
                x = xOf_C(p, t, startX);
                y = yOf_C(p, t, startY);
            }
            else {
                x = xOf_Q(p, t, startX);
                y = yOf_Q(p, t, startY);
            }
            len += dist(curX, curY, x, y);
            currentX = x;
            currentY = y;
        }
        return len;
    }
}
exports.svgToPoly = svgToPoly;
//# sourceMappingURL=svgnode.js.map