const { ensureSchema } = require('../../lib/db');
const { hashPassword, requireAuth } = require('../../lib/auth');
const { sendJson, readBody, setCors } = require('../../lib/response');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  try {
    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) {
      return sendJson(res, 400, { success: false, message: '无效的学生 ID' });
    }

    if (req.method === 'GET') {
      return await getStudent(req, res, id);
    }
    if (req.method === 'PUT') {
      return await updateStudent(req, res, id);
    }
    if (req.method === 'DELETE') {
      return await deleteStudent(req, res, id);
    }
    return sendJson(res, 405, { success: false, message: '方法不允许' });
  } catch (err) {
    console.error('students [id] error:', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || '服务器错误',
    });
  }
};

async function getStudent(req, res, id) {
  const auth = requireAuth(req, ['admin', 'student']);
  if (auth.error) {
    return sendJson(res, auth.status, { success: false, message: auth.error });
  }

  if (auth.user.role === 'student' && auth.user.id !== id) {
    return sendJson(res, 403, { success: false, message: '只能查看本人信息' });
  }

  const sql = await ensureSchema();
  const rows = await sql`
    SELECT id, student_no, name, gender, age, class_name, major, created_at, updated_at
    FROM students
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!rows.length) {
    return sendJson(res, 404, { success: false, message: '学生不存在' });
  }

  return sendJson(res, 200, { success: true, data: rows[0] });
}

async function updateStudent(req, res, id) {
  const auth = requireAuth(req, ['admin']);
  if (auth.error) {
    return sendJson(res, auth.status, { success: false, message: auth.error });
  }

  const body = await readBody(req);
  const {
    student_no,
    name,
    gender = '',
    age = null,
    class_name = '',
    major = '',
    password,
  } = body;

  if (!student_no || !name) {
    return sendJson(res, 400, { success: false, message: '学号和姓名为必填项' });
  }

  const ageNum = age === '' || age === null || age === undefined ? null : Number(age);
  if (ageNum !== null && (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
    return sendJson(res, 400, { success: false, message: '年龄不合法' });
  }

  const sql = await ensureSchema();
  const current = await sql`SELECT id FROM students WHERE id = ${id} LIMIT 1`;
  if (!current.length) {
    return sendJson(res, 404, { success: false, message: '学生不存在' });
  }

  const conflict = await sql`
    SELECT id FROM students
    WHERE student_no = ${String(student_no).trim()} AND id <> ${id}
    LIMIT 1
  `;
  if (conflict.length) {
    return sendJson(res, 409, { success: false, message: '学号已被其他学生使用' });
  }

  let rows;
  if (password) {
    const passwordHash = await hashPassword(String(password));
    rows = await sql`
      UPDATE students SET
        student_no = ${String(student_no).trim()},
        name = ${String(name).trim()},
        gender = ${String(gender || '').trim()},
        age = ${ageNum},
        class_name = ${String(class_name || '').trim()},
        major = ${String(major || '').trim()},
        password_hash = ${passwordHash},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, student_no, name, gender, age, class_name, major, created_at, updated_at
    `;
  } else {
    rows = await sql`
      UPDATE students SET
        student_no = ${String(student_no).trim()},
        name = ${String(name).trim()},
        gender = ${String(gender || '').trim()},
        age = ${ageNum},
        class_name = ${String(class_name || '').trim()},
        major = ${String(major || '').trim()},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, student_no, name, gender, age, class_name, major, created_at, updated_at
    `;
  }

  return sendJson(res, 200, {
    success: true,
    message: '更新成功',
    data: rows[0],
  });
}

async function deleteStudent(req, res, id) {
  const auth = requireAuth(req, ['admin']);
  if (auth.error) {
    return sendJson(res, auth.status, { success: false, message: auth.error });
  }

  const sql = await ensureSchema();
  const rows = await sql`
    DELETE FROM students WHERE id = ${id}
    RETURNING id, student_no, name
  `;

  if (!rows.length) {
    return sendJson(res, 404, { success: false, message: '学生不存在' });
  }

  return sendJson(res, 200, {
    success: true,
    message: '删除成功',
    data: rows[0],
  });
}
