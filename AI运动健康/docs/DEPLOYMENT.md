# 部署指南

## 环境要求

### 开发环境
- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6
- npm 或 yarn

### 生产环境
- Docker & Docker Compose
- 云服务器 (推荐 2核4G 及以上)
- 域名 (可选)

## 本地开发

### 1. 克隆项目
```bash
git clone <repository-url>
cd AI运动健康
```

### 2. 配置后端
```bash
cd backend
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，填入必要的配置
nano .env
```

### 3. 初始化数据库
```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# (可选) 填充测试数据
npm run seed
```

### 4. 启动后端
```bash
npm run start:dev
```

### 5. 配置前端
```bash
cd ../frontend
npm install

# 配置环境变量
echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1" > .env
```

### 6. 启动前端
```bash
npm start
```

## Docker 部署

### 1. 准备环境变量
创建 `.env` 文件：
```bash
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
OPENAI_API_KEY=sk-your-openai-api-key
GOOGLE_CREDENTIALS_BASE64=your-google-credentials-base64
FRONTEND_URL=http://localhost:19006
```

### 2. 启动服务
```bash
docker-compose up -d
```

### 3. 初始化数据库
```bash
# 进入后端容器
docker exec -it ai-fitness-backend sh

# 运行迁移
npx prisma migrate deploy

# 生成 Prisma Client
npx prisma generate

# (可选) 初始化成就
curl -X POST http://localhost:3000/api/v1/achievements/initialize
```

### 4. 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
```

### 5. 停止服务
```bash
docker-compose down
```

## 云服务器部署

### 使用 Vercel (推荐用于后端)

1. 将后端代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 使用 Railway (支持数据库)

1. 在 Railway 创建新项目
2. 添加 PostgreSQL 和 Redis 服务
3. 部署后端代码
4. 配置环境变量

### 使用 AWS/阿里云

#### 后端部署
1. 使用 ECS 或 EC2 部署 Docker 容器
2. 配置 RDS PostgreSQL 和 ElastiCache Redis
3. 使用 ALB/NLB 做负载均衡

#### 前端部署
1. 使用 Expo Application Services (EAS)
2. 构建并发布到应用商店

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 配置 EAS
eas build:configure

# 构建 Android APK
eas build --platform android

# 构建 iOS IPA
eas build --platform ios
```

## 数据库备份

### 备份
```bash
# 使用 Docker
docker exec ai-fitness-postgres pg_dump -U postgres ai_fitness > backup.sql

# 直接连接
pg_dump -U postgres -h localhost ai_fitness > backup.sql
```

### 恢复
```bash
# 使用 Docker
docker exec -i ai-fitness-postgres psql -U postgres ai_fitness < backup.sql

# 直接连接
psql -U postgres -h localhost ai_fitness < backup.sql
```

## 监控和日志

### 健康检查
```bash
# 基础健康检查
curl http://localhost:3000/health/simple

# 详细健康检查
curl http://localhost:3000/health
```

### 日志查看
```bash
# Docker 日志
docker-compose logs -f backend

# 应用日志 (在容器内)
docker exec ai-fitness-backend tail -f /dev/stdout
```

## 性能优化

1. **启用 Redis 缓存**：减少数据库查询
2. **数据库连接池**：配置合理的连接数
3. **CDN 加速**：静态资源使用 CDN
4. **负载均衡**：多实例部署

## 安全建议

1. 修改默认 JWT 密钥
2. 启用 HTTPS
3. 配置防火墙规则
4. 定期更新依赖包
5. 设置数据库访问权限
