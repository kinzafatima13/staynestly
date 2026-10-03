# StayNestly

A Booking.com-style hotel booking website built with Next.js (App Router), React, Tailwind CSS, TypeScript, and Firebase (Auth, Firestore, Storage). No payments. Guests can browse and book stays. Hosts can add and manage properties.

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Tailwind CSS 3
- TypeScript 5
- Firebase: Auth, Firestore, Storage

## Features
- Email/password auth (signup/login)
- Role-based access: `guest` vs `host`
- Browse/search properties by city
- View property details
- Book a property (stored in Firestore)
- Dashboard for guests (bookings) and hosts (properties)
- Hosts can add properties with image uploads (Storage)

## Getting Started

1. Clone and install
```
npm install
```

2. Copy environment variables
```
cp .env.local.example .env.local
```
Fill in values from Firebase console.

3. Run dev server
```
npm run dev
```
Visit http://localhost:3000

## Firebase Setup
1. Create a project at https://console.firebase.google.com
2. Enable Email/Password in Authentication
3. Create Cloud Firestore (in production or test mode)
4. Enable Storage
5. Get your web app config and paste into `lib/firebase.ts` via `.env.local`

### Sample Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /properties/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /bookings/{id} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Sample Storage Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /properties/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Firestore Data Model
- `/users/{uid}`: `{ name, email, role: 'guest'|'host', createdAt }`
- `/properties/{propertyId}`: `{ ownerId, title, city, description, price, rating, amenities[], images[], createdAt }`
- `/bookings/{bookingId}`: `{ userId, propertyId, checkIn, checkOut, guests, status, createdAt }`

## Project Structure
- `app/` pages: Home, Search, Hotel Detail, Booking, Dashboard, Host Add Property, Auth
- `components/` shared UI components
- `lib/` Firebase client and auth helpers
- `context/` Auth provider
- `styles/` Tailwind globals

## Notes
- This is a college project reference; UX kept simple and responsive.
- Replace Unsplash/Picsum images with your own as desired.
