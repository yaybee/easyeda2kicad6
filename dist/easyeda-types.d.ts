export interface IEasyEDASchematicCollection {
    schematics: Array<{
        dataStr: string;
    }>;
}
export interface IEasyEDASchematic {
    head: Head;
    canvas: string;
    shape: string[];
    BBox: BBox;
    colors: {};
}
export interface IEasyEDABoard {
    head: Head;
    canvas: string;
    shape: string[];
    systemColor?: string;
    layers: string[];
    objects: string[];
    BBox: BBox;
    preference: Preference;
    DRCRULE: Drcrule;
    routerRule?: RouterRule;
    netColors: {};
}
export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface Drcrule {
    Default: Default;
    isRealtime: boolean;
    checkObjectToCopperarea: boolean;
    showDRCRangeLine: boolean;
}
export interface Default {
    trackWidth: number;
    clearance: number;
    viaHoleDiameter: number;
    viaHoleD: number;
}
export interface Head {
    docType: string;
    editorVersion: string;
    c_para: {};
    hasIdFlag: boolean;
    x: string;
    y: string;
    importFlag: number;
    transformList: string;
}
export interface Preference {
    hideFootprints: string;
    hideNets: string;
}
export interface RouterRule {
    unit: string;
    trackWidth: number;
    trackClearance: number;
    viaHoleD: number;
    viaDiameter: number;
    routerLayers: number[];
    smdClearance: number;
    specialNets: any[];
    nets: string[];
    padsCount: number;
    skipNets: any[];
    realtime: boolean;
}
export interface IEasyEDAFootprint {
    head: FootprintHead;
    canvas?: string;
    shape: string[];
    layers?: string[];
    objects?: string[];
    BBox?: BBox;
    netcolors?: {};
}
export interface FootprintHead {
    docType: string;
    editorVersion?: string;
    x: string;
    y: string;
    c_para: {
        pre: string;
        package: string;
        link: string;
        Contributor: string;
        ['3DModel']: string;
        [key: string]: string;
    };
    uuid?: string;
    utime?: number;
    importFlag?: string;
    transformlist?: any;
    hasIdFlag?: boolean;
    newgId?: boolean;
    rotation?: string;
}
export interface IEasyEDASchematicCollectionV6 {
    editorVersion: string;
    docType: string;
    title: string;
    description: string;
    colors: {};
    schematics: Array<{
        docType: string;
        title: string;
        description: string;
        dataStr: IEasyEDASchematic;
    }>;
}
export interface IEasyEDALibrary {
    head: LibraryHead;
    canvas?: string;
    shape: string[];
    BBox?: BBox;
    colors?: {};
}
export interface LibraryHead {
    docType: string;
    editorVersion: string;
    x: number;
    y: number;
    c_para: {
        pre: string;
        name: string;
        package: string;
        BOM_Supplier: string;
        ['BOM_Supplier Part']: string;
        BOM_Manufacturer: string;
        ['BOM_Manufacturer Part']: string;
        Contributor: string;
        [key: string]: string;
    };
    uuid?: string;
    puuid?: string;
    importFlag?: number;
    c_spiceCmd?: any;
    hasIdFlag?: boolean;
    utime?: number;
}
export interface ISvgNode {
    gId: string;
    nodeName: string;
    nodeType: string;
    layerid: string;
    attrs: SvgAttrs;
}
export interface SvgAttrs {
    d: string;
    id: string;
    stroke: string;
    layerid: string;
    display?: string;
}
