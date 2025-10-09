# 🔧 Sign Up Button Fix - Debugging Guide

## Issue
Clicking "Sign Up" button doesn't show the registration form.

## What Was Fixed

### 1. **LoginPage.xaml.cs** - Enhanced Visual State Management
- ✅ Added `DataContextChanged` event handler
- ✅ Ensured visual state updates on load
- ✅ Properly subscribes to `PropertyChanged` events

### 2. **LoginViewModel.cs** - Explicit Property Notification
- ✅ Added `OnPropertyChanged(nameof(IsLoginMode))` in `ToggleMode`
- ✅ Ensures UI is notified when mode changes

---

## 🧪 Testing Steps

### Test 1: Toggle to Registration Mode
1. Run the app
2. On login page, click **"Sign Up"** link (below the Sign In button)
3. **Expected Result:**
   - Header should change to "Create your account"
   - Full Name field should appear
   - Button should change to "Create Account"
   - Link should change to "Sign In"

### Test 2: Register a New Account
1. After clicking "Sign Up", fill in:
   - **Full Name**: `Test User`
   - **Email**: `test@belgiumcampus.ac.za`
   - **Password**: `Test123!`
2. Click **"Create Account"** button
3. **Expected Result:**
   - Status message: "Creating account..."
   - Then: "Registration successful! Please check your email..."
   - Form clears and switches back to login mode

### Test 3: Toggle Back to Login
1. In registration mode, click **"Sign In"** link
2. **Expected Result:**
   - Form switches back to login mode
   - Full Name field hides
   - Button changes to "Sign In"

---

## 🐛 If It Still Doesn't Work

### Debug Output to Check:

Add this temporary debugging code to `LoginPage.xaml.cs`:

```csharp
private void UpdateVisualState()
{
    if (ViewModel == null)
    {
        System.Diagnostics.Debug.WriteLine("❌ ViewModel is null");
        return;
    }

    var stateName = ViewModel.IsLoginMode ? "LoginMode" : "RegisterMode";
    System.Diagnostics.Debug.WriteLine($"🔄 Switching to visual state: {stateName}");
    
    var result = VisualStateManager.GoToState(this, stateName, useTransitions: true);
    System.Diagnostics.Debug.WriteLine($"✅ Visual state changed: {result}");
}
```

Then check the **Output** window in Visual Studio for debug messages.

---

## 🔍 Troubleshooting Checklist

| Check | Expected Result |
|-------|----------------|
| ✅ ViewModel is not null | DataContext is properly set |
| ✅ IsLoginMode property changes | ToggleMode command executes |
| ✅ PropertyChanged event fires | ObservableProperty working |
| ✅ Visual state transitions | VisualStateManager activates |

---

## 🎯 Alternative: Simplified Toggle Button

If visual states still don't work, you can use visibility bindings instead:

```xaml
<!-- In LoginPage.xaml, replace visual states with direct bindings -->

<!-- Full Name Section -->
<StackPanel Spacing="8" Visibility="{Binding IsLoginMode, Converter={StaticResource BoolToVisibilityConverter}, ConverterParameter=Inverse}">
    <TextBlock Text="Full Name"/>
    <TextBox Text="{Binding FullName, Mode=TwoWay}"/>
</StackPanel>

<!-- Login Button -->
<Button 
    Content="Sign In"
    Command="{Binding LoginCommand}"
    Visibility="{Binding IsLoginMode, Converter={StaticResource BoolToVisibilityConverter}}"/>

<!-- Register Button -->
<Button 
    Content="Create Account"
    Command="{Binding RegisterCommand}"
    Visibility="{Binding IsLoginMode, Converter={StaticResource BoolToVisibilityConverter}, ConverterParameter=Inverse}"/>
```

---

## ✅ What Should Work Now

1. **Toggle Command**: Click "Sign Up" should toggle `IsLoginMode` to `false`
2. **Visual State**: UI should switch to "RegisterMode"
3. **Registration Form**: Full Name field appears, button changes
4. **Registration**: Clicking "Create Account" should call Supabase API

---

## 🚀 Next Steps After Fix

Once sign up works:
1. Register with your @belgiumcampus.ac.za email
2. Check your email inbox for verification link
3. Click verification link
4. Return to app and login
5. Test full authentication flow

---

## 📝 Build Status

✅ **Build Successful**  
✅ **No Compilation Errors**  
✅ **Visual State Management Enhanced**  
✅ **Property Change Notifications Fixed**

---

**Stop debugging, rebuild, and test the Sign Up button again!** 🎉

If it still doesn't work, check the Output window for debug messages or try the alternative visibility binding approach.
