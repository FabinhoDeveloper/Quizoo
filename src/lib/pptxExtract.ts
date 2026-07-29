import JSZip from 'jszip'

/**
 * Extrai o texto de um arquivo .pptx (PowerPoint) no navegador.
 * Um .pptx é um zip de XML; o texto dos slides fica em <a:t>…</a:t>.
 */
export async function extractPptxText(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  // slide1.xml, slide2.xml, … na ordem correta
  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0)
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0)
      return na - nb
    })

  const parts: string[] = []
  for (const name of slideFiles) {
    const xml = await zip.files[name].async('string')
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) =>
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, ' '),
    )
    if (texts.length) parts.push(texts.join(' '))
  }
  return parts.join('\n\n').replace(/\s+\n/g, '\n').trim()
}
