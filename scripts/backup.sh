#!/bin/bash

# 活着么 - 数据库自动备份脚本
# 建议通过 crontab 每天执行一次

# 配置
BACKUP_DIR="/home/ubuntu/huozheme/backups"
DB_FILE="/home/ubuntu/huozheme/data/huozheme.db"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/huozheme_$DATE.db"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份 (使用 sqlite3 的 .backup 命令确保数据一致性)
if [ -f "$DB_FILE" ]; then
    sqlite3 $DB_FILE ".backup '$BACKUP_FILE'"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    
    # 删除 30 天前的旧备份
    find $BACKUP_DIR -name "huozheme_*.db.gz" -mtime +30 -delete
    
    echo "[$DATE] 数据库备份成功: $BACKUP_FILE.gz"
else
    echo "[$DATE] 错误: 找不到数据库文件 $DB_FILE"
    exit 1
fi
