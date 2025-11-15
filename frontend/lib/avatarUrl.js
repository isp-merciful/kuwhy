export const DEFAULT_STYLE = "thumbs"; 

export function dicebearUrl(seed, size = 150, style = DEFAULT_STYLE) {
  const p = new URLSearchParams({
    seed,
    size: String(size),
    radius: "50",
    backgroundType: "gradientLinear",
  });
  return `https://api.dicebear.com/9.x/${style}/png?${p.toString()}`;
}

export function hashToIndex(s, mod) {
  if (!s) return 0;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

export function dicebearUrlFromStyles(seed, size = 150, styles = ["adventurer","thumbs"]) {
  const list = Array.isArray(styles) && styles.length ? styles : [DEFAULT_STYLE];
  const pick = list[hashToIndex(seed, list.length)];
  return dicebearUrl(seed, size, pick);
}