#!/usr/bin/env node

import * as fs from 'fs';
import { convertBoardV6 } from './board-v6';
import { convertFootprintV6 } from './footprint-v6';
import { convertLibraryV6 } from './library-v6';
import { convertSchematicV6 } from './schematic-v6';

function createProjectFile(
  projectDirectory: string,
  projectFilename: string,
  filename: string
): void {
  const pro = {
    meta: {
      filename: `${filename}.kicad_pro`,
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
    `Usage: node dist/main.js "ARG"` +
      '\n\tSchematics ARG : <input_dir/input_name.json> [-] (stout OR input_dir/input_name/input_name.kicad_sch) [sheet_number]' +
      '\n\tBoard ARG      : <input_dir/input_name.json> [-] (stout OR input_dir/input_name/input_name.kicad_pcb)' +
      '\n\tLib_symbol ARG : <input_dir/input_name.json> [-] (stout OR input_dir/input_name/input_name.kicad_sym)' +
      '\n\tFootprint ARG  : <input_dir/input_name.json> [-] (stout OR input_dir/EasyEDA.pretty/"footprint".kicad_mod)' +
      '\n\n\tNote: if directory input_dir/input_name exists the file will be added to this directory.'
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
const [match, inputDirectoryName, inputFileName] = inputMatch;
const inputDirName = inputDirectoryName === '' ? './' : inputDirectoryName;
const projectDir = inputDirName + inputFileName;
const projectFileName = projectDir + '/' + inputFileName;
const fpDir = inputDirName + 'EasyEDA.pretty';
const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf-8'));
let outputFileName;
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
  [output, symbols] = convertSchematicV6(input, sheet, inputFileName);
  if (process.argv[3] !== '-') {
    outputFileName = projectFileName + '.kicad_sch';
    symbolFileName = projectFileName + '.kicad_sym';
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir);
    }
    createProjectFile(projectDir, projectFileName + '.kicad_pro', inputFileName);
  }
  // schematic collection
} else if (doctype === '5') {
  process.argv[3] === '-' ? (last = 4) : (last = 3);
  if (process.argv.length === last + 1) {
    sheet = parseInt(process.argv[last], 10);
    sheet = isNaN(sheet) ? 1 : sheet;
  }
  console.info(
    `Converting EasyEDA schematic ${process.argv[2]} sheet ${sheet} to Kicad V6 schematic`
  );
  [output, symbols] = convertSchematicV6(input, sheet, inputFileName);
  if (process.argv[3] !== '-') {
    outputFileName = projectFileName + '.kicad_sch';
    symbolFileName = projectFileName + '.kicad_sym';
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir);
    }
    createProjectFile(projectDir, projectFileName + '.kicad_pro', inputFileName);
  }
  // schematic symbol
} else if (doctype === '2') {
  console.info(`Converting EasyEDA library ${process.argv[2]} to Kicad V6 library`);
  output = convertLibraryV6(input, inputFileName);
  if (process.argv[3] !== '-') {
    outputFileName = projectFileName + '.kicad_sym';
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir);
    }
  }
} else if (doctype === '4') {
  // footprint
  console.info(`Converting EasyEDA footprint ${process.argv[2]} to Kicad footprint`);
  [name, output] = convertFootprintV6(input).split('#@$');
  if (process.argv[3] !== '-') {
    outputFileName = fpDir + '/' + name;
    if (!fs.existsSync(fpDir)) {
      fs.mkdirSync(fpDir);
    }
  }
} else if (doctype === '3') {
  // board
  console.info(`Converting EasyEDA board ${process.argv[2]} to Kicad V6 board`);
  output = convertBoardV6(input);
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
} else {
  console.warn(`warning: input file ${process.argv[2]} is not a valid EasyEDA configuration file.`);
  process.exit(1);
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
