# User Story — Frontend Initial Setup

## Story

As a developer, I want to set up the initial React Native Expo project structure so that I have
a clean, configured and runnable mobile app ready to receive future screens and business logic.

---

## Acceptance Criteria

- [ ] Expo project initialized inside a `/mobile` folder using `npx create-expo-app` with TypeScript template
- [ ] Folder structure created manually under `src/`: `screens`, `components`, `navigation`, `stores`, `services`, `utils`, `database`
- [ ] React Navigation v7 installed and configured with a basic stack navigator
- [ ] A single placeholder screen `HomeScreen` created that displays "PoultryTrack" text centered
- [ ] MobX and mobx-react-lite installed
- [ ] A placeholder `RootStore` created in `src/stores/RootStore.ts` with an empty structure
- [ ] Axios installed and a base API client created in `src/services/api.ts` with a configurable `BASE_URL` from env
- [ ] WatermelonDB installed and initialized with an empty database setup in `src/database/`
- [ ] `react-native-dotenv` or `expo-constants` configured to handle environment variables
- [ ] `.env.example` committed with `API_URL` variable
- [ ] i18next and react-i18next installed with 3 language files created: `fr.json`, `ar.json`, `darija.json` each with a placeholder key `welcome`
- [ ] `i18n.ts` config file created in `src/utils/` initializing i18next with French as default language
- [ ] `.gitignore` configured to exclude `node_modules`, `.env`
- [ ] App runs without errors with `npx expo start`

---

## Folder Structure Expected

```
mobile/
├── src/
│   ├── screens/
│   │   └── HomeScreen.tsx       # Placeholder screen
│   ├── components/              # Empty for now
│   ├── navigation/
│   │   └── RootNavigator.tsx    # Basic stack navigator
│   ├── stores/
│   │   └── RootStore.ts         # Empty MobX root store
│   ├── services/
│   │   └── api.ts               # Axios base client
│   ├── database/
│   │   └── index.ts             # WatermelonDB initialization
│   └── utils/
│       └── i18n.ts              # i18next configuration
├── assets/
│   └── locales/
│       ├── fr.json
│       ├── ar.json
│       └── darija.json
├── .env.example
├── .gitignore
├── app.json
├── App.tsx                      # Entry point, wraps NavigationContainer
├── package.json
└── tsconfig.json
```

---

## Environment Variables Required (`.env.example`)

```
API_URL=http://localhost:3000
```

---

## Dependencies to Install

### Navigation

- `@react-navigation/native`
- `@react-navigation/native-stack`
- `react-native-screens`
- `react-native-safe-area-context`

### State Management

- `mobx`
- `mobx-react-lite`

### HTTP Client

- `axios`

### Offline Database

- `@nozbe/watermelondb`
- `@nozbe/with-observables`

### Internationalization

- `i18next`
- `react-i18next`

---

## Out of Scope (not in this task)

- No authentication screens
- No real WatermelonDB models (just initialization)
- No real API calls
- No push notification setup
- No real navigation screens beyond placeholder
- No Supabase integration

---

## Definition of Done

Running `npm run android` in the `/mobile` folder launches the app without errors
and displays the `HomeScreen` with the text "PoultryTrack" centered on screen.
