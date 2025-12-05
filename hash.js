import bcrypt from 'bcryptjs';
// Ojo: usa el mismo número de 'salt' que usas en tu authController (usualmente 10)
const hash = await bcrypt.hash("123", 10);
console.log(hash);