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
    if (req.method === 'GET') {
      return await listStudents(req, res);
    }
    if (req.method === 'POST') {
      return await createStudent(req, res);
    }
    return sendJson(res, 405, { success: false, message: '方法不允许' });
  } catch (err) {
    console.error('students index error:', err);
    return sendJson(res, 500, {
      success: false,
      message: err.message || '服务器错误',
    });
  }
};

async function listStudents(req, res) {
  const auth = requireAuth(req, ['admin']);
  if (auth.error) {
    return sendJson(res, auth.status, { success: false, message: auth.error });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const q = (url.searchParams.get('q') || '').trim();
  const sql = await ensureSchema();

  let rows;
  if (q) {
    const like = `%${q}%`;
    rows = await sql`
      SELECT id, student_no, name, gender, age, class_name, major, created_at, updated_at
      FROM students
      WHERE student_no ILIKE ${like}
         OR name ILIKE ${like}
         OR class_name ILIKE ${like}
         OR major ILIKE ${like}
      ORDER BY id DESC
    `;
  } else {
    rows = await sql`
      SELECT id, student_no, name, gender, age, class_name, major, created_at, updated_at
      FROM students
      ORDER BY id DESC
    `;
  }

  return sendJson(res, 200, { success: true, data: rows });
}

async function createStudent(req, res) {
  const auth = requireAuth(req, ['admin']);
  if (auth.error) {
    return sendJson(res, auth.status, { success: false, message: auth.error });
  }

  const body = await readBody(req);
  const {
    student_no,
    name,
    password = '123456',
    gender = '',
    age = null,
    class_name = '',
    major = '',
  } = body;

  if (!student_no || !name) {
    return sendJson(res, 400, { success: false, message: '学号和姓名为必填项' });
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
    return sendJson(res, 409, { success: false, message: '学号已存在' });
  }

  const passwordHash = await hashPassword(String(password));
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
    RETURNING id, student_no, name, gender, age, class_name, major, created_at, updated_at
  `;

  return sendJson(res, 201, {
    success: true,
    message: '添加成功',
    data: rows[0],
  });
}
