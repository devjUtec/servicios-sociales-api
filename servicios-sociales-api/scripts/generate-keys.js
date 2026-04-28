/**
 * Script para generar claves RSA para JWT (RS256)
 * Uso: node scripts/generate-keys.js
 */

const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generando claves RSA (2048 bits) para JWT...');

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Crear carpeta keys si no existe
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Guardar claves en archivos
fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

console.log('✅ Claves guardadas en keys/private.pem y keys/public.pem');
console.log('');

// Leer el .env actual y actualizar las claves
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8');
} else {
  // Si no existe .env, copiar de .env.example
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  }
}

// Formatear claves para .env (reemplazar saltos de línea con \n)
const privateKeyForEnv = privateKey.replace(/\n/g, '\\n');
const publicKeyForEnv = publicKey.replace(/\n/g, '\\n');

// Actualizar o agregar las claves en el .env
if (envContent.includes('JWT_PRIVATE_KEY=')) {
  envContent = envContent.replace(
    /JWT_PRIVATE_KEY=.*/,
    `JWT_PRIVATE_KEY="${privateKeyForEnv}"`
  );
} else {
  envContent += `\nJWT_PRIVATE_KEY="${privateKeyForEnv}"\n`;
}

if (envContent.includes('JWT_PUBLIC_KEY=')) {
  envContent = envContent.replace(
    /JWT_PUBLIC_KEY=.*/,
    `JWT_PUBLIC_KEY="${publicKeyForEnv}"`
  );
} else {
  envContent += `JWT_PUBLIC_KEY="${publicKeyForEnv}"\n`;
}

fs.writeFileSync(envPath, envContent);

console.log('✅ Claves actualizadas en .env');
console.log('');
console.log('📋 Clave Pública (para compartir):');
console.log(publicKey);
console.log('');
console.log('⚠️  IMPORTANTE:');
console.log('   - NUNCA compartas keys/private.pem');
console.log('   - Agrega "keys/" a tu .gitignore');
console.log('   - En producción, usa variables de entorno del servidor');
