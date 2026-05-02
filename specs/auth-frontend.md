# User Story — Frontend Authentication (Phone OTP)

## Story
As a farmer, I want to register and log in using my phone number and a one-time code
so that I can securely access the app without needing to remember a password.

---

## Acceptance Criteria

- [ ] 3 auth screens created: `PhoneScreen`, `OtpScreen`, `PinSetupScreen`
- [ ] `PhoneScreen`:
  - Phone number input with country code picker (default +212 Morocco, supports +33 France)
  - "Send Code" button calls `POST /auth/send-otp`
  - Loading state on button while request is pending
  - Error message displayed if request fails
  - On success navigates to `OtpScreen` passing the phone number
- [ ] `OtpScreen`:
  - 6-digit OTP input (individual boxes)
  - Auto-submits when 6 digits are entered
  - Countdown timer (60 seconds) with "Resend code" button after expiry
  - Calls `POST /auth/verify-otp`
  - On success navigates to `PinSetupScreen` (first login) or `HomeScreen` (returning user)
  - Error message for wrong OTP
- [ ] `PinSetupScreen`:
  - 4-digit PIN input (individual boxes)
  - Confirm PIN input (must match)
  - PIN stored encrypted in WatermelonDB locally
  - On success navigates to `HomeScreen`
- [ ] Auth state managed in a MobX `AuthStore` with:
  - `phoneNumber: string`
  - `accessToken: string | null`
  - `isAuthenticated: boolean`
  - `isLoading: boolean`
  - `error: string | null`
  - `sendOtp(phone)` action
  - `verifyOtp(phone, token)` action
  - `logout()` action
- [ ] JWT token stored securely using `expo-secure-store`
- [ ] On app launch, check if token exists in secure store → skip auth screens if valid
- [ ] Auth navigator created in `src/navigation/AuthNavigator.tsx` with the 3 screens
- [ ] Root navigator in `src/navigation/RootNavigator.tsx` switches between `AuthNavigator` and `AppNavigator` based on `AuthStore.isAuthenticated`
- [ ] Axios interceptor in `src/services/api.ts` automatically attaches Bearer token to all requests

---

## Screens & Navigation Flow

```
App Launch
    │
    ├── No token → AuthNavigator
    │       ├── PhoneScreen
    │       │       └── (success) → OtpScreen
    │       │                   └── (success, first login) → PinSetupScreen
    │       │                               └── (success) → HomeScreen
    │       └── (success, returning) → HomeScreen
    │
    └── Token exists → HomeScreen
```

---

## Folder Structure Changes

```
mobile/
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── PhoneScreen.tsx
│   │   │   ├── OtpScreen.tsx
│   │   │   └── PinSetupScreen.tsx
│   ├── stores/
│   │   ├── AuthStore.ts
│   │   └── RootStore.ts       # Add AuthStore instance here
│   ├── navigation/
│   │   ├── AuthNavigator.tsx
│   │   └── RootNavigator.tsx  # Update to handle auth/app split
```

---

## Dependencies to Install

- `expo-secure-store`
- `react-native-country-picker-modal`

---

## i18n Keys to Add

Add these to `fr.json`, `ar.json`, `darija.json`:
```json
{
  "auth": {
    "enterPhone": "Entrez votre numéro de téléphone",
    "sendCode": "Envoyer le code",
    "enterOtp": "Entrez le code reçu",
    "resendCode": "Renvoyer le code",
    "setupPin": "Créez votre code PIN",
    "confirmPin": "Confirmez votre code PIN",
    "pinMismatch": "Les codes PIN ne correspondent pas",
    "invalidOtp": "Code incorrect ou expiré"
  }
}
```

---

## Out of Scope
- No biometric login (Face ID / fingerprint)
- No social login
- No forgot PIN flow
- No profile setup screen

---

## Definition of Done
- Farmer can enter phone number, receive OTP, enter it, set a PIN and land on HomeScreen
- JWT token is stored securely and persists across app restarts
- All API calls after login automatically include the Bearer token
