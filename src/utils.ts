/*
 B2	Break Opportunity Before and After	Em dash	Provide a line break opportunity before and after the character
 BA	Break After	Spaces, hyphens	Generally provide a line break opportunity after the character
 BB	Break Before	Punctuation used in dictionaries	Generally provide a line break opportunity before the character
 HY	Hyphen	HYPHEN-MINUS	Provide a line break opportunity after the character, except in numeric context
 CB	Contingent Break Opportunity	Inline objects	Provide a line break opportunity contingent on additional information
**/

import ComputeLinesParams from './definitions/compute-lines-params';
import TextMetricsOptions from './definitions/options';
import Breakpoint from './definitions/breakpoint';

// B2 Break Opportunity Before and After - http://www.unicode.org/reports/tr14/#B2
const B2: Set<string> = new Set(['\u2014']);

const SHY: Set<string> = new Set([
  // Soft hyphen
  '\u00AD',
]);

// BA: Break After (remove on break) - http://www.unicode.org/reports/tr14/#BA
const BAI: Set<string> = new Set([
  // Spaces
  '\u0020',
  '\u1680',
  '\u2000',
  '\u2001',
  '\u2002',
  '\u2003',
  '\u2004',
  '\u2005',
  '\u2006',
  '\u2008',
  '\u2009',
  '\u200A',
  '\u205F',
  '\u3000',
  // Tab
  '\u0009',
  // ZW Zero Width Space - http://www.unicode.org/reports/tr14/#ZW
  '\u200B',
  // Mandatory breaks not interpreted by html
  '\u2028',
  '\u2029',
]);

const BA: Set<string> = new Set([
  // Hyphen
  '\u058A',
  '\u2010',
  '\u2012',
  '\u2013',
  // Visible Word Dividers
  '\u05BE',
  '\u0F0B',
  '\u1361',
  '\u17D8',
  '\u17DA',
  '\u2027',
  '\u007C',
  // Historic Word Separators
  '\u16EB',
  '\u16EC',
  '\u16ED',
  '\u2056',
  '\u2058',
  '\u2059',
  '\u205A',
  '\u205B',
  '\u205D',
  '\u205E',
  '\u2E19',
  '\u2E2A',
  '\u2E2B',
  '\u2E2C',
  '\u2E2D',
  '\u2E30',
  '\u10100',
  '\u10101',
  '\u10102',
  '\u1039F',
  '\u103D0',
  '\u1091F',
  '\u12470',
]);

// BB: Break Before - http://www.unicode.org/reports/tr14/#BB
const BB: Set<string> = new Set(['\u00B4', '\u1FFD']);

// BK: Mandatory Break (A) (Non-tailorable) - http://www.unicode.org/reports/tr14/#BK
const BK: Set<string> = new Set(['\u000A']);

/* eslint-env es6, browser */
const DEFAULTS = {
  'font-size': '16px',
  'font-weight': '400',
  'font-family': 'Helvetica, Arial, sans-serif',
};

/**
 * We only support rem/em/pt conversion
 */
function pxValue(value_: string, options?: TextMetricsOptions): number {
  if (!options) {
    options = {multiline: false};
  }

  const baseFontSize = Number.parseInt(prop(options, 'base-font-size', 16), 10);

  const value = Number.parseFloat(value_);
  const unit = value_.replace(value.toString(), '');
  // eslint-disable-next-line default-case
  switch (unit) {
    case 'rem':
    case 'em':
      return value * baseFontSize;
    case 'pt':
      return value / (96 / 72);
    case 'px':
      return value;
  }

  throw new Error('The unit ' + unit + ' is not supported');
}

/**
 * Get computed word- and letter spacing for text
 */
export function addWordAndLetterSpacing(ws: string, ls: string): (text: string) => number {
  const blacklist = new Set(['inherit', 'initial', 'unset', 'normal']);

  let wordAddon = 0;
  if (ws && !blacklist.has(ws)) {
    wordAddon = pxValue(ws);
  }

  let letterAddon = 0;
  if (ls && !blacklist.has(ls)) {
    letterAddon = pxValue(ls);
  }

  return (text: string): number => {
    const words = text.trim().replace(/\s+/gi, ' ').split(' ').length - 1;
    const chars = text.length;

    return words * wordAddon + chars * letterAddon;
  };
}

/**
 * Map css styles to canvas font property
 *
 * font: font-style font-variant font-weight font-size/line-height font-family;
 * http://www.w3schools.com/tags/canvas_font.asp
 */
export function getFont(style: CSSStyleDeclaration, options: TextMetricsOptions): string {
  const font: string[] = [];

  const fontWeight = prop(options, 'font-weight', style.getPropertyValue('font-weight')) || DEFAULTS['font-weight'];
  if (
    ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'].includes(
      fontWeight.toString()
    )
  ) {
    font.push(fontWeight);
  }

  const fontStyle = prop(options, 'font-style', style.getPropertyValue('font-style'));
  if (['normal', 'italic', 'oblique'].includes(fontStyle)) {
    font.push(fontStyle);
  }

  const fontVariant = prop(options, 'font-variant', style.getPropertyValue('font-variant'));
  if (['normal', 'small-caps'].includes(fontVariant)) {
    font.push(fontVariant);
  }

  const fontSize = prop(options, 'font-size', style.getPropertyValue('font-size')) || DEFAULTS['font-size'];
  const fontSizeValue = pxValue(fontSize);
  font.push(fontSizeValue.toString() + 'px');

  const fontFamily = prop(options, 'font-family', style.getPropertyValue('font-family')) || DEFAULTS['font-family'];
  font.push(fontFamily);

  return font.join(' ');
}

/**
 * Check for CSSStyleDeclaration
 */
export function isCSSStyleDeclaration(value: any): boolean {
  return value && typeof value.getPropertyValue === 'function';
}

/**
 * Check wether we can get computed style
 */
export function canGetComputedStyle(element: HTMLElement): boolean {
  return (
    isElement(element) &&
    element.style &&
    typeof window !== 'undefined' &&
    typeof window.getComputedStyle === 'function'
  );
}

/**
 * Check for DOM element
 */
export function isElement(element: HTMLElement): boolean {
  return typeof HTMLElement === 'object'
    ? element instanceof HTMLElement
    : Boolean(
        element &&
          typeof element === 'object' &&
          element !== null &&
          element.nodeType === 1 &&
          typeof element.nodeName === 'string'
      );
}

/**
 * Check if argument is object
 */
export function isObject(object: any): boolean {
  return typeof object === 'object' && object !== null && !Array.isArray(object);
}

/**
 * Get style declaration if available
 */
export function getStyle(element: HTMLElement, options: TextMetricsOptions): CSSStyleDeclaration {
  const options_ = {...(options || {})};
  const {style} = options_ as HTMLElement;
  if (!options) {
    options = {};
  }

  if (isCSSStyleDeclaration(style)) {
    return style;
  }

  if (canGetComputedStyle(element)) {
    return window.getComputedStyle(element, prop(options, 'pseudoElt', null));
  }

  const result: CSSStyleDeclaration = new CSSStyleDeclaration();
  result.getPropertyValue = (key) => prop(options, key);

  return result;
}

/**
 * Normalize whitespace
 * https://developer.mozilla.org/de/docs/Web/CSS/white-space
 *
 * @param {string} ws whitespace value
 */
export function normalizeWhitespace(text: string, ws?: string): string {
  switch (ws) {
    case 'pre':
      return text;
    case 'pre-wrap':
      return text;
    case 'pre-line':
      return (text || '').replace(/\s+/gm, ' ').trim();
    default:
      return (text || '')
        .replace(/[\r\n]/gm, ' ')
        .replace(/\s+/gm, ' ')
        .trim();
  }
}

/**
 * Get styled text
 */
export function getStyledText(text: string, style: CSSStyleDeclaration): string {
  switch (style.getPropertyValue('text-transform')) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    default:
      return text;
  }
}

/**
 * Trim text and repace some breaking htmlentities for convenience
 * Point user to https://mths.be/he for real htmlentity decode
 */
export function prepareText(text: string): string {
  // Convert to unicode
  text = (text || '')
    .replace(/<wbr>/gi, '\u200B')
    .replace(/<br\s*\/?>/gi, '\u000A')
    .replace(/&shy;/gi, '\u00AD')
    .replace(/&mdash;/gi, '\u2014');

  if (/&#(\d+)(;?)|&#[xX]([a-fA-F\d]+)(;?)|&([\da-zA-Z]+);/g.test(text) && console) {
    console.error(
      'text-metrics: Found encoded htmlenties. You may want to use https://mths.be/he to decode your text first.'
    );
  }

  return text;
}

/**
 * Get textcontent from element
 * Try innerText first
 */
export function getText(element: HTMLElement): string {
  if (!element) {
    return '';
  }

  const text = element.textContent || element.textContent || '';

  return text;
}

/**
 * Get property from src
 */
export function prop(src: any, attr: string, defaultValue?: any): any {
  return (src && typeof src[attr] !== 'undefined' && src[attr]) || defaultValue;
}

/**
 * Normalize options
 */
export function normalizeOptions(options: TextMetricsOptions): TextMetricsOptions {
  const options_ = {};

  // Normalize keys (fontSize => font-size)
  Object.keys(options || {}).forEach((key) => {
    const dashedKey = key.replace(/([A-Z])/g, ($1) => '-' + $1.toLowerCase());
    options_[dashedKey] = options[key];
  });

  return options_;
}

/**
 * Get Canvas
 *
 * @throws {Error}
 */
export function getContext2d(font: string): CanvasRenderingContext2D {
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.font = font;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  } catch (error) {
    const typedError: Error = error;
    throw new Error('Canvas support required\n' + typedError.message);
  }
}

/**
 * Check breaking character
 * http://www.unicode.org/reports/tr14/#Table1
 */
function checkBreak(chr: string): string {
  return (
    (B2.has(chr) && 'B2') ||
    (BAI.has(chr) && 'BAI') ||
    (SHY.has(chr) && 'SHY') ||
    (BA.has(chr) && 'BA') ||
    (BB.has(chr) && 'BB') ||
    (BK.has(chr) && 'BK')
  );
}

export function computeLinesDefault(parameters: ComputeLinesParams): string[] {
  const addSpacing = addWordAndLetterSpacing(parameters.wordSpacing, parameters.letterSpacing);
  const lines: string[] = [];
  const parts: string[] = [];
  const breakpoints: Breakpoint[] = [];
  let line = '';
  let part = '';

  if (!parameters.text) {
    return [];
  }

  // Compute array of breakpoints
  for (const chr of parameters.text) {
    const type = checkBreak(chr);
    if (part === '' && type === 'BAI') {
      continue;
    }

    if (type) {
      breakpoints.push({chr, type});

      parts.push(part);
      part = '';
    } else {
      part += chr;
    }
  }

  if (part) {
    parts.push(part);
  }

  // Loop over text parts and compute the lines
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      line = parts[i];
      continue;
    }

    const part = parts[i];
    if (BAI.has(parts[i - 1]) && BAI.has(parts[i])) {
      continue;
    }

    const breakpoint = breakpoints[i - 1];
    // Special treatment as we only render the soft hyphen if we need to split
    const chr = breakpoint.type === 'SHY' ? '' : breakpoint.chr;
    if (breakpoint.type === 'BK') {
      lines.push(line);
      line = part;
      continue;
    }

    // Measure width
    const rawWidth = parameters.ctx.measureText(line + chr + part).width + addSpacing(line + chr + part);
    const width = Math.round(rawWidth);

    // Still fits in line
    if (width <= parameters.max) {
      line += chr + part;
      continue;
    }

    // Line is to long, we split at the breakpoint
    switch (breakpoint.type) {
      case 'SHY':
        lines.push(line + '-');
        line = part;
        break;
      case 'BA':
        lines.push(line + chr);
        line = part;
        break;
      case 'BAI':
        lines.push(line);
        line = part;
        break;
      case 'BB':
        lines.push(line);
        line = chr + part;
        break;
      case 'B2':
        if (parameters.ctx.measureText(line + chr).width + addSpacing(line + chr) <= parameters.max) {
          lines.push(line + chr);
          line = part;
        } else if (parameters.ctx.measureText(chr + part).width + addSpacing(chr + part) <= parameters.max) {
          lines.push(line);
          line = chr + part;
        } else {
          lines.push(line);
          lines.push(chr);
          line = part;
        }

        break;
      default:
        throw new Error('Undefoined break');
    }
  }

  if (line.split('').length !== 0) {
    lines.push(line);
  }

  return lines;
}

export function computeLinesBreakAll(parameters: ComputeLinesParams): string[] {
  const addSpacing = addWordAndLetterSpacing(parameters.wordSpacing, parameters.letterSpacing);
  const lines: string[] = [];
  let line = '';
  let index = 0;

  if (!parameters.text) {
    return [];
  }

  for (const chr of parameters.text) {
    const type = checkBreak(chr);
    // Mandatory break found (br's converted to \u000A and innerText keeps br's as \u000A
    if (type === 'BK') {
      lines.push(line);
      line = '';
      continue;
    }

    const lineLength = line.length;
    if (BAI.has(chr) && (lineLength === 0 || BAI.has(line[lineLength - 1]))) {
      continue;
    }

    // Measure width
    let rawWidth = parameters.ctx.measureText(line + chr).width + addSpacing(line + chr);
    let width = Math.ceil(rawWidth);

    // Check if we can put char behind the shy
    if (type === 'SHY') {
      const next = parameters.text[index + 1] || '';
      rawWidth = parameters.ctx.measureText(line + chr + next).width + addSpacing(line + chr + next);
      width = Math.ceil(rawWidth);
    }

    // Needs at least one character
    if (width > parameters.max && line.split('').length !== 0) {
      switch (type) {
        case 'SHY':
          lines.push(line + '-');
          line = '';
          break;
        case 'BA':
          lines.push(line + chr);
          line = '';
          break;
        case 'BAI':
          lines.push(line);
          line = '';
          break;
        default:
          lines.push(line);
          line = chr;
          break;
      }
    } else if (chr !== '\u00AD') {
      line += chr;
    }

    index++;
  }

  if (line.split('').length !== 0) {
    lines.push(line);
  }

  return lines;
}
