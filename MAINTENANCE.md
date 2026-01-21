# 《活着么》永久网站维护手册

本手册旨在指导您如何将应用部署在自己的服务器上，并确保其永久、稳定地运行。

## 🛠️ 环境准备

- **操作系统**: Ubuntu 20.04+ / Debian / CentOS (推荐 Linux)
- **运行环境**: Node.js 16.x+
- **工具**: PM2 (进程守护), SQLite3

## 🚀 一键部署

在项目根目录下执行：
```bash
chmod +x deploy.sh
./deploy.sh
```

## 🛡️ 稳定性保障机制

### 1. 进程守护 (PM2)
应用通过 PM2 管理，具备以下特性：
- **自动重启**: 进程崩溃后毫秒级自动拉起。
- **开机自启**: 服务器重启后应用自动运行。
- **内存监控**: 超过 500M 内存占用自动重启，防止内存泄漏。

**常用命令**:
- 查看状态: `pm2 status`
- 查看实时日志: `pm2 logs huozheme`
- 重启应用: `pm2 restart huozheme`
- 停止应用: `pm2 stop huozheme`

### 2. 数据持久化与备份
- **数据库**: 存储在 `./data/huozheme.db`。
- **自动备份**: `deploy.sh` 已自动配置 crontab 任务，每天凌晨 2 点备份数据库。
- **备份位置**: `./backups/` 目录下，保留最近 30 天的备份。
- **手动备份**: 执行 `./scripts/backup.sh`。

### 3. 日志管理
- **标准输出**: `./logs/out.log`
- **错误日志**: `./logs/error.log`
- **备份日志**: `./logs/backup.log`

## 🌐 域名与访问

### 1. 端口配置
生产环境默认运行在 **80 端口**。如需修改，请编辑 `ecosystem.config.js` 中的 `PORT` 字段。

### 2. 反向代理 (推荐)
建议使用 Nginx 作为反向代理，以支持 HTTPS：
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 安全建议

1. **修改密钥**: 部署前请修改 `ecosystem.config.js` 中的 `JWT_SECRET`。
2. **防火墙**: 仅开放 80/443 端口。
3. **SSL**: 使用 Let's Encrypt 配置免费的 SSL 证书。

## 🔄 版本更新

1. 拉取最新代码。
2. 执行 `npm install`。
3. 执行 `pm2 restart huozheme`。

---
**愿您的应用永远在线，温暖每一个关心的人。** ❤️
