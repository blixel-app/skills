/** The icon blixel.app shows: Blixel's mark on its black tile. */
export const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="100 100 824 824">
<defs>
<linearGradient id="tile" x1="512" y1="100" x2="512" y2="924" gradientUnits="userSpaceOnUse">
<stop stop-color="#1C1C1E"/><stop offset="1"/>
</linearGradient>
<linearGradient id="mark" x1="512" y1="278" x2="512" y2="746" gradientUnits="userSpaceOnUse">
<stop stop-color="#EDEDED"/><stop offset="1" stop-color="#C3C3C3"/>
</linearGradient>
</defs>
<rect x="100" y="100" width="824" height="824" rx="185.4" fill="url(#tile)"/>
<g fill="none" stroke="url(#mark)" stroke-width="54">
<rect x="323" y="359" width="378" height="306"/>
<path d="M620 278H782V440"/>
<path d="M242 476V746H512"/>
</g>
</svg>`

/** Breaks `text` into lines of at most `width` characters, at spaces where it can. */
export function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      for (let piece = word; piece.length > 0; piece = piece.slice(width)) {
        const part = piece.slice(0, width)
        if (line === '') line = part
        else if (line.length + 1 + part.length <= width) line += ` ${part}`
        else {
          lines.push(line)
          line = part
        }
      }
    }
    lines.push(line)
  }
  while (lines.length > 1 && lines.at(-1) === '') lines.pop()
  return lines
}

/**
 * The opening of `text` up to about `limit` characters, cut at a word, and
 * how much of it is left out; all of it when that is little more.
 */
export function excerpt(text: string, limit: number): { head: string; hidden: number } {
  const trimmed = text.trim()
  if (trimmed.length <= limit * 1.25) return { head: trimmed, hidden: 0 }
  const cut = trimmed.lastIndexOf(' ', limit)
  const head = trimmed.slice(0, cut > limit / 2 ? cut : limit).trimEnd()
  return { head: `${head}…`, hidden: trimmed.length - head.length }
}

export function clock(at: number) {
  const date = new Date(at)
  try {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  } catch {
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}
