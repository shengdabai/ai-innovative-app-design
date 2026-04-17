# API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **认证方式**: Bearer Token (JWT)
- **Content-Type**: `application/json`

## 认证相关

### 注册
```
POST /auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "健身达人",
  "profile": {
    "gender": "MALE",
    "height": 175,
    "weight": 70,
    "fitnessGoal": "LOSE_WEIGHT",
    "activityLevel": "MODERATE"
  }
}
```

**响应**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "健身达人"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### 登录
```
POST /auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 刷新Token
```
POST /auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### 获取当前用户
```
GET /auth/me
Authorization: Bearer {accessToken}
```

## 用户管理

### 更新资料
```
PUT /users/profile
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "height": 180,
  "weight": 75,
  "targetWeight": 70,
  "fitnessGoal": "LOSE_WEIGHT",
  "activityLevel": "ACTIVE"
}
```

### 获取统计
```
GET /users/stats
Authorization: Bearer {accessToken}
```

### 更新订阅
```
PUT /users/subscription
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "plan": "MONTHLY"
}
```

## 饮食记录

### 创建饮食记录
```
POST /diet/meals
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**表单数据**:
- `mealType`: BREAKFAST | LUNCH | DINNER | SNACK
- `image`: 图片文件 (可选)
- `notes`: 备注 (可选)

### 获取饮食记录
```
GET /diet/meals?page=1&limit=20&mealType=BREAKFAST
Authorization: Bearer {accessToken}
```

### 获取今日汇总
```
GET /diet/summary
Authorization: Bearer {accessToken}
```

### 获取每日汇总
```
GET /diet/summary/:date
Authorization: Bearer {accessToken}
```

**参数**:
- `date`: YYYY-MM-DD 格式

### 获取饮食趋势
```
GET /diet/trends?days=30
Authorization: Bearer {accessToken}
```

### 获取营养建议
```
GET /diet/advice
Authorization: Bearer {accessToken}
```

## 菜单计划

### 创建菜单计划
```
POST /menu/plans
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "name": "减脂周计划",
  "startDate": "2024-01-15",
  "days": 7,
  "availableIngredients": ["鸡胸肉", "西兰花", "鸡蛋"]
}
```

### 获取菜单计划
```
GET /menu/plans
Authorization: Bearer {accessToken}
```

### 获取菜谱详情
```
GET /menu/recipes/:id
Authorization: Bearer {accessToken}
```

### 搜索菜谱
```
GET /menu/recipes?q=鸡胸肉&taste=LIGHT&maxCalories=500
Authorization: Bearer {accessToken}
```

## 数据分析

### 获取仪表盘
```
GET /analytics/dashboard
Authorization: Bearer {accessToken}
```

**响应**:
```json
{
  "overview": {
    "currentWeight": 70.5,
    "weightChange": -0.9,
    "weightTrend": "down",
    "daysToGoal": 30,
    "targetWeight": 65
  },
  "nutrition": {
    "todayCalories": 1500,
    "todayProtein": 80,
    "targetCalories": 2000,
    "targetProtein": 100
  },
  "activity": {
    "checkInStreak": 7,
    "mealsThisWeek": 18,
    "workoutsThisWeek": 3
  },
  "progress": {
    "weightProgress": 65,
    "calorieProgress": 75
  }
}
```

### 记录体重
```
POST /analytics/weight
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "weight": 70.5,
  "bodyFat": 18.5,
  "notes": "感觉不错"
}
```

### 记录运动
```
POST /analytics/workout
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "workoutType": "running",
  "duration": 30,
  "caloriesBurned": 300,
  "notes": "配速5:30"
}
```

### 记录饮水
```
POST /analytics/water
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "amount": 250
}
```

### 获取体重趋势图表
```
GET /analytics/weight-chart?days=30
Authorization: Bearer {accessToken}
```

### 获取营养摄入图表
```
GET /analytics/nutrition-chart?days=30
Authorization: Bearer {accessToken}
```

## AI 对话

### 发送消息
```
POST /chat/send
Authorization: Bearer {accessToken}
```

**请求体**:
```json
{
  "message": "我今天应该吃什么？"
}
```

### 获取聊天历史
```
GET /chat/history?limit=50
Authorization: Bearer {accessToken}
```

### 清除聊天历史
```
DELETE /chat/history
Authorization: Bearer {accessToken}
```

### 获取快捷建议
```
GET /chat/suggestions
Authorization: Bearer {accessToken}
```

## 成就系统

### 获取所有成就
```
GET /achievements/list
```

### 获取我的成就
```
GET /achievements/my
Authorization: Bearer {accessToken}
```

### 获取成就统计
```
GET /achievements/stats
Authorization: Bearer {accessToken}
```

### 检查并解锁成就
```
POST /achievements/check
Authorization: Bearer {accessToken}
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

**错误响应格式**:
```json
{
  "success": false,
  "error": "错误信息",
  "message": "用户友好提示"
}
```

## 分页

所有列表接口支持分页：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| page | 页码 | 1 |
| limit | 每页数量 | 20 |

**分页响应格式**:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```
