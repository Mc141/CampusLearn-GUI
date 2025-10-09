# 🐛 Registration Debugging Guide

## Issue
Clicking "Create Account" button does nothing - no response, no error message.

## 🔍 What Was Added

Added comprehensive debugging output to trace the registration flow:

### LoginViewModel.RegisterAsync
- ✅ Logs when registration starts
- ✅ Logs validation results
- ✅ Logs API call results
- ✅ Logs success/failure
- ✅ Logs any exceptions

### SupabaseAuthService.SignUpAsync
- ✅ Logs when method is called
- ✅ Logs email validation
- ✅ Logs HTTP request details
- ✅ Logs Supabase response
- ✅ Logs user creation success/failure

---

## 🧪 How to Debug

### Step 1: Open Output Window
1. In Visual Studio, go to **View → Output** (or press `Ctrl+Alt+O`)
2. In the dropdown at the top, select **"Debug"**

### Step 2: Run the App
1. Press **F5** to run in Debug mode
2. Navigate to the login page
3. Click **"Sign Up"** to switch to registration mode

### Step 3: Fill in Registration Form
Fill in:
- **Full Name**: `Test User`
- **Email**: `test@belgiumcampus.ac.za`
- **Password**: `Test123!`

### Step 4: Click "Create Account"
Watch the Output window for messages like:

```
📝 Starting registration for: test@belgiumcampus.ac.za
🔐 SignUpAsync called with email: test@belgiumcampus.ac.za
✅ Email validation passed
📡 Sending request to Supabase: https://xypafpgtxmahoyarrvny.supabase.co/auth/v1/signup
📥 Supabase response - Status: 200
✅ User created successfully: test@belgiumcampus.ac.za
🏁 Registration process completed. IsLoading: False
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Nothing in Output Window
**Possible Cause**: RegisterCommand not firing

**Check:**
- Is the button actually visible? (Should be after clicking "Sign Up")
- Is the button enabled? (Check `IsLoading` is false)
- Is the command bound correctly?

**Solution:**
Add this to `LoginPage.xaml.cs`:
```csharp
private void DebugButton_Click(object sender, RoutedEventArgs e)
{
    System.Diagnostics.Debug.WriteLine($"🔘 Button clicked! IsLoading: {ViewModel?.IsLoading}");
    System.Diagnostics.Debug.WriteLine($"🔘 Command: {ViewModel?.RegisterCommand}");
    System.Diagnostics.Debug.WriteLine($"🔘 Can Execute: {ViewModel?.RegisterCommand?.CanExecute(null)}");
}
```

### Issue 2: "Please fill in all fields"
**Possible Cause**: Form fields are empty

**Check Output for:**
```
📝 Starting registration for: 
❌ Validation failed
```

**Solution:**
Check that the TextBox bindings are working:
```xaml
<TextBox Text="{Binding Email, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/>
<TextBox Text="{Binding FullName, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/>
<PasswordBox Password="{Binding Password, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/>
```

### Issue 3: Network Error
**Check Output for:**
```
💥 Exception in SignUpAsync: System.Net.Http.HttpRequestException
```

**Possible Causes:**
- No internet connection
- Supabase URL incorrect
- Firewall blocking request

**Solution:**
1. Check internet connection
2. Verify Supabase URL in `SupabaseAuthService.cs` constructor
3. Try accessing `https://xypafpgtxmahoyarrvny.supabase.co` in browser

### Issue 4: "Only @belgiumcampus.ac.za emails allowed"
**Check Output for:**
```
❌ Email validation failed: test@gmail.com
```

**Solution:**
Use a `@belgiumcampus.ac.za` email address

### Issue 5: Supabase Error
**Check Output for:**
```
❌ Supabase error: User already registered
```

**Common Supabase Errors:**
- `User already registered` - Try a different email
- `Password should be at least 6 characters` - Use longer password
- `Invalid email format` - Check email syntax
- `Rate limit exceeded` - Wait a few minutes

---

## 🎯 Expected Output (Success)

When registration works correctly, you should see:

```
📝 Starting registration for: test@belgiumcampus.ac.za
🔐 SignUpAsync called with email: test@belgiumcampus.ac.za
✅ Email validation passed
📡 Sending request to Supabase: https://xypafpgtxmahoyarrvny.supabase.co/auth/v1/signup
📥 Supabase response - Status: 200
📥 Response content: {"access_token":"eyJ...","user":{"id":"...","email":"test@belgiumcampus.ac.za"}}
✅ User created successfully: test@belgiumcampus.ac.za
✅ Registration result - Success: True, Error: 
✉️ Registration successful! Check email for verification.
🏁 Registration process completed. IsLoading: False
```

And on the UI:
- Status message: "Registration successful! Please check your email..."
- Form clears after 2 seconds
- Switches back to login mode

---

## 🧪 Manual Test Checklist

| Test | Expected Result |
|------|----------------|
| Click "Sign Up" link | Form switches to registration mode |
| Fill in all fields | Fields accept input |
| Click "Create Account" with empty fields | "Please fill in all fields" |
| Click with password < 6 chars | "Password must be at least 6 characters" |
| Click with valid @belgiumcampus email | "Creating account..." then success |
| Click with @gmail.com email | "Only @belgiumcampus.ac.za emails allowed" |

---

## 🔧 Quick Fixes

### If Button Not Responding:
```csharp
// Add to RegisterButton in LoginPage.xaml
Click="OnRegisterButtonClick"

// Add to LoginPage.xaml.cs
private void OnRegisterButtonClick(object sender, RoutedEventArgs e)
{
    System.Diagnostics.Debug.WriteLine("🔘 Register button CLICKED!");
    if (ViewModel?.RegisterCommand?.CanExecute(null) == true)
    {
        ViewModel.RegisterCommand.Execute(null);
    }
}
```

### If Command Not Firing:
Check that the button command binding is correct:
```xaml
<Button Command="{Binding RegisterCommand}"/>
```

### If UI Freezing:
Add `ConfigureAwait(false)` to async calls:
```csharp
var result = await _authService.SignUpAsync(...).ConfigureAwait(false);
```

---

## 📋 What to Report

If you still have issues, report:
1. **Output Window Messages**: Copy all debug output
2. **UI Behavior**: What happens when you click the button?
3. **Network**: Can you access https://xypafpgtxmahoyarrvny.supabase.co in browser?
4. **Form Values**: Are the fields filled in?

---

## ✅ Next Steps

1. **Stop debugging** (Shift+F5)
2. **Run in Debug mode** (F5)
3. **Open Output window** (Ctrl+Alt+O → Select "Debug")
4. **Try registration** and watch for debug messages
5. **Report what you see** in the Output window

The debug output will tell us exactly where the registration process is failing! 🔍
