const { neon } = require('@neondatabase/serverless');

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('缺少环境变量 DATABASE_URL');
  }
  return neon(url);
}

async function ensureSchema() {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      student_no VARCHAR(30) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      gender VARCHAR(10) DEFAULT '',
      age INTEGER,
      class_name VARCHAR(50) DEFAULT '',
      major VARCHAR(80) DEFAULT '',
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  return sql;
}

module.exports = { getSql, ensureSchema };
