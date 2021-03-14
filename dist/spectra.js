"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseObject = exports.encodeObject = exports.encodeValue = exports.encodeString = void 0;
var WHITESPACE = [' ', '\t', '\r', '\n'];
function notNull(value) {
    return value !== null;
}
function encodeString(str) {
    // output formatting
    if (str === '_LF_') {
        return '\n';
    }
    if (str === '_LF1_') {
        return '\n  ';
    }
    if (str === '_LF2_') {
        return '\n    ';
    }
    if (str === '_LF3_') {
        return '\n      ';
    }
    if (str === '_LF4_') {
        return '\n        ';
    }
    // make sting without quotes for eg keywords
    if (/^[a-z][a-z0-9_]+$/.test(str)) {
        return str;
        // make special quoted string possible by starting char &
    }
    else if (/^&/.test(str)) {
        return "\"" + str.replace('&', '') + "\"";
    }
    // make quoted string eg for values
    // "" in text field throws Kicad error: changed in ' (BUG FIX)
    return "\"" + str.replace(/"/g, "'") + "\"";
}
exports.encodeString = encodeString;
function encodeNumber(value) {
    return (Math.round(value * 1000 + Number.EPSILON) / 1000).toString();
}
function encodeValue(value) {
    if (typeof value === 'string') {
        return encodeString(value);
    }
    if (typeof value === 'number') {
        return encodeNumber(value);
    }
    return encodeObject(value);
}
exports.encodeValue = encodeValue;
function encodeObject(object) {
    return '(' + object.filter(notNull).map(encodeValue).join(' ') + ')';
}
exports.encodeObject = encodeObject;
function parseElement(input) {
    var idx = 0;
    while (WHITESPACE.includes(input[idx])) {
        idx++;
    }
    if (idx >= input.length) {
        throw new Error('Unexpected end of string');
    }
    if (input[idx] === '(') {
        idx++;
        var result = [];
        while (input[idx] !== ')') {
            if (idx >= input.length) {
                throw new Error('Unexpected end of string');
            }
            var _a = parseElement(input.substr(idx)), element = _a[0], len = _a[1];
            result.push(element);
            idx += len;
        }
        return [result, idx + 1];
    }
    else if (input[idx] === '"') {
        idx++;
        var result = '';
        while (input[idx] !== '"') {
            result += input[idx];
            idx++;
            if (input.substr(idx, 2) === '""') {
                result += '"';
                idx += 2;
            }
        }
        return [result, idx + 1];
    }
    else {
        var result = '';
        while (!__spreadArrays(WHITESPACE, ['(', ')']).includes(input[idx])) {
            if (idx >= input.length) {
                throw new Error('Unexpected end of string');
            }
            result += input[idx];
            idx++;
        }
        var numVal = parseFloat(result);
        if (typeof numVal === 'number' && !isNaN(numVal)) {
            return [numVal, idx];
        }
        else {
            return [result, idx];
        }
    }
}
function parseObject(spectra) {
    spectra = spectra.trim();
    var parsed = parseElement(spectra)[0];
    return parsed;
}
exports.parseObject = parseObject;
//# sourceMappingURL=spectra.js.map