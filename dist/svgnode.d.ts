import { IConversionState } from './board-v6';
interface ISvgPath {
    cmd: string;
    numbrs: number[];
}
export declare function parseSvgPath(path: string, conversionState: IConversionState, layerName: string): ISvgPath[] | null;
export declare function svgToPoly(paths: ISvgPath[], resolution: number, // relative size of segments
o: number[], // global origin coords
s: number): (string | number)[][][];
export {};
