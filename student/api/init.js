const { ensureSchema } = require('../lib/db');
const { hashPassword } = require('../lib/auth');
const { sendJson, setCors } = require('../lib/response');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendJson(res, 405, { success: false, message: '方法不允许' });
  }

  try {
    const sql = await ensureSchema();
    const passwordHash = await hashPassword('admin');

    await sql`
      INSERT INTO admins (username, password_hash)
      VALUES ('admin', ${passwordHash})
      ON CONFLICT (username) DO NOTHING
    `;

    const admins = await sql`SELECT id, username, created_at FROM admins WHERE username = 'admin'`;
    const studentCount = await sql`SELECT COUNT(*)::int AS count FROM students`;

    return sendJson(res, 200, {
      success: true,
      message: '数据库初始化完成',
      admin: {
        username: 'admin',
        password: 'admin',
        note: '默认管理员账号（密码已加密存储）',
      },
      data: {
        adminRecord: admins[0] || null,
        studentCount: studentCount[0].count,
      },
    });
  } catch (err) {
    console.error('init error:', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || '初始化失败',
    });
  }
};
