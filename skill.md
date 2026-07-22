# BADNITY Development Skill

Version: 1.0

Project:
BADNITY - Badminton Group Management System

---

## Mission

Build a production-ready badminton management platform.

The application must be

- Fast
- Beautiful
- Easy to use
- Highly scalable
- Realtime
- Mobile Friendly
- Maintainable

Never build demo-quality software.

Everything must be production ready.

---

# Tech Stack

Frontend

- HTML5
- Bootstrap 5.3
- Vanilla JavaScript (ES2024+)
- Firebase SDK v11
- SweetAlert2
- Select2
- FontAwesome
- DataTables
- SortableJS
- Luxon

Backend (Firebase Spark — free, no card)

- Firebase Authentication
- Firestore
- Realtime Database

No Cloud Functions and no Cloud Storage on Spark. Server-side logic lives in services/ + Security Rules. See docs/10-cloud-functions.md.

Hosting

- Cloudflare Pages (frontend, static)
- Firebase/GCP Spark (backend: Firestore, Auth, RTDB)

CDN

- Cloudflare

Config at deploy comes from env vars via scripts/gen-config.js. See docs/13-deployment.md.

Analytics

- Google Analytics
- Firebase Analytics

---

# Coding Style

Use

- const first
- let only when necessary
- async/await
- arrow function
- camelCase

Never use

- var
- jQuery
- inline javascript
- duplicated code

---

# Architecture

Always use modular architecture.

Never create one giant JS file.

Folder structure

src/

components/

pages/

services/

models/

firebase/

config/

utils/

constants/

Each page owns its own JS.

Business logic belongs in services.

Firestore logic belongs in firebase/.

Never access Firestore directly inside UI.

No hooks/ folder. This is vanilla JS, not React. Reusable subscribe/lifecycle logic goes in services/ or utils/.

utils/ splits into domain files (date-utils.js, money-utils.js). Never one giant utils.js.

See docs/15-coding-standard.md for the full folder rules.

---

# UI Design

Apple inspired

Modern

Minimal

Responsive

Rounded Corner

Soft Shadow

Blue Theme

Dark Mode

Light Mode

Smooth Animation

Accessible

Keyboard Friendly

Thai first. UI strings live in constants/strings.th.js, never hardcoded. Structure ready for strings.en.js later.

See docs/07-ui-design-system.md for design tokens and i18n.

---

# Database

Prefer Firestore.

Realtime Database only for

- live queue
- timer
- realtime state

Firestore stores

- player
- match
- payment
- report
- history

Never duplicate data.

Always design indexes.

---

# Authentication

Google Login

Role

Admin

Staff

Viewer

Use Firestore Security Rules.

Never trust frontend validation.

---

# Match Algorithm

Priority

1 Waiting Time

2 Level Similarity

3 Avoid same teammate

4 Avoid same opponent

5 Fair Rotation

6 Fatigue

7 Player Request

Algorithm must generate the highest score combination.

---

# Performance

Realtime Listener

Lazy Load

Pagination

Debounce

Cache

Offline Support

Avoid unnecessary reads.

Batch update whenever possible.

---

# Error Handling

Never ignore exceptions.

Always

try

catch

Display friendly message.

Log technical details separately.

---

# Naming Convention

Files

player-service.js

queue-service.js

match-service.js

Components

PlayerCard

QueueTable

WaitingTimer

Functions

calculateWaitingTime()

generateMatch()

updateQueue()

Variables

currentPlayers

waitingQueue

matchHistory

---

# Git

Small Commit

Meaningful Commit Message

Never mix unrelated changes.

---

# Documentation

Every service

Every component

Every complex algorithm

must contain documentation.

---

# Testing

Test every feature.

Never merge broken code.

---

# Security

Validate everything.

Sanitize input.

Escape output.

Never expose Firebase Admin credentials.

Never hardcode secrets.

Client is static vanilla JS with no bundler. Deploy generates config.js from env vars (scripts/gen-config.js).

Client Firebase config lives in gitignored src/config/config.js (see docs/08-security.md).

On Spark there are no server secrets (no Functions). Role lives in Firestore users/{uid}.role, read by Rules via get(), mirrored to RTDB /roles/{uid}. No custom claims.

---

# Development Philosophy

Readable code > Clever code

Maintainability > Short code

Scalability > Temporary fix

User Experience > Developer Convenience

Correctness > Speed of coding
