#!/usr/bin/env node

import * as fs from 'fs';
import { convertBoardV6 } from './board-v6';
import { convertFootprintV6 } from './footprint-v6';
import { convertLibraryV6 } from './library-v6';
import { convertSchematicV6 } from './schematic-v6';

if (process.argv.length < 3) {
  console.error(
    `Usage: ${process.argv[1]} "ARG"` +
      '\n\tSchematics ARG : <input.json> [-] (stout else auto-generated: "input name".kicad_sch) [schematic_sheet_number]' +
      '\n\tBoard ARG      : <input.json> [-] (stout else auto-generated: "input name".kicad_pcb)' +
      '\n\tLib_symbol ARG : <input.json> [-] (stout else auto-generated: EasyEDA.kicad_sym)' +
      '\n\tFootprint ARG  : <input.json> [-] (stout else auto-generated: "footprint".kicad_mod)'
  );
  process.exit(1);
}

if (process.argv[2] === '-v') {
  // tslint:disable-next-line
  console.log(`Version ${require('../package.json').version}`);
  process.exit(0);
}
if (!fs.existsSync(process.argv[2])) {
  console.error(`Input file ${process.argv[2]} does not exist.`);
  process.exit(1);
}
const inputMatch = /^(.*[\\\/]|)(.*).json$/gi.exec(process.argv[2]);
if (!inputMatch) {
  console.error(`Input file ${process.argv[2]} is not a .json file.`);
  process.exit(1);
}
const [match, inputDirName, inputFileName] = inputMatch;
const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
let outputFileName = 'unknown';
let symbolFileName;
let name = '';
let output = '';
let symbols = '';
let doctype = '0';
let sheet = 1;
let last = 2;
if (input.hasOwnProperty('docType')) {
  doctype = input.docType;
} else if (input.head.hasOwnProperty('docType')) {
  doctype = input.head.docType;
}
if (doctype === '1') {
  // schematic
  console.info(`Converting EasyEDA schematic ${process.argv[2]} to Kicad V6 schematic`);
  outputFileName = inputDirName + inputFileName + '.kicad_sch';
  symbolFileName = inputDirName + 'EasyEDA.kicad_sym';
  [output, symbols] = convertSchematicV6(input, sheet);
} else if (doctype === '5') {
  process.argv[3] === '-' ? (last = 4) : (last = 3);
  if (process.argv.length === last + 1) {
    sheet = parseInt(process.argv[last], 10);
    isNaN(sheet) ? (sheet = 1) : (sheet = sheet);
  }
  console.info(
    `Converting EasyEDA schematic ${process.argv[2]} sheet ${sheet} to Kicad V6 schematic`
  );
  outputFileName = inputDirName + inputFileName + '.kicad_sch';
  symbolFileName = inputDirName + 'EasyEDA.kicad_sym';
  [output, symbols] = convertSchematicV6(input, sheet);
  // schematic symbol
} else if (doctype === '2') {
  console.info(`Converting EasyEDA library ${process.argv[2]} to Kicad V6 library`);
  outputFileName = inputDirName + 'EasyEDA.kicad_sym';
  output = convertLibraryV6(input);
} else if (doctype === '4') {
  // footprint
  console.info(`Converting EasyEDA footprint ${process.argv[2]} to Kicad footprint`);
  [name, output] = convertFootprintV6(input).split('#@$');
  if (process.argv[3] !== '-') {
    const dir = './EasyEDA.pretty';
    outputFileName = dir + '/' + inputDirName + name;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  }
} else if (doctype === '3') {
  // board
  console.info(`Converting EasyEDA board ${process.argv[2]} to Kicad V6 board`);
  output = convertBoardV6(input);
  outputFileName = inputDirName + inputFileName + '.kicad_pcb';
} else {
  console.warn(`warning: input file ${process.argv[2]} is not a valid EasyEDA configuration file.`);
}
if (symbolFileName) {
  fs.writeFileSync(symbolFileName, symbols);
}
if (outputFileName && process.argv[3] !== '-') {
  fs.writeFileSync(outputFileName, output);
  console.info(`Successful converted to output file: ${outputFileName}`);
} else {
  process.stdout.write(output);
}
