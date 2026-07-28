import { supabase } from './supabase'

const BUCKET = 'uploads'
const MAX_BYTES = 5 * 1024 * 1024 // 5MB (mesmo limite do bucket)

/**
 * Reduz a imagem no navegador antes de enviar (economiza dados no celular
 * e evita estourar o limite). Devolve um Blob JPEG/PNG.
 */
async function shrinkImage(file: File, maxSide = 1024, quality = 0.82): Promise<Blob> {
  // GIF: mantém como está (animação) se couber no limite.
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, type, quality))
  return blob ?? file
}

/**
 * Envia uma imagem para o bucket público e devolve a URL pública.
 * `folder` separa por tipo (ex.: 'avatars', 'questions').
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!file.type.startsWith('image/')) return { url: null, error: 'Selecione um arquivo de imagem.' }
  if (file.size > MAX_BYTES) return { url: null, error: 'Imagem muito grande (máx. 5MB).' }

  const blob = await shrinkImage(file)
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/gif' ? 'gif' : 'jpg'
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  const path = `${folder}/${rand}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: false,
    contentType: blob.type,
  })
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
