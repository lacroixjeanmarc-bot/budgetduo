// ========== MODULE DE CHIFFREMENT AES-256 ==========
class CryptoManager {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.saltLength = 16;
        this.ivLength = 12;
        this.iterations = 100000;
    }

    generateSalt() {
        return window.crypto.getRandomValues(new Uint8Array(this.saltLength));
    }

    generateIV() {
        return window.crypto.getRandomValues(new Uint8Array(this.ivLength));
    }

    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async encrypt(data, password, salt) {
        if (!salt) salt = this.generateSalt();
        const key = await this.deriveKey(password, salt);
        const iv = this.generateIV();
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            dataBuffer
        );
        return {
            encrypted: this.bufferToBase64(encryptedBuffer),
            salt: this.bufferToBase64(salt),
            iv: this.bufferToBase64(iv)
        };
    }

    async decrypt(encryptedData, password) {
        const encryptedBuffer = this.base64ToBuffer(encryptedData.encrypted);
        const salt = this.base64ToBuffer(encryptedData.salt);
        const iv = this.base64ToBuffer(encryptedData.iv);
        const key = await this.deriveKey(password, salt);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            {
                name: this.algorithm,
                iv: iv
            },
            key,
            encryptedBuffer
        );
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decryptedBuffer));
    }

    async verifyPassword(password, salt, testData) {
        try {
            await this.decrypt(testData, password);
            return true;
        } catch {
            return false;
        }
    }

    bufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async encryptTransaction(transaction, password, salt) {
        const sensitiveData = {
            amount: transaction.amount,
            vendor: transaction.vendor,
            category: transaction.category,
            beneficiary: transaction.beneficiary,
            payer: transaction.payer,
            userShare: transaction.userShare,
            partnerShare: transaction.partnerShare,
            isShared: transaction.isShared,
            photos: transaction.photos
        };
        const encrypted = await this.encrypt(sensitiveData, password, salt);
        
        return {
            type: transaction.type,
            date: transaction.date,
            timestamp: transaction.timestamp,
            encrypted: true,
            encryptedData: encrypted,
            vendor: '[Chiffré]',
            amount: null,
            category: null,
            beneficiary: null,
            payer: null,
            userShare: null,
            partnerShare: null,
            isShared: null,
            photos: null
        };
    }

    async decryptTransaction(transaction, password) {
        if (!transaction.encrypted) return transaction;
        try {
            const decryptedData = await this.decrypt(transaction.encryptedData, password);
            return {
                ...transaction,
                ...decryptedData,
                encrypted: false
            };
        } catch (error) {
            return {
                ...transaction,
                error: true,
                vendor: '[Erreur de déchiffrement]'
            };
        }
    }
}

// Export une instance unique (singleton)
export const cryptoManager = new CryptoManager();
export default CryptoManager;