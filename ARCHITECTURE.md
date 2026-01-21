# 项目架构说明

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      浏览器客户端                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  登录/注册页  │  │   仪表盘页    │  │   CSS/JS     │  │
│  │ index.html   │  │dashboard.html │  │   资源文件    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                    Express 服务器                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  路由层 (Routes)                  │   │
│  │  /api/auth/*  /api/checkin/*  /api/contacts/*   │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              业务逻辑层 (Services)                │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐       │   │
│  │  │ auth │ │checkin│ │contacts│ │notification│   │   │
│  │  └──────┘ └──────┘ └──────┘ └──────────┘       │   │
│  └──────────────────────────────────────────────────┘   │
│                          ↕                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │              数据访问层 (Database)                │   │
│  │         dbGet / dbAll / dbRun                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    SQLite 数据库                         │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌─────────────┐       │
│  │users │ │checkins│ │contacts│ │notifications│       │
│  └──────┘ └────────┘ └────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    定时任务 (Cron)                        │
│         每小时检查未签到用户并发送通知                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  通知服务 (External)                      │
│  ┌──────────────┐              ┌──────────────┐         │
│  │ SMTP 邮件服务 │              │  短信服务商   │         │
│  └──────────────┘              └──────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## 目录结构详解

```
huozheme/
├── server/                     # 后端代码目录
│   ├── index.js               # 主服务器文件，Express 应用入口
│   ├── database.js            # 数据库连接和操作封装
│   ├── auth.js                # 用户认证模块（注册/登录/JWT）
│   ├── checkin.js             # 签到业务逻辑
│   ├── contacts.js            # 联系人管理逻辑
│   └── notification.js        # 通知发送逻辑
│
├── public/                    # 前端静态文件目录
│   ├── index.html            # 登录/注册页面
│   ├── dashboard.html        # 用户仪表盘页面
│   ├── css/
│   │   └── style.css         # 全局样式文件
│   ├── js/
│   │   ├── auth.js           # 认证相关前端逻辑
│   │   └── dashboard.js      # 仪表盘前端逻辑
│   └── assets/               # 静态资源（图片等）
│
├── config/                    # 配置文件目录
│   └── email.js              # 邮件服务配置
│
├── data.db                    # SQLite 数据库文件（运行时生成）
├── package.json              # 项目依赖配置
├── README.md                 # 项目说明文档
├── STARTUP.md                # 启动说明文档
└── ARCHITECTURE.md           # 架构说明文档（本文件）
```

## 核心模块说明

### 1. server/index.js - 主服务器

**职责**：
- Express 应用初始化
- 中间件配置（CORS、Body Parser）
- 路由定义
- 定时任务启动
- 静态文件服务

**关键代码**：
```javascript
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// 路由定义
app.post('/api/auth/register', async (req, res) => { ... });
app.post('/api/auth/login', async (req, res) => { ... });
app.post('/api/checkin', authMiddleware, async (req, res) => { ... });

// 定时任务
cron.schedule('0 * * * *', async () => { ... });
```

### 2. server/database.js - 数据库层

**职责**：
- SQLite 数据库连接
- 表结构初始化
- 数据库操作封装（Promise 化）

**核心函数**：
- `initDatabase()` - 初始化数据库表
- `dbGet(sql, params)` - 查询单条记录
- `dbAll(sql, params)` - 查询多条记录
- `dbRun(sql, params)` - 执行插入/更新/删除

**表结构**：
```sql
-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_checkin DATETIME
);

-- 签到记录表
CREATE TABLE checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  checkin_date DATE NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, checkin_date)
);

-- 联系人表
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 通知记录表
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. server/auth.js - 认证模块

**职责**：
- 用户注册（密码加密）
- 用户登录（密码验证）
- JWT Token 生成和验证
- 认证中间件

**核心函数**：
- `register(email, phone, password, username)` - 用户注册
- `login(email, password)` - 用户登录
- `verifyToken(token)` - 验证 JWT Token
- `authMiddleware(req, res, next)` - Express 中间件

**安全机制**：
- bcrypt 密码加密（10 轮盐值）
- JWT Token 有效期 7 天
- 密码不可逆加密存储

### 4. server/checkin.js - 签到模块

**职责**：
- 每日签到逻辑
- 签到记录查询
- 连续签到天数计算
- 签到统计数据

**核心函数**：
- `dailyCheckin(userId, status, message)` - 执行签到
- `getTodayCheckin(userId)` - 获取今日签到状态
- `getRecentCheckins(userId, days)` - 获取最近 N 天签到
- `getConsecutiveDays(userId)` - 计算连续签到天数
- `getCheckinStats(userId)` - 获取签到统计
- `getInactiveUsers()` - 查找未签到用户

**业务规则**：
- 每天只能签到一次（通过 UNIQUE 约束保证）
- 签到后更新用户的 last_checkin 时间
- 连续签到天数通过日期差计算

### 5. server/contacts.js - 联系人模块

**职责**：
- 联系人增删改查
- 联系人验证

**核心函数**：
- `addContact(userId, contactEmail, contactPhone, contactName)` - 添加联系人
- `getContacts(userId)` - 获取联系人列表
- `deleteContact(userId, contactId)` - 删除联系人
- `updateContact(userId, contactId, ...)` - 更新联系人

### 6. server/notification.js - 通知模块

**职责**：
- 邮件发送（Nodemailer）
- 短信发送（模拟）
- 通知内容生成
- 通知记录存储

**核心函数**：
- `sendEmailNotification(to, subject, html)` - 发送邮件
- `sendSMSNotification(phone, message)` - 发送短信
- `generateCheckinNotification(username, status, message)` - 生成签到通知
- `generateInactiveNotification(username)` - 生成未签到提醒
- `notifyContactsCheckin(userId, username, status, message)` - 通知签到
- `notifyContactsInactive(userId, username)` - 通知未签到

**通知类型**：
1. **签到通知**：用户签到时发送给所有联系人
2. **未签到提醒**：超过 24 小时未签到时发送

### 7. public/js/auth.js - 前端认证

**职责**：
- 登录/注册表单处理
- API 请求封装
- Token 存储
- 页面跳转

**核心函数**：
- `handleLogin(event)` - 处理登录
- `handleRegister(event)` - 处理注册
- `showToast(message, type)` - 显示提示信息
- `checkAuth()` - 检查登录状态

### 8. public/js/dashboard.js - 前端仪表盘

**职责**：
- 签到功能交互
- 联系人管理交互
- 统计数据展示
- Canvas 图表绘制

**核心函数**：
- `handleCheckin()` - 处理签到
- `loadCheckinStats()` - 加载签到统计
- `handleAddContact(event)` - 添加联系人
- `loadContacts()` - 加载联系人列表
- `deleteContact(contactId)` - 删除联系人
- `loadStats()` - 加载统计数据
- `drawChart(checkins)` - 绘制签到趋势图

## 数据流详解

### 用户注册流程

```
1. 用户填写注册表单
   ↓
2. 前端验证（密码一致性、长度）
   ↓
3. POST /api/auth/register
   ↓
4. 后端验证（邮箱唯一性）
   ↓
5. bcrypt 加密密码
   ↓
6. 插入 users 表
   ↓
7. 返回成功响应
   ↓
8. 前端跳转到登录表单
```

### 用户登录流程

```
1. 用户填写登录表单
   ↓
2. POST /api/auth/login
   ↓
3. 查询用户记录
   ↓
4. bcrypt 验证密码
   ↓
5. 生成 JWT Token
   ↓
6. 返回 Token 和用户信息
   ↓
7. 前端存储 Token 到 localStorage
   ↓
8. 跳转到仪表盘页面
```

### 签到流程

```
1. 用户选择状态并填写留言
   ↓
2. POST /api/checkin (携带 JWT Token)
   ↓
3. authMiddleware 验证 Token
   ↓
4. 检查今日是否已签到
   ↓
5. 插入 checkins 表
   ↓
6. 更新 users.last_checkin
   ↓
7. 查询用户的所有联系人
   ↓
8. 遍历联系人发送通知
   │  ├─ 发送邮件
   │  ├─ 发送短信
   │  └─ 记录到 notifications 表
   ↓
9. 返回成功响应
   ↓
10. 前端刷新签到状态
```

### 定时任务流程

```
每小时执行一次：
   ↓
1. 查询 last_checkin > 24h 的用户
   ↓
2. 遍历这些用户
   ↓
3. 查询每个用户的联系人
   ↓
4. 发送未签到提醒
   │  ├─ 发送邮件
   │  ├─ 发送短信
   │  └─ 记录到 notifications 表
   ↓
5. 打印日志
```

## 技术选型理由

### 后端

**Node.js + Express**
- 轻量级，易于部署
- JavaScript 全栈开发
- 丰富的中间件生态

**SQLite**
- 零配置，单文件数据库
- 适合中小型应用
- 易于备份和迁移
- 无需独立数据库服务

**bcrypt**
- 业界标准的密码加密算法
- 自动加盐
- 可调节加密强度

**jsonwebtoken**
- 无状态认证
- 跨域友好
- 易于扩展

**nodemailer**
- 支持多种邮件服务
- 配置灵活
- 支持 HTML 邮件

**node-cron**
- 类 Unix cron 语法
- 轻量级
- 易于配置

### 前端

**原生 HTML/CSS/JavaScript**
- 零依赖，加载快速
- 易于理解和修改
- 适合小型项目

**Canvas**
- 原生图表绘制
- 性能优秀
- 自定义程度高

## 安全性设计

### 1. 密码安全
- bcrypt 加密存储
- 10 轮盐值
- 不可逆加密

### 2. 认证安全
- JWT Token 认证
- Token 有效期限制
- 请求头携带 Token

### 3. 数据库安全
- 参数化查询（防 SQL 注入）
- 外键约束
- 唯一性约束

### 4. 输入验证
- 前端表单验证
- 后端参数验证
- 错误信息友好

### 5. CORS 配置
- 跨域请求控制
- 生产环境应限制域名

## 性能优化

### 1. 数据库优化
- 索引优化（email, user_id, checkin_date）
- 查询优化（LIMIT、索引覆盖）
- 连接池管理

### 2. 前端优化
- 静态资源缓存
- 按需加载
- 图片优化

### 3. 后端优化
- 异步处理
- 错误处理
- 日志管理

## 扩展性设计

### 水平扩展
- 无状态设计（JWT）
- 数据库可迁移到 MySQL/PostgreSQL
- 可部署多实例 + 负载均衡

### 功能扩展
- 模块化设计
- 清晰的职责划分
- 易于添加新功能

### 第三方集成
- 邮件服务可配置
- 短信服务接口预留
- 支持多种通知渠道

## 测试建议

### 单元测试
- 使用 Jest 或 Mocha
- 测试核心业务逻辑
- 模拟数据库操作

### 集成测试
- 使用 Supertest
- 测试 API 接口
- 测试认证流程

### 端到端测试
- 使用 Puppeteer 或 Cypress
- 测试完整用户流程
- 测试 UI 交互

## 部署架构

### 单机部署
```
┌─────────────────────┐
│   Nginx (80/443)    │
│   ├─ SSL 证书       │
│   └─ 反向代理       │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Node.js (3000)     │
│  ├─ Express 应用    │
│  └─ SQLite 数据库   │
└─────────────────────┘
```

### 分布式部署
```
┌─────────────────────┐
│  Nginx 负载均衡      │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐     ┌───▼───┐
│Node.js│     │Node.js│
│实例 1  │     │实例 2  │
└───┬───┘     └───┬───┘
    │             │
    └──────┬──────┘
           │
┌──────────▼──────────┐
│  MySQL/PostgreSQL   │
└─────────────────────┘
```

---

**本架构文档持续更新中** 📝
