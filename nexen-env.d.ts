// Ambient declarations for the assets this app imports for their side effects.
//
// `import './globals.css'` carries no types. TypeScript 5 lets that pass;
// TypeScript 6 rejects it unless the module is declared, and the import lives
// in a file this generator owns.
declare module '*.css';
declare module '*.scss';
