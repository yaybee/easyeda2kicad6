import { IEasyEDASchematicCollectionV6 } from './easyeda-types';
import { ISpectraList } from './spectra';
interface INetflags {
    $GND1: boolean;
    $GND2: boolean;
    $GND3: boolean;
    $EARTH: boolean;
    $Vplus: boolean;
    $Vminus: boolean;
}
export interface IConversionState {
    libTypes: {
        [key: number]: string;
    };
    savedLibs: ISpectraList;
    savedLibMsgs: string[];
    schRepCnt: number;
    schReports: ISpectraList;
    schReportsPosition: number;
    convertingSymFile?: boolean;
}
export declare function kiUnits(value: string | number): number;
export declare function reportError(msgSch: string, conversionState: IConversionState, multiLine?: number): ISpectraList;
export declare function pointListToPolygon(points: string[], closed?: boolean): ISpectraList;
export declare function convertPolyline(args: string[]): ISpectraList;
export declare function convertText(args: string[]): ISpectraList;
export declare function convertNoConnect(args: string[]): ISpectraList;
export declare function convertJunction(args: string[]): ISpectraList;
export declare function convertWire(args: string[]): ISpectraList;
export declare function convertNetlabel(args: string[]): ISpectraList;
export declare function convertNetPort(args: string[]): ISpectraList;
export declare function convertNetflag(args: string[], nfSymbolPresent: INetflags, conversionState: IConversionState, inputFileName: string): ((string | (string | any[])[])[] | null)[] | null;
export declare function convertBus(args: string[]): ISpectraList;
export declare function convertBusEntry(args: string[]): ISpectraList;
export declare function convertSchematicV6(input: IEasyEDASchematicCollectionV6, sheet: number, inputFileName: string): string[];
export {};
