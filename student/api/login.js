const { ensureSchema } = require('../lib/db');
const { verifyPassword, signToken } = require('../lib/auth');
const { sendJson, readBody, setCors } = require('../lib/response');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: '方法不允许' });
  }

  try {
    const body = await readBody(req);
    const { role, username, password, student_no } = body;

    if (!password) {
      return sendJson(res, 400, { success: false, message: '请输入密码' });
    }

    const sql = await ensureSchema();

    if (role === 'admin') {
      if (!username) {
        return sendJson(res, 400, { success: false, message: '请输入管理员用户名' });
      }

      const rows = await sql`
        SELECT id, username, password_hash
        FROM admins
        WHERE username = ${username}
        LIMIT 1
      `;

      if (!rows.length) {
        return sendJson(res, 401, { success: false, message: '用户名或密码错误' });
      }

      const admin = rows[0];
      const ok = await verifyPassword(password, admin.password_hash);
      if (!ok) {
        return sendJson(res, 401, { success: false, message: '用户名或密码错误' });
      }

      const token = signToken({
        role: 'admin',
        id: admin.id,
        username: admin.username,
      });

      return sendJson(res, 200, {
        success: true,
        message: '登录成功',
        token,
        user: { role: 'admin', id: admin.id, username: admin.username },
      });
    }

    // 学生：学号 + 密码
    const studentNo = student_no || username;
    if (!studentNo) {
      return sendJson(res, 400, { success: false, message: '请输入学号' });
    }

    const rows = await sql`
      SELECT id, student_no, name, gender, age, class_name, major, password_hash
      FROM students
      WHERE student_no = ${studentNo}
      LIMIT 1
    `;

    if (!rows.length) {
      return sendJson(res, 401, { success: false, message: '学号或密码错误' });
    }

    const student = rows[0];
    const ok = await verifyPassword(password, student.password_hash);
    if (!ok) {
      return sendJson(res, 401, { success: false, message: '学号或密码错误' });
    }

    const token = signToken({
      role: 'student',
      id: student.id,
      student_no: student.student_no,
      name: student.name,
    });

    const { password_hash, ...safe } = student;

    return sendJson(res, 200, {
      success: true,
      message: '登录成功',
      token,
      user: { role: 'student', ...safe },
    });
  } catch (err) {
    console.error('login error:', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || '登录失败',
    });
  }
};
