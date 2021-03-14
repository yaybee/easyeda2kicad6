import { IConversionState } from './board-v6';
import { IEasyEDAFootprint } from './easyeda-types';
import { ISpectraList } from './spectra';
export declare function convertFp(boardLIB: string, conversionState: IConversionState, isBoard?: boolean, footprint?: IEasyEDAFootprint): ISpectraList;
export declare function convertFootprintV6(footprint: IEasyEDAFootprint): string;
