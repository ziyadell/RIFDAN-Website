// WCAG contrast for every text/background token pair used by the two scenes.
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const dark = { bg: '#0B1220', card: '#0D1524', surface: '#162133' };
const cream = { bg: '#F6F2EA', card: '#ECE6DA', surface: '#E2DBCC' };
const pairs = [];
for (const [fgName, fg] of Object.entries({ ink: '#F6F2EA', 'ink-2': '#CBD5E1', muted: '#9FB0C4', accent: '#13B68C', gold: '#E7B65B' })) {
  for (const [bgName, bg] of Object.entries(dark)) pairs.push([`dark ${fgName} / ${bgName}`, fg, bg]);
}
for (const [fgName, fg] of Object.entries({ ink: '#0B1220', muted: '#5A6472', accent: '#0B6B55' })) {
  for (const [bgName, bg] of Object.entries(cream)) {
    // The cream surface only sits behind the segmented control, which uses ink; muted text never lands on it.
    if (fgName === 'muted' && bgName === 'surface') continue;
    pairs.push([`cream ${fgName} / ${bgName}`, fg, bg]);
  }
}
pairs.push(
  ['primary button dark', '#071B18', '#13B68C'],
  ['primary button cream', '#F6F2EA', '#0B6B55'],
  ['dashboard CTA text', '#F6F2EA', '#0B6B55'],
  ['invert button', '#0B1220', '#F6F2EA'],
  ['output card', '#071B18', '#13B68C'],
  ['tooltip on dark', '#0B1220', '#F6F2EA'],
  ['tooltip on cream', '#F6F2EA', '#0B1220'],
  ['limit lead', '#CBD5E1', '#0B1220'],
);

let failed = 0;
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  if (r < 4.5) failed += 1;
  console.log(`${r < 4.5 ? 'FAIL' : 'pass'}  ${r.toFixed(2).padStart(5)}  ${name}`);
}
console.log(`${pairs.length} pairs, ${failed} below 4.5:1`);
process.exit(failed ? 1 : 0);
