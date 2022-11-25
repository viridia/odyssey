import { JSX } from 'solid-js';
const SvgPause = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={24} width={24} viewBox="0 0 24 24" {...props}>
    <path fill="var(--icon-color)" d="M13 19V5h6v14Zm-8 0V5h6v14Z" />
  </svg>
);
export default SvgPause;
