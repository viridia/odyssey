import { JSX } from 'solid-js';
const SvgMainMenu = (props: JSX.SvgSVGAttributes<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" height={24} width={24} viewBox="0 0 24 24" {...props}>
    <path fill="var(--icon-color)" d="M3 18v-2h18v2Zm0-5v-2h18v2Zm0-5V6h18v2Z" />
  </svg>
);
export default SvgMainMenu;
