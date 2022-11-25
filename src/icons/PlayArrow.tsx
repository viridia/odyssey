import { JSX } from 'solid-js';
const SvgPlayArrow = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={24} width={24} viewBox="0 0 24 24" {...props}>
    <path fill="var(--icon-color)" d="M8 19V5l11 7Z" />
  </svg>
);
export default SvgPlayArrow;
