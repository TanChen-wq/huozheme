FROM node:18-slim

# 安装 SQLite3 依赖
RUN apt-get update && apt-get install -y python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建数据目录并设置权限
RUN mkdir -p /app/data && chown -node:node /app/data

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/huozheme.db

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
