# Emotion Diary & Mental Wellness Backend API

A production-ready, modular Node.js/Express backend in TypeScript using MongoDB (Mongoose) with Role-Based Access Control (RBAC), advanced emotion analytics, and administrative privacy controls.

---

## 🚀 Features

- **TypeScript Architecture**: Strict typing across models, requests, and controllers.
- **Role-Based Access Control (RBAC)**: Support for `user` and `superadmin` roles.
  - Public registration strictly enforces `role: 'user'`.
  - Superadmin endpoints are isolated and guarded by JWT and role middleware.
- **Privacy-Aware Data Governance**:
  - Configurable `privacySettings.shareNotesWithAdmin` per user.
  - When disabled, superadmin emotional journey reports automatically mask raw personal notes (`[REDACTED]`) while preserving valence, intensity, tags, and trends.
- **High-Performance MongoDB Aggregations**:
  - Daily trend aggregation pipeline calculating average valence, average intensity, entry count, and dominant emotions.
  - Distribution aggregations for frontend pie/bar charts.
  - Compound indexing `{ userId: 1, loggedAt: -1 }` for high-throughput queries.
- **Security & Reliability**:
  - Passwords hashed with bcrypt.
  - Hardened with Helmet HTTP headers, CORS, and centralized error handling (Mongoose validations, duplicate key errors, CastErrors, and JWT token expirations).

---

## 📁 Project Structure

```
backend/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── config/
    │   └── db.ts                   # Mongoose connection & shutdown handlers
    ├── controllers/
    │   ├── adminController.ts     # Superadmin user lists & privacy-safe reports
    │   ├── analyticsController.ts # Aggregation pipelines (trends & distribution)
    │   ├── authController.ts      # Register, login, me
    │   └── entryController.ts     # CRUD for personal emotion diary entries
    ├── middleware/
    │   ├── auth.ts                # authenticateToken & requireRole('superadmin')
    │   └── errorHandler.ts        # AppError, 404 handler, global error handler
    ├── models/
    │   ├── Entry.ts               # Mongoose schema for emotion diary entries
    │   └── User.ts                # Mongoose schema for user accounts & privacy
    ├── routes/
    │   ├── adminRoutes.ts         # /api/admin
    │   ├── analyticsRoutes.ts     # /api/analytics
    │   ├── authRoutes.ts          # /api/auth
    │   └── entryRoutes.ts         # /api/entries
    ├── scripts/
    │   └── seedSuperadmin.ts      # Bootstrap CLI script for superadmin user
    ├── types/
    │   └── index.ts               # Custom Express request types
    └── index.ts                   # Express server bootstrap
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your MongoDB URI and secret keys:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mental_wellness?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_here
NODE_ENV=development
```

### 3. (Optional) Seed Superadmin
To seed an initial superadmin user:
```bash
npm run seed:admin
```
Optional environment overrides for seeding:
`SUPERADMIN_NAME`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`.

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📡 API Reference

### Health Checks
- `GET /health`: Basic server uptime and health.
- `GET /api/health`: Service version and status.

---

### Authentication (`/api/auth`)

#### 1. Register User
- **`POST /api/auth/register`**
- **Public access** (strictly registers as `role: 'user'`)
- **Body**:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPassword123!",
  "privacySettings": {
    "shareNotesWithAdmin": false
  }
}
```
- **Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "67a...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "privacySettings": { "shareNotesWithAdmin": false },
    "createdAt": "2026-10-12T15:00:00.000Z"
  }
}
```

#### 2. Login User
- **`POST /api/auth/login`**
- **Public access**
- **Body**:
```json
{
  "email": "jane@example.com",
  "password": "StrongPassword123!"
}
```
- **Response (200)**: Returns JWT token and user profile.

#### 3. Current User Profile
- **`GET /api/auth/me`**
- **Headers**: `Authorization: Bearer <token>`
- **Response (200)**: Returns user details.

---

### Emotion Diary Entries (`/api/entries`)
*All entry routes require `Authorization: Bearer <token>`.*

#### 1. Create Entry
- **`POST /api/entries`**
- **Body**:
```json
{
  "emotion": {
    "primary": "anxious",
    "valenceScore": 2,
    "intensityScore": 4,
    "subEmotions": ["worried", "restless"]
  },
  "note": "Felt stressed before the team presentation today.",
  "tags": ["work", "presentation"],
  "triggers": ["public speaking"],
  "loggedAt": "2026-10-12T10:30:00.000Z"
}
```

#### 2. List Paginated Entries
- **`GET /api/entries?page=1&limit=20&tag=work&emotion=anxious&startDate=2026-10-01&endDate=2026-10-12`**
- **Response (200)**:
```json
{
  "success": true,
  "entries": [ ... ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### 3. Get Entry by ID
- **`GET /api/entries/:id`**

#### 4. Delete Entry
- **`DELETE /api/entries/:id`**

---

### Analytics (`/api/analytics`)
*All analytics routes require `Authorization: Bearer <token>`.*

#### 1. Trends Over Time
- **`GET /api/analytics/trends?period=7d|30d`**
- **Response (200)**:
```json
{
  "success": true,
  "period": "7d",
  "summary": {
    "totalEntries": 14,
    "overallAvgValence": 3.71,
    "overallAvgIntensity": 3.20,
    "activeDays": 6
  },
  "trends": [
    {
      "date": "2026-10-10",
      "entryCount": 3,
      "avgValence": 4.33,
      "avgIntensity": 2.67,
      "dominantEmotion": "calm",
      "dominantEmotionCount": 2,
      "emotionsRecorded": ["calm", "joy", "calm"]
    }
  ]
}
```

#### 2. Emotion Distribution
- **`GET /api/analytics/distribution`**
- **Response (200)**:
```json
{
  "success": true,
  "totalEntries": 25,
  "distribution": [
    {
      "emotion": "joy",
      "count": 10,
      "percentage": 40.0,
      "avgValence": 4.8,
      "avgIntensity": 3.9
    },
    {
      "emotion": "calm",
      "count": 8,
      "percentage": 32.0,
      "avgValence": 4.2,
      "avgIntensity": 2.1
    }
  ]
}
```

---

### Superadmin Endpoints (`/api/admin`)
*Requires `Authorization: Bearer <token>` of a user with `role: 'superadmin'`.*

#### 1. List Regular Users with Stats
- **`GET /api/admin/users`**
- Returns all users with `role: 'user'`, their total check-in count, and their last check-in date.

#### 2. User Emotional Journey Report
- **`GET /api/admin/users/:targetUserId/report?period=day|week|month`**
- Returns comprehensive daily aggregations and chronological log entries.
- **Privacy Enforcement**:
  - If `privacySettings.shareNotesWithAdmin` is `false`:
    - `note` string is masked with `"[REDACTED - USER PRIVACY SETTING ACTIVE]"`
    - `noteMasked: true`
    - All numerical scores (`valenceScore`, `intensityScore`), tags, and triggers remain available for therapeutic oversight.
