# 🚀 Supabase Authentication Setup Guide

## Why Supabase?

✅ **WASM Compatible** - Works perfectly with WebAssembly  
✅ **No Redirects** - Direct authentication (no popup/tab issues)  
✅ **Free Tier** - 50,000 monthly active users free forever  
✅ **Email Verification** - Built-in email confirmation  
✅ **Password Reset** - Automatic forgot password flows  
✅ **Cross-Platform** - iOS, Android, Desktop, WASM  
✅ **PostgreSQL Database** - Store all your data in one place  

---

## 📋 Setup Steps (5 minutes)

### Step 1: Create Supabase Account (Free)

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (easiest) or email
4. Create a new organization (e.g., "Belgium Campus")

### Step 2: Create Your Project

1. Click **"New Project"**
2. Enter details:
   - **Name**: CampusLearn
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to South Africa (e.g., Frankfurt or Singapore)
   - **Pricing Plan**: Free
3. Click **"Create new project"** (takes ~2 minutes)

### Step 3: Get Your API Keys

1. Once project is ready, go to **Settings** (⚙️ gear icon)
2. Click **"API"** in the left sidebar
3. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGciOi...`)

### Step 4: Configure CampusLearn

1. Open `CampusLearn/appsettings.json`
2. Replace the placeholders:

```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "AnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZi..."
  }
}
```

### Step 5: Configure Email Templates (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Customize the templates:
   - **Confirm Signup**: Welcome message with verification link
   - **Reset Password**: Password reset instructions
   - **Magic Link**: (Optional for now)

**Example Confirmation Email:**
```
Hello {{ .Name }},

Welcome to CampusLearn™!

Please verify your Belgium Campus email address by clicking below:
{{ .ConfirmationURL }}

Happy Learning!
The CampusLearn Team
```

### Step 6: Enable Email Confirmation (Recommended)

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, enable:
   - ✅ **Enable email confirmations** (users must verify email)
3. Set **Site URL** to your app URL (for development: `http://localhost:5000`)

---

## 🧪 Testing Authentication

### Test Registration:
1. Run your app
2. Click "Sign Up"
3. Enter:
   - **Name**: Test User
   - **Email**: test@belgiumcampus.ac.za
   - **Password**: Password123
4. Check email for verification link
5. Click link to verify
6. Login with same credentials

### Test Invalid Email:
1. Try registering with: `test@gmail.com`
2. Should see error: "Only @belgiumcampus.ac.za emails are allowed"

### Test Password Reset:
1. Click "Forgot Password?"
2. Enter your email
3. Check inbox for reset link
4. Click link and set new password

---

## 🔒 Security Features Included

✅ **Email Domain Validation** - Only @belgiumcampus.ac.za allowed  
✅ **Password Hashing** - Bcrypt encryption (automatic)  
✅ **JWT Tokens** - Secure token-based auth  
✅ **Secure Storage** - Tokens stored in device secure storage  
✅ **Rate Limiting** - Prevents brute force attacks  
✅ **Email Verification** - Confirms real student emails  

---

## 📊 Free Tier Limits

- **50,000** monthly active users (MAU)
- **500 MB** database storage
- **2 GB** file storage (for profile pics, materials)
- **5 GB** bandwidth per month
- **Unlimited** API requests

**More than enough for Belgium Campus!**

---

## 🗄️ Database Setup (Next Steps)

Your Supabase project includes a PostgreSQL database. You can:

1. Store user profiles (students, tutors)
2. Store topics, forum posts, messages
3. Store learning materials metadata
4. Link everything to authenticated users

### Quick Database Tables:

```sql
-- Users are automatically managed by Supabase Auth
-- Just reference them by auth.users.id

-- Student Profiles
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  student_number TEXT,
  role TEXT DEFAULT 'Student', -- Student, Tutor, Admin
  created_at TIMESTAMP DEFAULT NOW()
);

-- Topics
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  module_code TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own student record
CREATE POLICY "Users can view own profile"
  ON students FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can view topics
CREATE POLICY "Anyone can view topics"
  ON topics FOR SELECT
  TO authenticated
  USING (true);
```

Run these in **SQL Editor** in Supabase Dashboard.

---

## 🚀 What's Implemented

✅ **User Registration** with @belgiumcampus.ac.za validation  
✅ **User Login** with email/password  
✅ **Email Verification** (automatic)  
✅ **Password Reset** (forgot password)  
✅ **Secure Token Storage** (SecureStorage/Preferences)  
✅ **User Profile** retrieval  
✅ **Auto-Login** on app restart (if token valid)  
✅ **Sign Out** functionality  

---

## 🔧 Advanced Configuration

### Custom Email Provider (SendGrid, Mailgun, etc.)

If you want custom email branding:
1. Go to **Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Configure your email provider
4. Example (SendGrid):
   - **Host**: smtp.sendgrid.net
   - **Port**: 587
   - **Username**: apikey
   - **Password**: Your SendGrid API key
   - **Sender Email**: noreply@belgiumcampus.ac.za

### Multi-Factor Authentication (MFA)

Enable in **Authentication** → **Settings** → **Multi-Factor Auth**

---

## 📱 Platform-Specific Notes

### WASM (WebAssembly)
- ✅ Works perfectly
- ✅ No CORS issues (Supabase handles it)
- ✅ SecureStorage falls back to Preferences (automatic)

### Mobile (iOS/Android)
- ✅ Uses native SecureStorage (Keychain/Keystore)
- ✅ Biometric auth possible (future enhancement)

### Desktop
- ✅ Uses Windows Credential Manager
- ✅ Full functionality

---

## 🆘 Troubleshooting

### "Failed to fetch" error
- Check internet connection
- Verify Supabase URL and API key
- Check Supabase project is running

### Email not sending
- Verify email templates are configured
- Check spam folder
- In development, emails may take a few minutes

### "Invalid email" error
- Ensure email ends with @belgiumcampus.ac.za
- Check for typos

---

## 🎓 Next Steps

1. **Add User Roles**: Distinguish between Students, Tutors, Admins
2. **Link Data**: Connect chats, topics, posts to authenticated users
3. **Add Profile Images**: Store in Supabase Storage
4. **Add Notifications**: Use Supabase Realtime for instant updates
5. **Add Analytics**: Track user engagement

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase C# Library](https://github.com/supabase-community/supabase-csharp)

---

## 💡 Why Not MSAL?

MSAL (Microsoft Authentication Library) is great but:
- ❌ Complex setup for student projects
- ❌ Requires Azure AD tenant configuration
- ❌ Redirect-based auth (issues with WASM)
- ❌ Limited free tier
- ❌ Overkill for this use case

Supabase gives you everything MSAL does, but simpler and free! 🎉
