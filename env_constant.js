// env_constant.js
/*

//18f8658ec501b7e9dad1d70e1b15b18f:8ac094d5f7500be8cef3c3dfe6b3f5da401ac7d9f87e4ede57c120cc97d97cf0d0bb6e821517ee8ca2cbe6e900d40e1a10ae767afe4a3508dd4a637c6198a9f224ec51ee16593496cc5aaf2480dfbc35
console.log("Encrypted Secret:", encrypt('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'));

//18f8658ec501b7e9dad1d70e1b15b18f:128080944a79f410f4ca618fc93e5c1052d3d3862838199aab7964f95917c81e952569cf8c767c60ccbaed91013acd6e
*/

const crypto = require('crypto');

// Configuration for Decryption
const hello_key = 'hello';
const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(hello_key, 'salt', 32);

/**
 * Decrypts the hex string back to plain text
 */
function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed. Check your key or encrypted string.");
        return null;
    }
}

function encrypt(text) {
    try{
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // We return the IV + encrypted text because we need the same IV to decrypt
    return iv.toString('hex') + ':' + encrypted;
    } catch(error) {
        console.error("Decryption failed. Check your key or encrypted string.");
        return null;
    }
}



// Encrypted Strings
const KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID_Encrpty = '18f8658ec501b7e9dad1d70e1b15b18f:8ac094d5f7500be8cef3c3dfe6b3f5da401ac7d9f87e4ede57c120cc97d97cf0d0bb6e821517ee8ca2cbe6e900d40e1a10ae767afe4a3508dd4a637c6198a9f224ec51ee16593496cc5aaf2480dfbc35';
const KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET_Encrpty = '18f8658ec501b7e9dad1d70e1b15b18f:128080944a79f410f4ca618fc93e5c1052d3d3862838199aab7964f95917c81e952569cf8c767c60ccbaed91013acd6e';
module.exports = {
    Key:'helloWorld',
    KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID_Encrpty: '18f8658ec501b7e9dad1d70e1b15b18f:8ac094d5f7500be8cef3c3dfe6b3f5da401ac7d9f87e4ede57c120cc97d97cf0d0bb6e821517ee8ca2cbe6e900d40e1a10ae767afe4a3508dd4a637c6198a9f224ec51ee16593496cc5aaf2480dfbc35',
    KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET_Encrpty: '18f8658ec501b7e9dad1d70e1b15b18f:128080944a79f410f4ca618fc93e5c1052d3d3862838199aab7964f95917c81e952569cf8c767c60ccbaed91013acd6e',
    API_COOKIES: 'helloWorld',
    KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID: decrypt(KRISHNALEENATWOTWOTWO_PROJECTONE_GOKGOAL_GOOGLE_CLIENT_ID_Encrpty),
    KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET: decrypt(KRISHNALEENATWOTWOTWO_PROJECTONE_GOOGLE_CLIENT_SECRET_Encrpty)
};