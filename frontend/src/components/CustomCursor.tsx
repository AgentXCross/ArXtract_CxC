import { useEffect } from "react";

const CURSOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28">
  <path d="M2 1L2 23L7.5 17.5L12 26L16 24.5L11.5 16H19L2 1Z"
        fill="%23ff1493"
        stroke="%23ff1493"
        stroke-width="1.5"
        stroke-linejoin="round"/>
</svg>
`.trim();

export default function CustomCursor() {
  useEffect(() => {
    const style = document.createElement("style");
    const dataUri = `url("data:image/svg+xml,${encodeURIComponent(CURSOR_SVG.replace(/%23/g, '#'))}") 2 1, auto`;
    style.textContent = `*, *::before, *::after { cursor: ${dataUri} !important; }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return null;
}
