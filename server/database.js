const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let supabase;
let sqliteDb;
const isSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_KEY;

if (isSupabase) {
  console.log('正在通过 HTTP API 连接到 Supabase...');
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
} else {
  console.log('正在连接到本地 SQLite 数据库...');
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

const initDatabase = async () => {
  if (isSupabase) {
    console.log('Supabase 表结构请确保已在后台手动创建或通过 SQL Editor 初始化');
    return;
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      username TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_checkin DATETIME
    )`,
    `CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      checkin_date DATE NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, checkin_date)
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      contact_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const q of queries) {
    await new Promise((resolve, reject) => {
      sqliteDb.run(q, (err) => err ? reject(err) : resolve());
    });
  }
  console.log('本地数据库初始化完成');
};

const dbGet = async (sql, params = []) => {
  if (isSupabase) {
    // 简化的 SQL 到 API 映射逻辑
    if (sql.includes('FROM users WHERE email = ?')) {
      const { data } = await supabase.from('users').select('*').eq('email', params[0]).single();
      return data;
    }
    if (sql.includes('FROM users WHERE id = ?')) {
      const { data } = await supabase.from('users').select('*').eq('id', params[0]).single();
      return data;
    }
    if (sql.includes('FROM checkins WHERE user_id = ? AND checkin_date = ?')) {
      const { data } = await supabase.from('checkins').select('*').eq('user_id', params[0]).eq('checkin_date', params[1]).single();
      return data;
    }
    return null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
    });
  }
};

const dbAll = async (sql, params = []) => {
  if (isSupabase) {
    if (sql.includes('FROM checkins WHERE user_id = ? ORDER BY checkin_date DESC LIMIT 7')) {
      const { data } = await supabase.from('checkins').select('*').eq('user_id', params[0]).order('checkin_date', { ascending: false }).limit(7);
      return data;
    }
    if (sql.includes('FROM contacts WHERE user_id = ?')) {
      const { data } = await supabase.from('contacts').select('*').eq('user_id', params[0]);
      return data;
    }
    if (sql.includes('FROM users u WHERE u.last_checkin IS NULL OR')) {
      // 这里的逻辑较为复杂，建议在 Supabase 后台处理或简化
      const { data } = await supabase.from('users').select('*');
      const now = new Date();
      return data.filter(u => !u.last_checkin || (now - new Date(u.last_checkin)) > 24 * 60 * 60 * 1000);
    }
    return [];
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
  }
};

const dbRun = async (sql, params = []) => {
  if (isSupabase) {
    if (sql.includes('INSERT INTO users')) {
      const { data, error } = await supabase.from('users').insert({
        email: params[0],
        phone: params[1],
        password: params[2],
        username: params[3]
      }).select();
      return { id: data ? data[0].id : null };
    }
    if (sql.includes('INSERT INTO checkins')) {
      const { data } = await supabase.from('checkins').insert({
        user_id: params[0],
        checkin_date: params[1],
        status: params[2],
        message: params[3]
      }).select();
      // 更新用户的最后签到时间
      await supabase.from('users').update({ last_checkin: new Date().toISOString() }).eq('id', params[0]);
      return { id: data ? data[0].id : null };
    }
    if (sql.includes('INSERT INTO contacts')) {
      const { data } = await supabase.from('contacts').insert({
        user_id: params[0],
        contact_name: params[1],
        contact_email: params[2],
        contact_phone: params[3]
      }).select();
      return { id: data ? data[0].id : null };
    }
    if (sql.includes('DELETE FROM contacts WHERE id = ? AND user_id = ?')) {
      await supabase.from('contacts').delete().eq('id', params[0]).eq('user_id', params[1]);
      return { changes: 1 };
    }
    return { changes: 0 };
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
