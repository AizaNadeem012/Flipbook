# Admin Account Setup Guide

## Quick Start

### Option 1: Auto-Confirmed Email (Recommended)

If you have your Supabase **Service Role Key**, you can skip email confirmation:

1. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sk_...
   ```
   *(Find this in Supabase Dashboard → Settings → API Keys)*

2. Run:
   ```bash
   npm run create-admin
   ```

3. Login immediately at `/auth`:
   - Email: `admin@folio.local` (or your `ADMIN_EMAIL`)
   - Password: `Admin@123456` (or your `ADMIN_PASSWORD`)

---

### Option 2: Manual Email Confirmation

If you don't have the Service Role Key:

1. Run without it:
   ```bash
   npm run create-admin
   ```

2. You'll see:
   ```
   ⚠️  Email confirmation required!
   1. Check your email and click the confirmation link
   2. Return here and run this script again
   ```

3. Confirm your email, then:
   ```bash
   npm run create-admin
   ```

---

### Option 3: Disable Email Confirmation in Supabase

In your **Supabase Dashboard**:
1. Go to **Project Settings** → **Email Templates**
2. Disable email confirmation requirement
3. Run: `npm run create-admin`
4. Admin ready immediately!

---

## Custom Admin Credentials

Set in `.env` or `.env.local`:

```env
ADMIN_EMAIL=yourname@company.com
ADMIN_PASSWORD=YourSecurePassword123!
```

---

## Changing Admin Password

After login, admin can change their password using:

```typescript
import { changePassword } from '@/lib/auth'

// In an admin settings page or form
await changePassword('newPassword123!')
```

Or in the **Supabase Dashboard**:
1. Go to **Authentication** → **Users**
2. Click the admin user
3. Click "Reset Password"

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Email is not confirmed" | Use Option 1 (Service Role Key) or Option 2 (click confirmation link) |
| "User already exists" | Admin account already created; just login at `/auth` |
| "Admin already exists" | Only the first user can become admin; login with existing credentials |
| Can't find Service Role Key | Check Supabase Dashboard → Settings → API Keys (under "secret") |

---

## Security Notes

- ✅ Default password `Admin@123456` should be changed immediately after first login
- ✅ Service Role Key must be kept secret (use `.env.local`, never commit to git)
- ✅ Email confirmation adds security; use it in production
