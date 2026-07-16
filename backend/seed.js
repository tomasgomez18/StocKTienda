import bcrypt from 'bcryptjs';

const email = 'maurocrr07@gmail.com';
const plainPassword = 'Maison2026';

const hash = bcrypt.hashSync(plainPassword, 10);

console.log('=== CREDENCIALES ===');
console.log(`Email:    ${email}`);
console.log(`Password: ${plainPassword}`);
console.log();
console.log('Para crear este usuario en la DB:');
console.log('  Hace un POST a /api/auth/seed con un token valido');
console.log('  O ejecuta: node seed.js (solo imprime el hash)');
console.log();
console.log('Hash generado:');
console.log(hash);
