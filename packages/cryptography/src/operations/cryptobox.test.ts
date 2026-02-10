import {
  CryptoboxDecryptionError,
  generateKeyPair,
  seal,
  sign,
  unseal,
  verifySignature,
} from './cryptobox'

describe('cryptobox', () => {
  describe('generateKeyPair', () => {
    it('should generate valid keypair with base64url encoded keys', async () => {
      const keypair = await generateKeyPair()

      // Check keys are strings
      expect(typeof keypair.publicKey).toBe('string')
      expect(typeof keypair.privateKey).toBe('string')

      // Check keys are non-empty
      expect(keypair.publicKey.length).toBeGreaterThan(0)
      expect(keypair.privateKey.length).toBeGreaterThan(0)
    })

    it('should generate different keypairs each time', async () => {
      const keypair1 = await generateKeyPair()
      const keypair2 = await generateKeyPair()

      expect(keypair1.publicKey).not.toBe(keypair2.publicKey)
      expect(keypair1.privateKey).not.toBe(keypair2.privateKey)
    })
  })

  describe('seal and unseal', () => {
    it('should round-trip encrypt and decrypt message', async () => {
      const keypair = await generateKeyPair()
      const originalMessage = 'Hello, libsodium cryptobox!'

      const encrypted = await seal(originalMessage, keypair.publicKey)
      const decrypted = await unseal(encrypted, keypair)

      expect(decrypted).toBe(originalMessage)
    })

    it('should handle empty message', async () => {
      const keypair = await generateKeyPair()
      const originalMessage = ''

      const encrypted = await seal(originalMessage, keypair.publicKey)
      const decrypted = await unseal(encrypted, keypair)

      expect(decrypted).toBe(originalMessage)
    })

    it('should handle unicode message', async () => {
      const keypair = await generateKeyPair()
      const originalMessage =
        'Ahoj! Zdravim vas. Testime unicode: cau, cena 100 EUR'

      const encrypted = await seal(originalMessage, keypair.publicKey)
      const decrypted = await unseal(encrypted, keypair)

      expect(decrypted).toBe(originalMessage)
    })

    it('should handle large message', async () => {
      const keypair = await generateKeyPair()
      const originalMessage = 'x'.repeat(10000)

      const encrypted = await seal(originalMessage, keypair.publicKey)
      const decrypted = await unseal(encrypted, keypair)

      expect(decrypted).toBe(originalMessage)
    })
  })

  describe('error cases', () => {
    it('should throw when decrypting with wrong keypair', async () => {
      const keypair1 = await generateKeyPair()
      const keypair2 = await generateKeyPair()

      const encrypted = await seal('secret message', keypair1.publicKey)

      // Try to decrypt with wrong keypair
      await expect(unseal(encrypted, keypair2)).rejects.toThrow(
        CryptoboxDecryptionError
      )
    })

    it('should throw when ciphertext is tampered with', async () => {
      const keypair = await generateKeyPair()
      const encrypted = await seal('secret message', keypair.publicKey)

      // Tamper with the ciphertext (change a character after the version prefix)
      const ciphertextPart = encrypted
      const tamperedChar = ciphertextPart[0] === 'A' ? 'B' : 'A'
      const tamperedCiphertext = tamperedChar + ciphertextPart.slice(1)

      await expect(unseal(tamperedCiphertext, keypair)).rejects.toThrow(
        CryptoboxDecryptionError
      )
    })

    it('should throw when ciphertext is truncated', async () => {
      const keypair = await generateKeyPair()
      const encrypted = await seal('secret message', keypair.publicKey)

      // Truncate the ciphertext
      const truncated = encrypted.slice(0, encrypted.length - 10)

      await expect(unseal(truncated, keypair)).rejects.toThrow(
        CryptoboxDecryptionError
      )
    })
  })

  describe('determinism', () => {
    it('should produce different ciphertext for same message (non-deterministic)', async () => {
      const keypair = await generateKeyPair()
      const message = 'same message'

      const encrypted1 = await seal(message, keypair.publicKey)
      const encrypted2 = await seal(message, keypair.publicKey)

      // Sealed box uses ephemeral keypair, so ciphertext should differ
      expect(encrypted1).not.toBe(encrypted2)

      // Both should decrypt to same message
      const decrypted1 = await unseal(encrypted1, keypair)
      const decrypted2 = await unseal(encrypted2, keypair)
      expect(decrypted1).toBe(message)
      expect(decrypted2).toBe(message)
    })
  })

  describe('sign', () => {
    it('should produce a base64 signature string', async () => {
      const keypair = await generateKeyPair()
      const message = 'Message to sign'

      const signature = await sign(message, keypair.privateKey)

      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
    })

    it('should produce deterministic signatures for the same message and key', async () => {
      const keypair = await generateKeyPair()
      const message = 'Consistent message'

      const signature1 = await sign(message, keypair.privateKey)
      const signature2 = await sign(message, keypair.privateKey)

      expect(signature1).toBe(signature2)
    })

    it('should produce different signatures for different messages', async () => {
      const keypair = await generateKeyPair()

      const signature1 = await sign('Message one', keypair.privateKey)
      const signature2 = await sign('Message two', keypair.privateKey)

      expect(signature1).not.toBe(signature2)
    })

    it('should produce different signatures with different keys', async () => {
      const keypair1 = await generateKeyPair()
      const keypair2 = await generateKeyPair()
      const message = 'Same message'

      const signature1 = await sign(message, keypair1.privateKey)
      const signature2 = await sign(message, keypair2.privateKey)

      expect(signature1).not.toBe(signature2)
    })

    it('should handle empty message', async () => {
      const keypair = await generateKeyPair()

      const signature = await sign('', keypair.privateKey)

      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
    })

    it('should handle unicode message', async () => {
      const keypair = await generateKeyPair()
      const message = 'Podpis: Ahoj, cena 100 EUR'

      const signature = await sign(message, keypair.privateKey)

      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
    })
  })

  describe('verifySignature', () => {
    it('should verify a valid signature', async () => {
      const keypair = await generateKeyPair()
      const message = 'Message to verify'

      const signature = await sign(message, keypair.privateKey)
      const isValid = await verifySignature(
        message,
        signature,
        keypair.publicKey
      )

      expect(isValid).toBe(true)
    })

    it('should reject signature from different keypair', async () => {
      const keypair1 = await generateKeyPair()
      const keypair2 = await generateKeyPair()
      const message = 'Message to verify'

      const signature = await sign(message, keypair1.privateKey)
      const isValid = await verifySignature(
        message,
        signature,
        keypair2.publicKey
      )

      expect(isValid).toBe(false)
    })

    it('should reject signature for different message', async () => {
      const keypair = await generateKeyPair()

      const signature = await sign('Original message', keypair.privateKey)
      const isValid = await verifySignature(
        'Different message',
        signature,
        keypair.publicKey
      )

      expect(isValid).toBe(false)
    })

    it('should reject tampered signature', async () => {
      const keypair = await generateKeyPair()
      const message = 'Message to verify'

      const signature = await sign(message, keypair.privateKey)
      // Tamper with signature
      const tamperedChar = signature[0] === 'A' ? 'B' : 'A'
      const tamperedSignature = tamperedChar + signature.slice(1)

      const isValid = await verifySignature(
        message,
        tamperedSignature,
        keypair.publicKey
      )

      expect(isValid).toBe(false)
    })

    it('should verify empty message signature', async () => {
      const keypair = await generateKeyPair()

      const signature = await sign('', keypair.privateKey)
      const isValid = await verifySignature('', signature, keypair.publicKey)

      expect(isValid).toBe(true)
    })

    it('should verify unicode message signature', async () => {
      const keypair = await generateKeyPair()
      const message = 'Podpis: Ahoj, cena 100 EUR'

      const signature = await sign(message, keypair.privateKey)
      const isValid = await verifySignature(
        message,
        signature,
        keypair.publicKey
      )

      expect(isValid).toBe(true)
    })
  })
})
