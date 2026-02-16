import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeStorage } from 'electron'
import settings from 'electron-settings'
import { encryptValue, decryptValue, loadAppSettings, saveAppSettings } from './settingsManager'

// Mock electron
vi.mock('electron', () => {
  return {
    safeStorage: {
      isEncryptionAvailable: vi.fn(),
      encryptString: vi.fn(),
      decryptString: vi.fn()
    },
    ipcMain: {
      handle: vi.fn()
    }
  }
})

// Mock electron-settings
vi.mock('electron-settings', () => {
  return {
    default: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
})

describe('settingsManager encryption helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(true)
    vi.mocked(safeStorage.encryptString).mockImplementation((val) => Buffer.from('encrypted-' + val))
    vi.mocked(safeStorage.decryptString).mockImplementation((buf) => buf.toString().replace('encrypted-', ''))
  })

  describe('encryptValue', () => {
    it('should encrypt a plaintext value', () => {
      const plain = 'my-api-key'
      const encrypted = encryptValue(plain)
      expect(encrypted).toBe('enc:' + Buffer.from('encrypted-my-api-key').toString('base64'))
      expect(safeStorage.encryptString).toHaveBeenCalledWith(plain)
    })

    it('should not encrypt if already encrypted', () => {
      const alreadyEncrypted = 'enc:somebase64'
      const result = encryptValue(alreadyEncrypted)
      expect(result).toBe(alreadyEncrypted)
      expect(safeStorage.encryptString).not.toHaveBeenCalled()
    })

    it('should return original value if encryption is not available', () => {
      vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false)
      const plain = 'my-api-key'
      const result = encryptValue(plain)
      expect(result).toBe(plain)
      expect(safeStorage.encryptString).not.toHaveBeenCalled()
    })

    it('should return original value if input is empty', () => {
      expect(encryptValue('')).toBe('')
      expect(safeStorage.encryptString).not.toHaveBeenCalled()
    })

    it('should handle encryption errors gracefully', () => {
      vi.mocked(safeStorage.encryptString).mockImplementation(() => {
        throw new Error('Encryption failed')
      })
      const plain = 'my-api-key'
      const result = encryptValue(plain)
      expect(result).toBe(plain)
    })
  })

  describe('decryptValue', () => {
    it('should decrypt an encrypted value', () => {
      const plain = 'my-api-key'
      const encrypted = 'enc:' + Buffer.from('encrypted-' + plain).toString('base64')
      const decrypted = decryptValue(encrypted)
      expect(decrypted).toBe(plain)
      expect(safeStorage.decryptString).toHaveBeenCalled()
    })

    it('should return original value if not encrypted (no prefix)', () => {
      const plain = 'my-api-key'
      const result = decryptValue(plain)
      expect(result).toBe(plain)
      expect(safeStorage.decryptString).not.toHaveBeenCalled()
    })

    it('should return original value if encryption is not available', () => {
      vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false)
      const encrypted = 'enc:somebase64'
      const result = decryptValue(encrypted)
      expect(result).toBe(encrypted)
      expect(safeStorage.decryptString).not.toHaveBeenCalled()
    })

    it('should handle decryption errors gracefully', () => {
      vi.mocked(safeStorage.decryptString).mockImplementation(() => {
        throw new Error('Decryption failed')
      })
      const encrypted = 'enc:somebase64'
      const result = decryptValue(encrypted)
      expect(result).toBe(encrypted)
    })
  })

  describe('loadAppSettings', () => {
    it('should decrypt sensitive fields when loading', async () => {
      const encryptedKey = 'enc:' + Buffer.from('encrypted-secret').toString('base64')
      vi.mocked(settings.get).mockResolvedValue({
        googleApiKey: encryptedKey,
        openaiApiKey: encryptedKey,
        api: 'https://example.com'
      })

      const loaded = await loadAppSettings()
      expect(loaded.googleApiKey).toBe('secret')
      expect(loaded.openaiApiKey).toBe('secret')
      expect(loaded.api).toBe('https://example.com')
      // Should NOT call saveAppSettings (settings.set) if already encrypted
      expect(settings.set).not.toHaveBeenCalled()
    })

    it('should proactively migrate plaintext fields to encrypted when loading', async () => {
      vi.mocked(settings.get).mockResolvedValue({
        googleApiKey: 'plaintext-secret',
        api: 'https://example.com'
      })

      const loaded = await loadAppSettings()
      expect(loaded.googleApiKey).toBe('plaintext-secret')

      // Should call saveAppSettings (settings.set) to encrypt the plaintext key
      expect(settings.set).toHaveBeenCalled()
      const savedSettings = vi.mocked(settings.set).mock.calls[0][1] as any
      expect(savedSettings.googleApiKey).toMatch(/^enc:/)
    })

    it('should NOT migrate if encryption is not available', async () => {
      vi.mocked(safeStorage.isEncryptionAvailable).mockReturnValue(false)
      vi.mocked(settings.get).mockResolvedValue({
        googleApiKey: 'plaintext-secret',
        api: 'https://example.com'
      })

      const loaded = await loadAppSettings()
      expect(loaded.googleApiKey).toBe('plaintext-secret')
      expect(settings.set).not.toHaveBeenCalled()
    })
  })

  describe('saveAppSettings', () => {
    it('should encrypt sensitive fields when saving', async () => {
      await saveAppSettings({
        googleApiKey: 'secret',
        openaiApiKey: 'secret',
        api: 'https://example.com'
      } as any)

      const savedSettings = vi.mocked(settings.set).mock.calls[0][1] as any
      const expectedEncrypted = 'enc:' + Buffer.from('encrypted-secret').toString('base64')

      expect(savedSettings.googleApiKey).toBe(expectedEncrypted)
      expect(savedSettings.openaiApiKey).toBe(expectedEncrypted)
      expect(savedSettings.api).toBe('https://example.com')
    })
  })
})
