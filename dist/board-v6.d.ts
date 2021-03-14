import { IEasyEDABoard } from './easyeda-types';
import { ISpectraList } from './spectra';
export interface IConversionState {
    nets: string[];
    innerLayers: number;
    fpValue: string;
    msgRepCnt: number;
    msgReports: ISpectraList;
    msgReportsPosition: number;
    pcbCuZoneCount: number;
    pcbKeepoutZoneCount: number;
    convertingFpFile?: boolean;
}
export declare function getLayerName(id: string, conversionState: IConversionState): string;
interface ICoordinates {
    x: number;
    y: number;
}
export interface IParentTransform extends ICoordinates {
    angle: number | null;
    fpId?: string;
    isFootprintFile?: boolean;
}
export declare function kiUnits(value: string | number, round?: boolean): number;
export declare function kiAngle(value?: string, parentAngle?: number): number | null;
export declare function kiCoords(x: string, y: string, transform?: IParentTransform): ICoordinates;
export declare function kiAt(x: string, y: string, angle?: string, transform?: IParentTransform): ISpectraList;
export declare function reportError(msg: string, conversionState: IConversionState, multiLine?: number): ISpectraList;
export declare function getNetId({ nets }: IConversionState, netName: string): number;
export declare function convertVia(args: string[], conversionState: IConversionState, parentCoords?: IParentTransform): ISpectraList;
export declare function convertTrack(args: string[], conversionState: IConversionState, objName?: string, parentCoords?: IParentTransform): ISpectraList;
export declare function convertText(args: string[], conversionState: IConversionState, objName?: string, parentCoords?: IParentTransform): ISpectraList;
export declare function convertArc(args: string[], conversionState: IConversionState, objName?: string, transform?: IParentTransform): ISpectraList;
export declare function convertPad(args: string[], conversionState: IConversionState, transform: IParentTransform, padOnBoard?: boolean): ISpectraList;
export declare function convertBoardPad(args: string[], conversionState: IConversionState): ISpectraList;
export declare function convertCircle(args: string[], conversionState: IConversionState, objName?: string, parentCoords?: IParentTransform): ISpectraList;
export declare function convertRect(args: string[], conversionState: IConversionState, objName?: string, parentCoords?: IParentTransform): ISpectraList;
export declare function convertPolygon(args: string[], conversionState: IConversionState, parentCoords?: IParentTransform): ISpectraList;
export declare function convertCopperArea(args: string[], conversionState: IConversionState): ISpectraList;
export declare function convertSolidRegion(args: string[], conversionState: IConversionState): ISpectraList;
export declare function convertHole(args: string[]): ISpectraList;
export declare function convertBoardToArray(board: IEasyEDABoard): ISpectraList;
export declare function convertBoardV6(board: IEasyEDABoard): string;
export {};
