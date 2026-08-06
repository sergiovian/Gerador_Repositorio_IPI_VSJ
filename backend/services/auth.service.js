const crypto = require('crypto');
const db = require('../models/db.model');
const AppError = require('../utils/app-error');

const hash = password => new Promise((resolve, reject) => crypto.scrypt(password, 'louvor-inteligente', 64, (error, value) => error ? reject(error) : resolve(value.toString('hex'))));

async function register({ churchName, responsibleName, email, username, password }) {
  if (!churchName || !responsibleName || !email || !username || !password || password.length < 6) throw new AppError('Preencha todos os campos. A senha deve ter ao menos 6 caracteres.', 400);
  return db.transaction(async () => {
    const church = await db.run('INSERT INTO churches(name) VALUES(?)', [churchName.trim()]);
    const user = await db.run('INSERT INTO users(church_id,name,email,username,password_hash,role) VALUES(?,?,?,?,?,?)', [church.id, responsibleName.trim(), email.trim().toLowerCase(), username.trim().toLowerCase(), await hash(password), 'ADMIN']);
    await db.run('INSERT INTO church_preferences(church_id) VALUES(?)', [church.id]);
    await db.run('INSERT INTO admin_notifications(message) VALUES(?)', [`Nova igreja cadastrada: ${churchName.trim()}`]);
    return { churchId: church.id, userId: user.id, username: username.trim().toLowerCase() };
  });
}

async function login(username, password) {
  const user = await db.get('SELECT u.*,c.name church_name FROM users u JOIN churches c ON c.id=u.church_id WHERE lower(u.username)=lower(?) AND u.active=1 AND c.active=1', [username]);
  if (!user || !crypto.timingSafeEqual(Buffer.from(await hash(password)), Buffer.from(user.password_hash))) throw new AppError('Login ou senha inválidos.', 401);
  return { userId: user.id, churchId: user.church_id, username: user.username, churchName: user.church_name, role: user.role };
}

async function currentUser(userId) {
  const user = await db.get(`SELECT u.id,u.church_id,u.name,u.username,u.role,u.active,
    c.name church_name,c.active church_active,c.logo_file,c.updated_at church_updated_at
    FROM users u JOIN churches c ON c.id=u.church_id WHERE u.id=?`, [Number(userId)]);
  if (!user || !user.active || !user.church_active) return null;
  return {
    userId: user.id,
    churchId: user.church_id,
    name: user.name,
    username: user.username,
    churchName: user.church_name,
    role: user.role,
    churchLogoUrl: user.logo_file
      ? `/api/church/profile/logo?v=${encodeURIComponent(user.church_updated_at || '')}`
      : user.church_id === 1 ? '/assets/img/logo-ipi.jpg' : '/assets/img/app-mark.svg'
  };
}

async function ensureIpiUser() {
  const current = await db.get('SELECT id FROM users WHERE username=?', ['ipivsj']);
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!current) {
    if (!bootstrapPassword || bootstrapPassword.length < 12) {
      console.warn('Administrador inicial não criado: defina BOOTSTRAP_ADMIN_PASSWORD com ao menos 12 caracteres.');
      return;
    }
    await db.run(
      'INSERT INTO users(church_id,name,email,username,password_hash,role) VALUES(?,?,?,?,?,?)',
      [1, 'IPI Vila São José', 'ipivsj@local', 'ipivsj', await hash(bootstrapPassword), 'SUPER_ADMIN']
    );
    return;
  }
  if (bootstrapPassword && bootstrapPassword.length < 12) {
    throw new AppError('BOOTSTRAP_ADMIN_PASSWORD deve ter ao menos 12 caracteres.', 500);
  }
  if (bootstrapPassword) {
    await db.run('UPDATE users SET church_id=1,password_hash=?,role=?,active=1 WHERE id=?', [await hash(bootstrapPassword), 'SUPER_ADMIN', current.id]);
    return;
  }
  await db.run('UPDATE users SET church_id=1,role=?,active=1 WHERE id=?', ['SUPER_ADMIN', current.id]);
}

module.exports = { currentUser, ensureIpiUser, login, register };
