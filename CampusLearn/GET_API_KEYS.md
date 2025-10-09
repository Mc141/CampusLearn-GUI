# 🔑 Getting Your Supabase API Keys - Quick Guide

## Step 1: Go to Your Supabase Dashboard

1. Go to [app.supabase.com](https://app.supabase.com)
2. Open your **CampusLearn** project

## Step 2: Navigate to API Settings

1. Click the **Settings** icon (⚙️) in the left sidebar
2. Click **"API"** in the settings menu

## Step 3: Find Your Keys

You'll see a page with these sections:

### 📍 **Project URL**
```
Configuration > URL
Example: https://abcdefghijklmno.supabase.co
```
**Copy this entire URL**

### 📍 **Project API keys**

Look for the **"anon" "public"** key (NOT the service_role key):

```
Project API keys > anon public
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg5MDAwMDAwLCJleHAiOjIwMDQ1NzYwMDB9.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
**This is a VERY LONG string (200+ characters)**

⚠️ **DO NOT use the "service_role" key** - that's for server-side only and is a security risk!

## Step 4: Update appsettings.json

Open `CampusLearn/appsettings.json` and replace:

```json
{
  "Supabase": {
    "Url": "PASTE_YOUR_PROJECT_URL_HERE",
    "AnonKey": "PASTE_YOUR_ANON_KEY_HERE"
  }
}
```

### ✅ Example (with real format):

```json
{
  "Supabase": {
    "Url": "https://xyzabcdefg.supabase.co",
    "AnonKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZmciLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY4OTAwMDAwMCwiZXhwIjoyMDA0NTc2MDAwfQ.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

## 📸 Visual Guide

```
Supabase Dashboard
  └─ Settings ⚙️
       └─ API
            ├─ Project URL ✅ (Copy this)
            │   https://xxxxx.supabase.co
            │
            └─ Project API keys
                 ├─ anon public ✅ (Copy this - it's LONG!)
                 │   eyJhbGciOiJIUzI1NiIs... (200+ chars)
                 │
                 └─ service_role ❌ (DON'T use this!)
```

## 🔐 Security Notes

- ✅ **anon key** is safe to use in your app (it's client-side)
- ✅ **anon key** works with Row Level Security (RLS)
- ❌ **service_role key** should NEVER be in client apps
- ❌ Don't commit real keys to GitHub (use environment variables in production)

## ✅ After Configuration

Once you've updated `appsettings.json`:

1. Save the file
2. Rebuild your project: `dotnet build`
3. Run your app: `dotnet run`
4. Try registering with your @belgiumcampus.ac.za email!

---

## 🆘 Still Can't Find It?

Screenshot the API page (without showing full keys) or the key format you see, and I can help identify which one to use!

The **anon key** should:
- Start with: `eyJhbGciOiJIUzI1NiI...`
- Be very long (200+ characters)
- Be labeled as "anon" or "public"
