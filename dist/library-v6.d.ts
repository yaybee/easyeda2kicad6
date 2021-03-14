import { IEasyEDALibrary } from './easyeda-types';
import { IConversionState } from './schematic-v6';
import { ISpectraList } from './spectra';
interface ICoordinates {
    x: number;
    y: number;
    id?: string;
}
export interface IProperties {
    ref: string;
    value: string;
    pre: string;
    lib: string;
    rotation: number;
    package: string;
    component: ISpectraList;
    pinNameShowCount: number;
    pinNameHideCount: number;
    pinNumberShowCount: number;
    pinNumberHideCount: number;
}
export declare function convertPin(args: string[], parentCoords: ICoordinates, symbolProp: IProperties, conversionState: IConversionState): ISpectraList;
export declare function convertText(args: string[], parentCoords: ICoordinates): ISpectraList | null;
export declare function convertLibrary(schematicsLIB: string | null, library: IEasyEDALibrary | null, conversionState: IConversionState, CRCTable: number[], inputFileName: string): ISpectraList;
export declare function convertLibraryV6(library: IEasyEDALibrary, inputFileName: string): string;
export {};
