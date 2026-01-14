const crypto = require('crypto');

const hello_key = 'hello';
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(hello_key, 'salt', 32); // Keep 'your-password' secret
const iv = crypto.randomBytes(16);

function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // We return the IV + encrypted text because we need the same IV to decrypt
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Usage
// const GOOGLE_CLIENT_ID = decrypt(constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID);
// const GOOGLE_CLIENT_SECRET = decrypt(constants.KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET);
// Run this once for each secret and copy the output
console.log("Encrypted ID:", encrypt(''));