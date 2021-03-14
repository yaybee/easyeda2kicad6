import { IConversionState, reportError } from './board-v6';

interface ISvgPath {
  cmd: string;
  numbrs: number[];
}

export function parseSvgPath(
  path: string,
  conversionState: IConversionState,
  layerName: string
): ISvgPath[] | null {
  const paths: ISvgPath[] = [];
  let svg: RegExpExecArray | null;
  // do we have path commands unsupported by svgToPoly?
  const regex1 = /[aAsStTvVzZhHmlcq]/g;
  if (regex1.test(path)) {
    const msg1 = `Warning : unsupported SVGNODE found on layer ${layerName}; svgnode ignored`;
    reportError(msg1, conversionState);
    return null;
  }
  const regex2 = /([MLCQ])([^MLCQ]*)/g;
  // tslint:disable-next-line
  while ((svg = regex2.exec(path)) !== null) {
    const checkedPath = check(svg[1], svg[2]);
    if (checkedPath === null) {
      return null;
    } else {
      paths.push(...checkedPath);
    }
  }
  // do we have multiple polylines at the end?
  const count = (str: string) => {
    return ((str || '').match(/M/g) || []).length;
  };
  const polycnt = count(path);
  if (polycnt > 1) {
    const msg2 =
      `Info : SVGNODE on layer ${layerName} has been converted into ${polycnt} polylines.` +
      '\\nSvg cutouts are not supported and result in overlapping filled polylines.' +
      '\\nNot OK? -> You can change the fill of some polylines to change the image.';
    reportError(msg2, conversionState, 3);
  }
  return paths;

  function parseValues(args: string): number[] {
    const regex = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi;
    const numbers = args.match(regex);
    return numbers ? numbers.map((numbr) => parseFloat(numbr)) : [];
  }
  function check(command: string, args: string): ISvgPath[] | null {
    const length: { [key: string]: number } = {
      a: 7,
      c: 6,
      h: 1,
      l: 2,
      m: 2,
      q: 4,
      s: 4,
      t: 2,
      v: 1,
      z: 0,
    };
    const data: ISvgPath[] = [];
    let type = command.toLowerCase();
    const numbers = parseValues(args);
    // overloaded moveTo: insert l/L after first 2 numbers
    if (type === 'm' && numbers.length > 2) {
      data.push({ cmd: command, numbrs: numbers.splice(0, 2) });
      type = 'l';
      command = command === 'm' ? 'l' : 'L';
    }
    while (true) {
      if (numbers.length === length[type]) {
        data.push({ cmd: command, numbrs: numbers });
        return data;
      }
      if (numbers.length < length[type]) {
        const msg2 = `Error : incorrect SVGNODE found on layer ${layerName}; svgnode ignored`;
        reportError(msg2, conversionState);
        return null;
      }
      data.push({ cmd: command, numbrs: numbers.splice(0, length[type]) });
    }
  }
}

export function svgToPoly(
  paths: ISvgPath[],
  resolution: number, // relative size of segments
  o: number[], // global origin coords
  s: number // required scale factor
) {
  const poly: Array<Array<Array<string | number>>> = [];
  let xy: Array<Array<string | number>> = [];
  let curX: number = 0;
  let curY: number = 0;
  for (const path of paths) {
    const cmd = path.cmd;
    const p = path.numbrs;
    if (cmd === 'M') {
      // we have the start of a new polyline
      if (xy.length !== 0) {
        poly.push(xy);
        xy = [];
      }
      xy.push(['xy', normX(p[0], o, s), normY(p[1], o, s)]);
      curX = p[0];
      curY = p[1];
    } else if (cmd === 'C') {
      const len = length(cmd, p, curX, curY);
      const nbrOfXY = Math.ceil(len * resolution);
      for (let j = 0; j < nbrOfXY; j++) {
        const t = j / nbrOfXY;
        const x = xOf_C(p, t, curX);
        const y = yOf_C(p, t, curY);
        xy.push(['xy', normX(x, o, s), normY(y, o, s)]);
      }
      xy.push(['xy', normX(p[4], o, s), normY(p[5], o, s)]);
      curX = p[4];
      curY = p[5];
    } else if (cmd === 'Q') {
      const len = length(cmd, p, curX, curY);
      const nbrOfXY = Math.ceil(len * resolution);
      for (let j = 0; j < nbrOfXY; j++) {
        const t = j / nbrOfXY;
        const x = xOf_Q(p, t, curX);
        const y = yOf_Q(p, t, curY);
        xy.push(['xy', normX(x, o, s), normY(y, o, s)]);
      }
      xy.push(['xy', normX(p[2], o, s), normY(p[3], o, s)]);
      curX = p[2];
      curY = p[3];
    } else if (cmd === 'L') {
      xy.push(['xy', normX(p[0], o, s), normY(p[1], o, s)]);
      curX = p[0];
      curY = p[1];
    }
  }
  poly.push(xy);
  return poly;

  function normX(x: number, origin: number[], scale: number) {
    return (x - origin[0]) * scale;
  }
  function normY(y: number, origin: number[], scale: number) {
    return (y - origin[1]) * scale;
  }
  function xOf_C(p: number[], t: number, startX: number) {
    return (
      Math.pow(1 - t, 3) * startX +
      3 * Math.pow(1 - t, 2) * t * p[0] +
      3 * (1 - t) * Math.pow(t, 2) * p[2] +
      Math.pow(t, 3) * p[4]
    );
  }
  function yOf_C(p: number[], t: number, startY: number) {
    return (
      Math.pow(1 - t, 3) * startY +
      3 * Math.pow(1 - t, 2) * t * p[1] +
      3 * (1 - t) * Math.pow(t, 2) * p[3] +
      Math.pow(t, 3) * p[5]
    );
  }
  function xOf_Q(p: number[], t: number, startX: number) {
    return Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * p[0] + Math.pow(t, 2) * p[2];
  }
  function yOf_Q(p: number[], t: number, startY: number) {
    return Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * p[1] + Math.pow(t, 2) * p[3];
  }
  function dist(ax: number, ay: number, bx: number, by: number) {
    const x = ax - bx;
    const y = ay - by;
    return Math.sqrt(x * x + y * y);
  }
  function length(cmd: string, p: number[], startX: number, startY: number): number {
    let currentX = startX;
    let currentY = startY;
    let len = 0;
    const n = 100;
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      let x = 0;
      let y = 0;
      if (cmd === 'C') {
        x = xOf_C(p, t, startX);
        y = yOf_C(p, t, startY);
      } else {
        x = xOf_Q(p, t, startX);
        y = yOf_Q(p, t, startY);
      }
      len += dist(curX, curY, x, y);
      currentX = x;
      currentY = y;
    }
    return len;
  }
}
