const { ensureSchema } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { sendJson, setCors } = require('../lib/response');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { success: false, message: '方法不允许' });
  }

  try {
    const auth = requireAuth(req, ['student', 'admin']);
    if (auth.error) {
      return sendJson(res, auth.status, { success: false, message: auth.error });
    }

    if (auth.user.role === 'admin') {
      return sendJson(res, 200, {
        success: true,
        user: {
          role: 'admin',
          id: auth.user.id,
          username: auth.user.username,
        },
      });
    }

    const sql = await ensureSchema();
    const rows = await sql`
      SELECT id, student_no, name, gender, age, class_name, major, created_at, updated_at
      FROM students
      WHERE id = ${auth.user.id}
      LIMIT 1
    `;

    if (!rows.length) {
      return sendJson(res, 404, { success: false, message: '学生信息不存在' });
    }

    return sendJson(res, 200, {
      success: true,
      user: { role: 'student', ...rows[0] },
    });
  } catch (err) {
    console.error('me error:', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || '获取信息失败',
    });
  }
};
