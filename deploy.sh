#!/bin/bash

echo "🚀 开始部署《活着么》永久网站方案..."

# 1. 检查环境
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    exit 1
fi

# 2. 安装 PM2 (如果未安装)
if ! command -v pm2 &> /dev/null; then
    echo "📦 正在安装进程守护工具 PM2..."
    sudo npm install -g pm2
fi

# 3. 安装依赖
echo "📥 正在安装项目依赖..."
npm install --production

# 4. 创建必要目录
mkdir -p data logs backups

# 5. 启动应用
echo "⚙️ 正在启动进程守护..."
pm2 start ecosystem.config.js --env production

# 6. 设置开机自启
echo "🔄 正在配置开机自启..."
pm2 save
# 注意：在某些系统上可能需要运行 pm2 startup 并执行返回的命令

# 7. 配置定时备份 (每天凌晨 2 点)
(crontab -l 2>/dev/null; echo "0 2 * * * /bin/bash $(pwd)/scripts/backup.sh >> $(pwd)/logs/backup.log 2>&1") | crontab -

echo "✅ 部署完成！"
echo "🌐 应用运行在端口: 80 (生产模式)"
echo "📝 日志查看: pm2 logs huozheme"
echo "📊 状态查看: pm2 status"
