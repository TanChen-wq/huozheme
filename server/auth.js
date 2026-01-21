const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'huozheme-secret-key-2024';
const SALT_ROUNDS = 10;

/**
 * 用户注册
 */
const register = async (email, phone, password, username) => {
  try {
    // 检查邮箱是否已存在
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 插入用户
    const result = await dbRun(
      'INSERT INTO users (email, phone, password, username) VALUES (?, ?, ?, ?)',
      [email, phone, hashedPassword, username]
    );

    return { id: result.id, email, username };
  } catch (error) {
    throw error;
  }
};

/**
 * 用户登录
 */
const login = async (email, password) => {
  try {
    // 查找用户
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('密码错误');
    }

    // 生成 JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        phone: user.phone
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * 验证 JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Token 无效或已过期');
  }
};

/**
 * 认证中间件
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  verifyToken,
  authMiddleware
};
