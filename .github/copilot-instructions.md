# PouletTracker — Copilot Instructions

## Project Overview
Mobile app for Moroccan chicken farmers to monitor and manage poultry lots.
Target: independent breeders in Morocco, then Francophone Africa.

## Tech Stack
### Mobile (/mobile)
- React Native + Expo (managed workflow)
- TypeScript, MobX, Axios, WatermelonDB, React Navigation v7
- Firebase FCM (push), react-native-html-to-pdf

### Backend (/backend)
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL via Supabase
- REST API, hosted on Fly.io

### Services (free tiers only)
- Supabase: PostgreSQL + Phone OTP Auth + Storage
- Meta WhatsApp Cloud API: alerts & reminders
- Firebase FCM, Cloudinary, Sentry

## Coding Rules
- Always TypeScript strict mode
- Offline-first: write to WatermelonDB first, sync when online
- API responses: { success: boolean, data: T, error?: string }
- async/await only, never .then() chains
- Zod validation on backend
- Max 150 lines per component file
- MobX for all global state
- i18next for all strings (FR/AR/Darija)

## Business Rules
- Phone OTP only (no email) via Supabase Auth
- Moroccan Dirham (DH/MAD) for all prices
- Free plan: max 1 active lot
- Pro: 150-300 DH/month

## Domain Terms
- Lot: batch of chicks from entry to sale
- IC: feed kg / live weight kg (target < 1.8)
- GMQ: daily weight gain in grams
- Poulailler: chicken coop
- Souche: breed (Ross 308, Cobb 500, Hubbard)

## Build Order
1. Auth → 2. Farm/Coop → 3. Lot → 4. Daily Entry
5. Vaccination → 6. KPI Dashboard → 7. PDF Report

## Never
- No email auth, no Redux, no hardcoded strings, no IoT in MVP