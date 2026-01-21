# 活着么

> 一个温暖的存在确认与状态同步应用

## 📖 项目简介

**活着么** 是一个帮助用户每天签到、让亲友安心的 Web 应用。用户可以每天选择自己的状态进行签到，系统会自动通知预设的联系人。如果用户超过 24 小时未签到，系统会自动提醒其联系人关注用户安全。

## ✨ 核心功能

### 1. 用户认证系统
- 邮箱注册/登录
- 支持手机号绑定（可选）
- JWT Token 认证
- 密码加密存储

### 2. 每日签到系统
- 每天可签到一次
- 四种状态选择：
  - 😊 很好
  - 😌 还行
  - 😔 有点累
  - 🆘 需要联系
- 支持添加一句话留言
- 显示连续签到天数
- 记录最近 7 天签到历史

### 3. 亲友关注系统
- 添加/删除联系人
- 支持邮箱和手机号
- 自动通知功能
- 联系人管理界面

### 4. 智能通知系统
- 签到时自动通知联系人
- 超过 24 小时未签到自动提醒
- 邮件通知（可配置）
- 短信通知（模拟接口）
- 精美的邮件模板

### 5. 数据统计面板
- 今日签到状态
- 连续签到天数
- 累计签到次数
- 最近 7 天签到记录
- 状态趋势图表

### 6. 定时任务
- 每小时检查未签到用户
- 自动发送提醒通知
- 后台心跳检测

## 🏗️ 技术架构

### 后端技术栈
- **Node.js** - 运行环境
- **Express** - Web 框架
- **SQLite** - 轻量级数据库
- **bcrypt** - 密码加密
- **jsonwebtoken** - JWT 认证
- **nodemailer** - 邮件发送
- **node-cron** - 定时任务

### 前端技术栈
- **HTML5** - 页面结构
- **CSS3** - 样式设计
- **JavaScript** - 交互逻辑
- **Canvas** - 图表绘制

### 设计特色
- 极简风格
- 温暖配色（渐变紫色主题）
- 呼吸动画效果
- 淡入淡出过渡
- 完全响应式设计
- 移动端适配

## 📁 项目结构

```
huozheme/
├── server/                 # 后端代码
│   ├── index.js           # 主服务器文件
│   ├── database.js        # 数据库操作
│   ├── auth.js            # 认证模块
│   ├── checkin.js         # 签到模块
│   ├── contacts.js        # 联系人模块
│   └── notification.js    # 通知模块
├── public/                # 前端静态文件
│   ├── index.html         # 登录/注册页面
│   ├── dashboard.html     # 仪表盘页面
│   ├── css/
│   │   └── style.css      # 样式文件
│   └── js/
│       ├── auth.js        # 认证逻辑
│       └── dashboard.js   # 仪表盘逻辑
├── config/                # 配置文件
│   └── email.js           # 邮件配置
├── data.db                # SQLite 数据库文件（运行时生成）
├── package.json           # 项目配置
└── README.md             # 项目文档
```

## 🗄️ 数据库结构

### users 表（用户表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| email | TEXT | 邮箱地址，唯一 |
| phone | TEXT | 手机号 |
| password | TEXT | 加密密码 |
| username | TEXT | 用户名 |
| created_at | DATETIME | 创建时间 |
| last_checkin | DATETIME | 最后签到时间 |

### checkins 表（签到记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户 ID |
| checkin_date | DATE | 签到日期 |
| status | TEXT | 状态 |
| message | TEXT | 留言 |
| created_at | DATETIME | 创建时间 |

### contacts 表（联系人表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户 ID |
| contact_email | TEXT | 联系人邮箱 |
| contact_phone | TEXT | 联系人手机 |
| contact_name | TEXT | 联系人姓名 |
| created_at | DATETIME | 创建时间 |

### notifications 表（通知记录表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| user_id | INTEGER | 用户 ID |
| contact_id | INTEGER | 联系人 ID |
| type | TEXT | 通知类型 |
| content | TEXT | 通知内容 |
| sent_at | DATETIME | 发送时间 |

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装步骤

1. **克隆或下载项目**
```bash
cd huozheme
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务器**
```bash
npm start
```

4. **访问应用**
打开浏览器访问：`http://localhost:3000`

### 开发模式
如果需要自动重启服务器（需要安装 nodemon）：
```bash
npm install -g nodemon
npm run dev
```

## 📧 邮件配置

默认情况下，应用运行在**演示模式**，邮件和短信通知只会在控制台打印，不会真实发送。

如需启用真实邮件发送：

1. 编辑 `config/email.js` 文件，填写 SMTP 配置
2. 编辑 `server/notification.js` 文件，取消邮件发送代码的注释

### 常见邮箱配置示例

**QQ 邮箱**
```javascript
{
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@qq.com',
    pass: 'your-authorization-code' // 授权码，不是密码
  }
}
```

**163 邮箱**
```javascript
{
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: 'your-email@163.com',
    pass: 'your-authorization-code'
  }
}
```

**Gmail**
```javascript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
}
```

## 🎨 UI 设计理念

### 色彩方案
- **主色调**：渐变紫色 (#667eea → #764ba2)
- **辅助色**：温暖粉色 (#f093fb → #f5576c)
- **背景色**：白色 (#ffffff)
- **文字色**：深灰 (#333333)

### 设计特点
- **极简主义**：去除冗余元素，突出核心功能
- **温暖感**：柔和的渐变色和圆角设计
- **高级感**：大量留白、精致阴影、流畅动画
- **呼吸动画**：主标题的缓慢缩放效果
- **淡入淡出**：页面切换和元素加载的平滑过渡

### 响应式设计
- 桌面端：最大宽度 800px，居中显示
- 平板端：自适应布局调整
- 移动端：单列布局，触摸友好

## 🔧 API 接口文档

### 认证接口

#### 注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **参数**:
  ```json
  {
    "email": "user@example.com",
    "phone": "13800138000",
    "password": "password123",
    "username": "用户名"
  }
  ```

#### 登录
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **参数**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### 签到接口

#### 每日签到
- **URL**: `/api/checkin`
- **方法**: `POST`
- **认证**: 需要 JWT Token
- **参数**:
  ```json
  {
    "status": "很好",
    "message": "今天心情不错"
  }
  ```

#### 获取签到统计
- **URL**: `/api/checkin/stats`
- **方法**: `GET`
- **认证**: 需要 JWT Token

### 联系人接口

#### 添加联系人
- **URL**: `/api/contacts`
- **方法**: `POST`
- **认证**: 需要 JWT Token
- **参数**:
  ```json
  {
    "contactName": "张三",
    "contactEmail": "zhangsan@example.com",
    "contactPhone": "13800138000"
  }
  ```

#### 获取联系人列表
- **URL**: `/api/contacts`
- **方法**: `GET`
- **认证**: 需要 JWT Token

#### 删除联系人
- **URL**: `/api/contacts/:id`
- **方法**: `DELETE`
- **认证**: 需要 JWT Token

## 🔐 安全性

- 密码使用 bcrypt 加密存储
- JWT Token 认证机制
- SQL 注入防护（使用参数化查询）
- XSS 防护（输入验证和输出转义）
- CORS 跨域配置

## 🎯 使用场景

1. **独居老人**：让子女及时了解父母状态
2. **独自旅行**：让家人朋友知道你的安全
3. **慢性病患者**：定期报告健康状况
4. **远程工作者**：与团队保持联系
5. **心理健康**：记录每日情绪状态

## 🛠️ 扩展功能建议

- [ ] 微信小程序版本
- [ ] 移动端 App
- [ ] 地理位置签到
- [ ] 照片/视频签到
- [ ] 群组功能
- [ ] 紧急联系按钮
- [ ] 健康数据集成
- [ ] AI 情绪分析
- [ ] 数据导出功能
- [ ] 多语言支持

## 📝 开发日志

### v1.0.0 (2024)
- ✅ 用户注册/登录系统
- ✅ 每日签到功能
- ✅ 联系人管理
- ✅ 邮件/短信通知
- ✅ 定时任务检查
- ✅ 数据统计面板
- ✅ 响应式 UI 设计

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

ISC License

## 💡 灵感来源

这个项目的灵感来自于对独居人群的关怀，希望通过简单的每日签到，让远方的亲友能够安心，也让用户感受到被关心的温暖。

---

**愿每个人都能被温柔以待，愿每个生命都被看见。** ❤️
