/// <reference types="vite/client" />
declare module '*.html?raw' { const html: string; export default html; }
interface Window { vonkjeStop?: () => void }
