const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let pool;
let sqliteDb;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  console.log('正在连接到 PostgreSQL 数据库...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  console.log('正在连接到 SQLite 数据库...');
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

const initDatabase = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_checkin TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS checkins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      checkin_date DATE NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, checkin_date)
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      contact_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  // SQLite 兼容性处理
  const sqliteQueries = queries.map(q => q.replace('SERIAL PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT').replace('TIMESTAMP', 'DATETIME'));

  if (isPostgres) {
    for (const q of queries) {
      await pool.query(q);
    }
  } else {
    for (const q of sqliteQueries) {
      await new Promise((resolve, reject) => {
        sqliteDb.run(q, (err) => err ? reject(err) : resolve());
      });
    }
  }
  console.log('数据库初始化完成');
};

const dbGet = (sql, params = []) => {
  if (isPostgres) {
    const pgSql = sql.replace(/\?/g, (match, index) => `$${params.indexOf(params[0]) + 1}`); // 简单替换，实际应更复杂
    // 改进替换逻辑
    let i = 1;
    const finalSql = sql.replace(/\?/g, () => `$${i++}`);
    return pool.query(finalSql, params).then(res => res.rows[0]);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
  }
};

const dbAll = (sql, params = []) => {
  if (isPostgres) {
    let i = 1;
    const finalSql = sql.replace(/\?/g, () => `$${i++}`);
    return pool.query(finalSql, params).then(res => res.rows);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  }
};

const dbRun = (sql, params = []) => {
  if (isPostgres) {
    let i = 1;
    const finalSql = sql.replace(/\?/g, () => `$${i++}`);
    // PostgreSQL 不直接返回 lastID，需要在 SQL 中加 RETURNING id
    const returningSql = sql.toLowerCase().includes('insert') ? `${finalSql} RETURNING id` : finalSql;
    return pool.query(returningSql, params).then(res => ({
      id: res.rows[0] ? res.rows[0].id : null,
      changes: res.rowCount
    }));
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = {
  initDatabase,
  dbGet,
  dbAll,
  dbRun
};
