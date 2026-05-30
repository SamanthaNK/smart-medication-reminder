# MedMate

**A smart medication reminder system for patients across Cameroon — with caregiver alerts, voice reminders, and clinic oversight.**

> Built as a school project.

---

## What Is This?

MedMate helps patients take their medication on time. It speaks reminders aloud, works offline, notifies caregivers when doses are missed, and gives clinic staff a live adherence dashboard.

Three moving parts:

| Part | Tech | URL |
|------|------|-----|
| Mobile app (patient/caregiver) | React Native + Expo | [medmate-app.com](https://medmate-app.com) |
| Web portal (clinic/admin) | React + Vite + Tailwind | [medmate-app.com](https://medmate-app.com) |
| REST API | Node.js + Express + Supabase | [api.medmate-app.com](https://api.medmate-app.com) |

---

## Features

**For patients**
- Daily local push notifications at each scheduled dose time
- Voice reminder read aloud at dose time (TTS or prerecorded MP3)
- Morning briefing at 7 AM summarising the full day's medications
- Confirm doses by tap or voice ("Yes" / "No")
- Offline-first: confirmations queue locally and sync when back online

**For caregivers**
- Real-time alerts when a patient misses a dose (push + email)
- View linked patients' adherence scores and full dose history
- Add medications for patients
- Link/unlink with patients by email request

**For clinic staff & admins**
- Web dashboard with all patients ranked by adherence tier (Green / Amber / Red)
- Weekly digest email every Sunday night
- Admin can verify clinic staff accounts
- Full audit log of medication changes

---

## API Docs

Full Postman documentation: **[View on Postman](https://documenter.getpostman.com/view/49640730/2sBXwntBtz)**

Base URL: `https://api.medmate-app.com/v1`

---

**Key rules baked in:**
- Sensitive fields (names, cities) encrypted at rest with AES-256-CBC
- Env vars validated on startup — missing vars crash fast, not silently
- ES Modules throughout (`type: module`)
- Backend is API-only; mobile and web are UI-only
- Local notifications work fully offline; FCM is additive

---

## Roles

| Role | Platform | Can do |
|------|----------|--------|
| `patient` | Mobile app | Manage own medications, confirm/miss doses |
| `caregiver` | Mobile app | View linked patients, receive alerts |
| `clinic_staff` | Web portal | View all patients, dose history, risk scores |
| `admin` | Web portal | Everything + verify clinic accounts |

Clinic staff accounts require admin approval before login is permitted.

---
## Download

Android APK: **[medmate-app.com](https://medmate-app.com)**

> iOS not supported. Neither is excuses for missing meds.

## Stack

- **Backend:** Node.js, Express.js
- **Database** Supabase (PostgreSQL)
- **Mobile:** React Native
- **Web:** React Vite, Tailwind CSS
- **Infra:** Firebase (FCM), Gmail SMTP

---

## License

MIT. Built for a school project.