const { ensureSchema } = require('../lib/db');
const { hashPassword, signToken } = require('../lib/auth');
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
    const {
      student_no,
      name,
      password,
      gender = '',
      age = null,
      class_name = '',
      major = '',
    } = body;

    if (!student_no || !name || !password) {
      return sendJson(res, 400, {
        success: false,
        message: '学号、姓名和密码为必填项',
      });
    }

    if (String(password).length < 4) {
      return sendJson(res, 400, {
        success: false,
        message: '密码至少 4 位',
      });
    }

    const ageNum = age === '' || age === null || age === undefined ? null : Number(age);
    if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
      return sendJson(res, 400, { success: false, message: '年龄不合法' });
    }

    const sql = await ensureSchema();
    const exists = await sql`
      SELECT id FROM students WHERE student_no = ${String(student_no).trim()} LIMIT 1
    `;
    if (exists.length) {
      return sendJson(res, 409, { success: false, message: '该学号已注册' });
    }

    const passwordHash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO students (
        student_no, name, gender, age, class_name, major, password_hash
      ) VALUES (
        ${String(student_no).trim()},
        ${String(name).trim()},
        ${String(gender || '').trim()},
        ${ageNum},
        ${String(class_name || '').trim()},
        ${String(major || '').trim()},
        ${passwordHash}
      )
      RETURNING id, student_no, name, gender, age, class_name, major, created_at
    `;

    const student = rows[0];
    const token = signToken({
      role: 'student',
      id: student.id,
      student_no: student.student_no,
      name: student.name,
    });

    return sendJson(res, 201, {
      success: true,
      message: '注册成功',
      token,
      user: { role: 'student', ...student },
    });
  } catch (err) {
    console.error('register error:', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || '注册失败',
    });
  }
};
