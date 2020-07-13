/* eslint-env es6, browser */
import * as _ from './utils';

import TextMetricsOptions from './definitions/options';
import TextMetricsArguments from './definitions/text-metrics-arguments';

class TextMetrics {
  public el: HTMLElement;
  public overwrites: TextMetricsOptions;
  public style: CSSStyleDeclaration;
  public font: string;

  constructor(element: HTMLElement | TextMetricsOptions, overwrites: TextMetricsOptions = {}) {
    if (element instanceof HTMLElement) {
      this.el = element;
      this.overwrites = _.normalizeOptions(overwrites);
    } else {
      this.el = undefined;
      this.overwrites = _.normalizeOptions(element);
    }

    this.style = _.getStyle(this.el, this.overwrites);
    this.font = _.prop(overwrites, 'font', null) || _.getFont(this.style, this.overwrites);
  }

  padding(): number {
    return this.el
      ? Number.parseInt(this.style.paddingLeft || '0', 10) + Number.parseInt(this.style.paddingRight || '0', 10)
      : 0;
  }

  parseArgs(text: string, options: TextMetricsOptions = {}, overwrites: TextMetricsOptions = {}): TextMetricsArguments {
    if (typeof text === 'object' && text) {
      overwrites = options;
      options = text || {};
      text = undefined;
    }

    const styles = new CSSStyleDeclaration();
    Object.assign(styles, {...this.overwrites, ..._.normalizeOptions(overwrites)});

    const ws = _.prop(styles, 'white-space') || this.style.getPropertyValue('white-space');

    if (!options) {
      options = {};
    }

    if (!overwrites) {
      options = {};
    }

    if (!text && this.el) {
      text = _.normalizeWhitespace(_.getText(this.el), ws);
    } else {
      text = _.prepareText(_.normalizeWhitespace(text));
    }

    return {text, options, overwrites, styles};
  }

  /**
   * Compute Text Metrics based for given text
   */
  width(text: string, options: TextMetricsOptions, overwrites: TextMetricsOptions): number {
    const parsed = this.parseArgs(text, options, overwrites);

    if (!parsed.text) {
      return 0;
    }

    const font = _.getFont(this.style, parsed.styles);

    const letterSpacing = _.prop(parsed.styles, 'letter-spacing') || this.style.getPropertyValue('letter-spacing');
    const wordSpacing = _.prop(parsed.styles, 'word-spacing') || this.style.getPropertyValue('word-spacing');
    const addSpacing = _.addWordAndLetterSpacing(wordSpacing, letterSpacing);
    const ctx = _.getContext2d(font);

    const styledText = _.getStyledText(parsed.text, this.style);

    if (parsed.options.multiline) {
      return this.lines(styledText, parsed.options, parsed.overwrites).reduce((previousValue, currentValue) => {
        const w = ctx.measureText(currentValue).width + addSpacing(currentValue);

        return Math.max(previousValue, w);
      }, 0);
    }

    return ctx.measureText(styledText).width + addSpacing(styledText);
  }

  /**
   * Compute height from textbox
   */
  height(text: string, options: TextMetricsOptions, overwrites: TextMetricsOptions): number {
    const parsed = this.parseArgs(text, options, overwrites);

    const lineHeight = Number.parseFloat(
      _.prop(parsed.styles, 'line-height') || this.style.getPropertyValue('line-height')
    );

    return Math.ceil(this.lines(parsed.text, parsed.options, parsed.styles).length * lineHeight || 0);
  }

  /**
   * Compute lines of text with automatic word wraparound
   * element styles
   */
  lines(text: string, options: TextMetricsOptions, overwrites: TextMetricsOptions): string[] {
    const parsed = this.parseArgs(text, options, overwrites);

    const font = _.getFont(this.style, parsed.styles);

    // Get max width
    let max =
      Number.parseInt(_.prop(parsed.options, 'width') || _.prop(parsed.overwrites, 'width'), 10) ||
      _.prop(this.el, 'offsetWidth', 0) ||
      Number.parseInt(_.prop(parsed.styles, 'width', 0), 10) ||
      Number.parseInt(this.style.width, 10);

    max -= this.padding();

    const wordBreak = _.prop(parsed.styles, 'word-break') || this.style.getPropertyValue('word-break');
    const letterSpacing = _.prop(parsed.styles, 'letter-spacing') || this.style.getPropertyValue('letter-spacing');
    const wordSpacing = _.prop(parsed.styles, 'word-spacing') || this.style.getPropertyValue('word-spacing');
    const ctx = _.getContext2d(font);
    const styledText = _.getStyledText(parsed.text, this.style);

    // Different scenario when break-word is allowed
    if (wordBreak === 'break-all') {
      return _.computeLinesBreakAll({
        ctx,
        text: styledText,
        max,
        wordSpacing,
        letterSpacing,
      });
    }

    return _.computeLinesDefault({
      ctx,
      text: styledText,
      max,
      wordSpacing,
      letterSpacing,
    });
  }

  /**
   * Compute Text Metrics based for given text
   *
   * @returns {string} Pixelvalue e.g. 14px
   */
  maxFontSize(text: string, options: TextMetricsOptions, overwrites: TextMetricsOptions): string {
    const parsed = this.parseArgs(text, options, overwrites);

    // Simple compute function which adds the size and computes the with
    const compute = (size: number): number => {
      return Math.ceil(
        this.width(parsed.text, parsed.options, {
          ...parsed.styles,
          'font-size': size.toString() + 'px',
        } as TextMetricsOptions)
      );
    };

    // Get max width
    let max =
      Number.parseInt(_.prop(parsed.options, 'width') || _.prop(parsed.overwrites, 'width'), 10) ||
      _.prop(this.el, 'offsetWidth', 0) ||
      Number.parseInt(_.prop(parsed.styles, 'width', 0), 10) ||
      Number.parseInt(this.style.width, 10);

    max -= this.padding();

    // Start with half the max size
    let size = Math.floor(max / 2);
    let cur = compute(size);

    // Compute next result based on first result
    size = Math.floor((size / cur) * max);
    cur = compute(size);

    // Happy cause we got it already
    if (Math.ceil(cur) === max) {
      return size ? size.toString() + 'px' : undefined;
    }

    // Go on by increase/decrease pixels
    const greater = cur > max && size > 0;
    while (cur > max && size > 0) {
      size -= 1;
      cur = compute(size);
    }

    if (!greater) {
      while (cur < max) {
        cur = compute(size + 1);
        if (cur > max) {
          return size ? size.toString() + 'px' : undefined;
        }

        size += 1;
      }
    }

    return size ? size.toString() + 'px' : undefined;
  }
}

export const init = (element: HTMLElement | TextMetricsOptions, overwrites: TextMetricsOptions) =>
  new TextMetrics(element, overwrites);

export const utils = {..._};
