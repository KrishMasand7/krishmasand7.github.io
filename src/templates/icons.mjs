const svg = (d, extra = '') =>
  `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

export const icons = {
  arrow: svg('<path d="M3 8h10M9 4l4 4-4 4"/>', ' class="arr"'),
  arrowDown: svg('<path d="M8 3v10M4 9l4 4 4-4"/>'),
  external: svg('<path d="M6 3h7v7"/><path d="M13 3 6.5 9.5"/><path d="M11 10.5V13H3V5h2.5"/>'),
  plus: svg('<path d="M8 3.5v9M3.5 8h9"/>'),
  copy: svg('<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 3.5H3.5a1 1 0 0 0-1 1v7"/>'),
  github: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.34c-2.22.48-2.69-1.07-2.69-1.07-.36-.93-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.23 1.87.87 2.33.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.19c0 .21.14.46.55.38A8 8 0 0 0 8 0Z"/></svg>`,
  linkedin: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M3.4 1.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM1.9 6.3h3V14.4h-3V6.3Zm5 0h2.87v1.11h.04c.4-.72 1.38-1.48 2.83-1.48 3.03 0 3.59 1.9 3.59 4.38v4.09h-3v-3.63c0-.86-.02-1.98-1.26-1.98-1.26 0-1.45.93-1.45 1.91v3.7h-3V6.3Z"/></svg>`,
  scholar: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M8 1 0 5.6l8 4.6 8-4.6L8 1Z"/><path d="M3.4 8.3v3.1c0 1.4 2.06 2.5 4.6 2.5s4.6-1.1 4.6-2.5V8.3L8 11 3.4 8.3Z"/></svg>`,
  mail: svg('<rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/>'),
  close: svg('<path d="M4 4l8 8M12 4l-8 8"/>'),
  /* Both theme glyphs ship in the button; CSS shows whichever the active
     palette does not currently apply, so the icon reads as the action. */
  sun: svg('<circle cx="8" cy="8" r="3.1"/><path d="M8 1.4v1.5M8 13.1v1.5M14.6 8h-1.5M2.9 8H1.4M12.67 3.33l-1.06 1.06M4.39 11.61l-1.06 1.06M12.67 12.67l-1.06-1.06M4.39 4.39 3.33 3.33"/>', ' class="i-sun"'),
  moon: svg('<path d="M13.4 9.42A5.7 5.7 0 0 1 6.58 2.6a5.75 5.75 0 1 0 6.82 6.82Z"/>', ' class="i-moon"'),
};
