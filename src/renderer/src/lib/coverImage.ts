export interface CoverImageData {
  base64: string | null
  mimeType: string | null
}

const blobToBase64 = async (blob: Blob): Promise<CoverImageData> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1)
      resolve({ base64, mimeType })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export const convertImagePathToBase64 = async (imagePath: string): Promise<CoverImageData> => {
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `./${imagePath}`
  const response = await fetch(normalizedPath)
  if (!response.ok) {
    throw new Error(`Failed to fetch image '${normalizedPath}': ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()
  return blobToBase64(blob)
}
