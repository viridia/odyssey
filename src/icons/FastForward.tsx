import { JSX } from 'solid-js';
const SvgFastForward = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={24} width={24} viewBox="0 0 24 24" {...props}>
    <path fill="var(--icon-color)" d="M2.5 18V6l9 6Zm10 0V6l9 6Z" />
  </svg>
);
export default SvgFastForward;
