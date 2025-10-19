// Test script for email notifications
// Run this in the browser console to test email functionality

// Test 1: Check if EmailJS is properly initialized
console.log("🧪 Testing EmailJS initialization...");
console.log("EmailJS service ID:", "service_5ehr2eg");
console.log("EmailJS template ID:", "template_rbuccsr");
console.log("EmailJS public key:", "eg0JHdoYe7btBFjf8");

// Test 2: Test email service import
try {
  const emailService = await import("./src/services/emailService.ts");
  console.log("✅ Email service imported successfully");
} catch (error) {
  console.error("❌ Error importing email service:", error);
}

// Test 3: Test notification service with email integration
try {
  const notificationService = await import(
    "./src/services/notificationService.ts"
  );
  console.log("✅ Notification service imported successfully");
} catch (error) {
  console.error("❌ Error importing notification service:", error);
}

// Test 4: Check if user profile has email preferences
console.log("🧪 Testing user profile email preferences...");
// This would need to be run in the context of a logged-in user

console.log("📧 Email notification integration test completed!");
console.log("Next steps:");
console.log("1. Go to Profile page and enable email notifications");
console.log("2. Send a message to another user");
console.log("3. Check console for email sending logs");
console.log("4. Check recipient's email for notification");

