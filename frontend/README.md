# Mental Wellness App - Mobile Frontend

A production-grade mobile app built with **React Native** and **Expo (TypeScript)** featuring file-based routing (`expo-router`), biometric authentication, offline/caching state via **TanStack React Query**, session persistence with **Zustand** and **Expo SecureStore**, Bézier trend visualization with **react-native-gifted-charts**, and clinical privacy controls.

---

## 📱 Features

- **File-Based Routing (`expo-router`)**:
  - `(auth)/`: Login and Register screens with validation, password toggles, and privacy controls.
  - `(tabs)/`:
    - `index.tsx` (Today's Pulse): Friendly greetings, streak badge ("🔥 5-Day Streak"), 1-tap quick mood picker (Joy, Calm, Overwhelmed, Sad, Anxious), daily reflection prompts, and today's vertical logs.
    - `timeline.tsx` (Diary Feed): Real-time keyword & tag search, emotion filters, chronological cards, and detailed entry expansion modals with deletion capability.
    - `analytics.tsx` (Insights & Trends): 7d / 30d toggle, Bézier LineChart (`react-native-gifted-charts`) for valence trajectories, emotion distribution breakdown, and frequent trigger correlations.
    - `profile.tsx` (Settings & AI Preview): User profile, Biometric Face ID / Touch ID lock toggle, "Share raw notes with Superadmin" privacy toggle, and AI Weekly Reflection preview.
  - `modal/log-emotion.tsx`: Smooth multi-step modal with primary emotion cards, valence & intensity score selectors, journal text reflection, and quick tag pills.
  - `(admin)/`: Conditionally accessible portal guarded strictly for `superadmin` users with user directories and emotional journey reports with automated note redaction.
- **Biometric Security Lock**: App lock with Face ID / Fingerprint via `expo-local-authentication` and secure token storage via `expo-secure-store`.
- **Calm, Therapeutic Theme**: Tailored color palette of deep slates, sage greens, warm ambers, and soft lavenders.
- **Robust API Client**: Axios with automatic JWT Bearer interceptor and 401 session recovery.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js 18+
- Expo Go app on iOS/Android or an emulator

### 2. Configure Environment
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Set `EXPO_PUBLIC_API_URL` based on your runtime:
- **iOS Simulator / Web**: `http://localhost:5000/api`
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **Physical Phone with Expo Go**: `http://<YOUR_LOCAL_IP>:5000/api` (e.g., `http://192.168.1.105:5000/api`)

### 3. Start Development Server
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run in Web browser
npm run web
```

---

## 📁 Architecture Overview

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # Login with email/pass & biometric prompt
│   │   └── register.tsx         # Sign up with name, email & privacy setting
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar navigation + Floating Action Button
│   │   ├── index.tsx            # Today's Pulse, streak, quick moods, prompt
│   │   ├── timeline.tsx         # Diary feed, search, filter chips, delete
│   │   ├── analytics.tsx        # Gifted Charts Bézier lines & distribution
│   │   └── profile.tsx          # Profile, biometrics, privacy toggle, AI preview
│   ├── (admin)/
│   │   ├── _layout.tsx          # RBAC guard (superadmin only)
│   │   ├── users.tsx            # Member directory with stats & privacy status
│   │   └── [userId]/report.tsx  # User emotional journey report (with note redaction)
│   ├── modal/
│   │   └── log-emotion.tsx      # Multi-step mood recording modal
│   └── _layout.tsx              # Root layout with QueryClient & auth lock
├── components/
│   ├── BiometricLockOverlay.tsx # Biometric lock screen overlay
│   └── EmotionBadge.tsx         # Emotion pill badge with emojis & theme colors
├── services/
│   └── api.ts                   # Axios client with SecureStore token interceptor
├── store/
│   └── authStore.ts             # Zustand store for auth session & biometric lock
├── theme/
│   ├── colors.ts                # Deep slates, sage greens, ambers & lavenders
│   └── index.ts                 # Spacing, shadows, and radii tokens
└── types/
    └── index.ts                 # Full domain & API response TypeScript interfaces
```
