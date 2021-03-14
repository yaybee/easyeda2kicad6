#!/usr/bin/env node
"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var board_v6_1 = require("./board-v6");
var footprint_v6_1 = require("./footprint-v6");
var library_v6_1 = require("./library-v6");
var schematic_v6_1 = require("./schematic-v6");
function createProjectFile(projectDirectory, projectFilename, filename) {
    var pro = {
        meta: {
            filename: filename + ".kicad_pro",
            version: 1,
        },
    };
    if (!fs.existsSync(projectDirectory)) {
        fs.mkdirSync(projectDirectory);
    }
    if (!fs.existsSync(projectFilename)) {
        fs.writeFileSync(projectFilename, JSON.stringify(pro));
    }
    return;
}
if (process.argv.length < 3) {
    console.error(
    // `Usage: ${process.argv[1]} "ARG"` +
    "Usage: node dist/main.js \"ARG\"" +
        '\n\tSchematics ARG : <input_dir/input_name.json> [-] (stout OR input_dir/input_name/input_name.kicad_sch) [sheet_number]' +
        '\n\tBoard ARG      : <input_dir/input_name.json> [-] (stout OR input_dir/input_name/input_name.kicad_pcb)' +
        '\n\tLib_symbol ARG : <input_dir/input_name.json> [-] (stout OR input_dir/input_name/input_name.kicad_sym)' +
        '\n\tFootprint ARG  : <input_dir/input_name.json> [-] (stout OR input_dir/EasyEDA.pretty/"footprint".kicad_mod)' +
        '\n\n\tNote: if directory input_dir/input_name exists the file will be added to this directory.');
    process.exit(1);
}
if (process.argv[2] === '-v') {
    // tslint:disable-next-line
    console.log("Version " + require('../package.json').version);
    process.exit(0);
}
if (!fs.existsSync(process.argv[2])) {
    console.error("Input file " + process.argv[2] + " does not exist.");
    process.exit(1);
}
var inputMatch = /^(.*[\\\/]|)(.*).json$/gi.exec(process.argv[2]);
if (!inputMatch) {
    console.error("Input file " + process.argv[2] + " is not a .json file.");
    process.exit(1);
}
var match = inputMatch[0], inputDirectoryName = inputMatch[1], inputFileName = inputMatch[2];
var inputDirName = inputDirectoryName === '' ? './' : inputDirectoryName;
var projectDir = inputDirName + inputFileName;
var projectFileName = projectDir + '/' + inputFileName;
var fpDir = inputDirName + 'EasyEDA.pretty';
var input = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
var outputFileName;
var symbolFileName;
var name = '';
var output = '';
var symbols = '';
var doctype = '0';
var sheet = 1;
var last = 2;
if (input.hasOwnProperty('docType')) {
    doctype = input.docType;
}
else if (input.head.hasOwnProperty('docType')) {
    doctype = input.head.docType;
}
if (doctype === '1') {
    // schematic
    console.info("Converting EasyEDA schematic " + process.argv[2] + " to Kicad V6 schematic");
    _a = schematic_v6_1.convertSchematicV6(input, sheet, inputFileName), output = _a[0], symbols = _a[1];
    if (process.argv[3] !== '-') {
        outputFileName = projectFileName + '.kicad_sch';
        symbolFileName = projectFileName + '.kicad_sym';
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir);
        }
        createProjectFile(projectDir, projectFileName + '.kicad_pro', inputFileName);
    }
    // schematic collection
}
else if (doctype === '5') {
    process.argv[3] === '-' ? (last = 4) : (last = 3);
    if (process.argv.length === last + 1) {
        sheet = parseInt(process.argv[last], 10);
        sheet = isNaN(sheet) ? 1 : sheet;
    }
    console.info("Converting EasyEDA schematic " + process.argv[2] + " sheet " + sheet + " to Kicad V6 schematic");
    _b = schematic_v6_1.convertSchematicV6(input, sheet, inputFileName), output = _b[0], symbols = _b[1];
    if (process.argv[3] !== '-') {
        outputFileName = projectFileName + '.kicad_sch';
        symbolFileName = projectFileName + '.kicad_sym';
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir);
        }
        createProjectFile(projectDir, projectFileName + '.kicad_pro', inputFileName);
    }
    // schematic symbol
}
else if (doctype === '2') {
    console.info("Converting EasyEDA library " + process.argv[2] + " to Kicad V6 library");
    output = library_v6_1.convertLibraryV6(input, inputFileName);
    if (process.argv[3] !== '-') {
        outputFileName = projectFileName + '.kicad_sym';
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir);
        }
    }
}
else if (doctype === '4') {
    // footprint
    console.info("Converting EasyEDA footprint " + process.argv[2] + " to Kicad footprint");
    _c = footprint_v6_1.convertFootprintV6(input).split('#@$'), name = _c[0], output = _c[1];
    if (process.argv[3] !== '-') {
        outputFileName = fpDir + '/' + name;
        if (!fs.existsSync(fpDir)) {
            fs.mkdirSync(fpDir);
        }
    }
}
else if (doctype === '3') {
    // board
    console.info("Converting EasyEDA board " + process.argv[2] + " to Kicad V6 board");
    output = board_v6_1.convertBoardV6(input);
    outputFileName = inputDirName + inputFileName + '.kicad_pcb';
    if (process.argv[3] !== '-') {
        outputFileName = projectFileName + '.kicad_pcb';
        if (!fs.existsSync(fpDir)) {
            fs.mkdirSync(fpDir);
        }
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir);
        }
        createProjectFile(projectDir, projectFileName + '.kicad_pro', inputFileName);
    }
}
else {
    console.warn("warning: input file " + process.argv[2] + " is not a valid EasyEDA configuration file.");
    process.exit(1);
}
if (symbolFileName) {
    fs.writeFileSync(symbolFileName, symbols);
}
if (outputFileName && process.argv[3] !== '-') {
    fs.writeFileSync(outputFileName, output);
    console.info("Successful converted to output file: " + outputFileName);
}
else {
    process.stdout.write(output);
}
//# sourceMappingURL=main.js.map