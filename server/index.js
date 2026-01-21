const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const cron = require('node-cron');

const { initDatabase } = require('./database');
const { register, login, authMiddleware } = require('./auth');
const { 
  dailyCheckin, 
  getCheckinStats, 
  getInactiveUsers 
} = require('./checkin');
const { 
  addContact, 
  getContacts, 
  deleteContact, 
  updateContact 
} = require('./contacts');
const { 
  notifyContactsCheckin, 
  notifyContactsInactive,
  getNotificationHistory 
} = require('./notification');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// 初始化数据库
initDatabase();

// ==================== 认证相关接口 ====================

/**
 * 用户注册
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: '邮箱、密码和用户名为必填项' });
    }

    const user = await register(email, phone, password, username);
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 用户登录
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码为必填项' });
    }

    const result = await login(email, password);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// ==================== 签到相关接口 ====================

/**
 * 每日签到
 */
app.post('/api/checkin', authMiddleware, async (req, res) => {
  try {
    const { status, message } = req.body;
    const userId = req.user.id;

    if (!status) {
      return res.status(400).json({ error: '状态为必填项' });
    }

    const result = await dailyCheckin(userId, status, message);

    // 发送通知给联系人
    const username = req.user.email.split('@')[0]; // 简化处理
    await notifyContactsCheckin(userId, username, status, message);

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 获取签到统计
 */
app.get('/api/checkin/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await getCheckinStats(userId);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 联系人相关接口 ====================

/**
 * 添加联系人
 */
app.post('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const { contactEmail, contactPhone, contactName } = req.body;
    const userId = req.user.id;

    if (!contactEmail && !contactPhone) {
      return res.status(400).json({ error: '邮箱或手机号至少填写一项' });
    }

    const contact = await addContact(userId, contactEmail, contactPhone, contactName);
    res.json({ success: true, contact });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 获取联系人列表
 */
app.get('/api/contacts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const contacts = await getContacts(userId);
    res.json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * 删除联系人
 */
app.delete('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    await deleteContact(userId, contactId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 更新联系人
 */
app.put('/api/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    const { contactEmail, contactPhone, contactName } = req.body;
    
    await updateContact(userId, contactId, contactEmail, contactPhone, contactName);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== 通知相关接口 ====================

/**
 * 获取通知历史
 */
app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await getNotificationHistory(userId);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 定时任务 ====================

/**
 * 每小时检查一次未签到用户
 */
cron.schedule('0 * * * *', async () => {
  console.log('执行定时任务：检查未签到用户');
  try {
    const inactiveUsers = await getInactiveUsers();
    
    for (const user of inactiveUsers) {
      console.log(`发现未签到用户: ${user.username} (${user.email})`);
      await notifyContactsInactive(user.id, user.username);
    }
    
    console.log(`定时任务完成，共处理 ${inactiveUsers.length} 个用户`);
  } catch (error) {
    console.error('定时任务执行失败:', error);
  }
});

// ==================== 静态页面路由 ====================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('数据库初始化完成');
  console.log('定时任务已启动');
});
