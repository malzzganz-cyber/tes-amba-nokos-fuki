# Malzz Nokos 🚀

Platform cepat & simpel untuk membeli nomor virtual & menerima OTP otomatis.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file `.env.local`
Copy dari `.env.local.example` lalu isi semua nilai:

```env
RUMAHOTP_API_KEY=isi_api_key_rumahotp_kamu

ADMIN_UID=isi_uid_firebase_akun_admin
NEXT_PUBLIC_ADMIN_UID=isi_uid_firebase_akun_admin

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Setup Firebase
- Buat project di [Firebase Console](https://console.firebase.google.com)
- Aktifkan **Authentication** (Email/Password)
- Aktifkan **Firestore Database**
- Download **Service Account** key untuk Admin SDK
- Upload `firestore.rules` ke Firestore Rules

### 4. Jalankan lokal
```bash
npm run dev
```

### 5. Deploy ke Vercel
```bash
npm run build   # pastikan build sukses dulu
```
Lalu push ke GitHub dan import di [vercel.com](https://vercel.com).
Tambahkan semua variabel `.env.local` di Vercel → Settings → Environment Variables.

---

## Struktur Folder

```
app/
  api/           → Backend API Routes (proxy RumahOTP)
  admin/         → Halaman admin (withdraw, balance)
  dashboard/     → Dashboard user
  deposit/       → Deposit QRIS
  order/         → Order nomor OTP
  history/       → Riwayat transaksi
  leaderboard/   → Top user
  support/       → Halaman support
components/      → BottomNav, StatusBadge
lib/             → Firebase, RumahOTP helper, Auth context
```

---

## Developer
**Malzz** — Malzz Nokos © 2024
