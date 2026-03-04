/**
 * Utilitário para calcular hash SHA-256 de ArrayBuffer.
 * 
 * Usado para detectar se uma planilha Excel mudou entre downloads,
 * permitindo usar cache e evitar re-parse desnecessário.
 */

/**
 * Calcula hash SHA-256 de um ArrayBuffer e retorna como string hexadecimal
 */
export async function hashArrayBuffer(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
