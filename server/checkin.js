const { dbGet, dbAll, dbRun } = require('./database');

/**
 * 每日签到
 */
const dailyCheckin = async (userId, status, message = '') => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已签到
    const existingCheckin = await dbGet(
      'SELECT id FROM checkins WHERE user_id = ? AND checkin_date = ?',
      [userId, today]
    );

    if (existingCheckin) {
      throw new Error('今天已经签到过了');
    }

    // 插入签到记录
    await dbRun(
      'INSERT INTO checkins (user_id, checkin_date, status, message) VALUES (?, ?, ?, ?)',
      [userId, today, status, message]
    );

    // 更新用户最后签到时间
    await dbRun(
      'UPDATE users SET last_checkin = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    return { success: true, date: today, status, message };
  } catch (error) {
    throw error;
  }
};

/**
 * 获取今日签到状态
 */
const getTodayCheckin = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkin = await dbGet(
      'SELECT * FROM checkins WHERE user_id = ? AND checkin_date = ?',
      [userId, today]
    );
    return checkin || null;
  } catch (error) {
    throw error;
  }
};

/**
 * 获取最近 N 天的签到记录
 */
const getRecentCheckins = async (userId, days = 7) => {
  try {
    const checkins = await dbAll(
      `SELECT * FROM checkins 
       WHERE user_id = ? 
       ORDER BY checkin_date DESC 
       LIMIT ?`,
      [userId, days]
    );
    return checkins;
  } catch (error) {
    throw error;
  }
};

/**
 * 计算连续签到天数
 */
const getConsecutiveDays = async (userId) => {
  try {
    const checkins = await dbAll(
      `SELECT checkin_date FROM checkins 
       WHERE user_id = ? 
       ORDER BY checkin_date DESC`,
      [userId]
    );

    if (checkins.length === 0) return 0;

    let consecutiveDays = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkins.length - 1; i++) {
      const currentDate = new Date(checkins[i].checkin_date);
      const nextDate = new Date(checkins[i + 1].checkin_date);
      
      const diffTime = currentDate - nextDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  } catch (error) {
    throw error;
  }
};

/**
 * 获取签到统计信息
 */
const getCheckinStats = async (userId) => {
  try {
    const todayCheckin = await getTodayCheckin(userId);
    const recentCheckins = await getRecentCheckins(userId, 7);
    const consecutiveDays = await getConsecutiveDays(userId);
    
    const totalCheckins = await dbGet(
      'SELECT COUNT(*) as count FROM checkins WHERE user_id = ?',
      [userId]
    );

    return {
      hasCheckedInToday: !!todayCheckin,
      todayCheckin,
      recentCheckins,
      consecutiveDays,
      totalCheckins: totalCheckins.count
    };
  } catch (error) {
    throw error;
  }
};

/**
 * 检查超过 24 小时未签到的用户
 */
const getInactiveUsers = async () => {
  try {
    // 兼容 SQLite 和 PostgreSQL 的查询
    const sql = process.env.DATABASE_URL 
      ? `SELECT u.id, u.email, u.username, u.last_checkin 
         FROM users u
         WHERE u.last_checkin IS NULL 
         OR u.last_checkin < NOW() - INTERVAL '24 hours'`
      : `SELECT u.id, u.email, u.username, u.last_checkin 
         FROM users u
         WHERE u.last_checkin IS NULL 
         OR datetime(u.last_checkin) < datetime('now', '-24 hours')`;
    
    const users = await dbAll(sql);
    return users;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  dailyCheckin,
  getTodayCheckin,
  getRecentCheckins,
  getConsecutiveDays,
  getCheckinStats,
  getInactiveUsers
};
