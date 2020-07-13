import TextMetricsOptions from './options';

export default interface TextMetricsArguments {
  text: string;
  options: TextMetricsOptions;
  overwrites: TextMetricsOptions;
  styles: CSSStyleDeclaration;
}
