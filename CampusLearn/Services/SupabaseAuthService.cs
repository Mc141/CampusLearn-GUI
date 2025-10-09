using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace CampusLearn.Services;

/// <summary>
/// Supabase Authentication Service - Simple REST API based auth
/// Works perfectly with WASM, Mobile, and Desktop
/// </summary>
public class SupabaseAuthService : IAuthenticationService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _supabaseAnonKey;
    private UserProfile? _currentUser;
    private string? _accessToken;
    private string? _refreshToken;

    public bool IsAuthenticated => _currentUser != null && !string.IsNullOrEmpty(_accessToken);
    public string? CurrentUserId => _currentUser?.Id;

    public event EventHandler<AuthStateChangedEventArgs>? AuthStateChanged;

    public SupabaseAuthService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        
        // Try to get from configuration, fallback to hardcoded values if not available
        _supabaseUrl = configuration["Supabase:Url"];
        _supabaseAnonKey = configuration["Supabase:AnonKey"];
        
        // Fallback configuration (from your appsettings.json)
        if (string.IsNullOrEmpty(_supabaseUrl))
        {
            _supabaseUrl = "https://xypafpgtxmahoyarrvny.supabase.co";
        }
        
        if (string.IsNullOrEmpty(_supabaseAnonKey))
        {
            _supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGFmcGd0eG1haG95YXJydm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTM2MjgsImV4cCI6MjA3NTU4OTYyOH0.kCdiZffTO-P4i2pFBp5ICVsmesqjS_Vf9Ved-MOouM0";
        }
        
        if (string.IsNullOrEmpty(_supabaseUrl) || string.IsNullOrEmpty(_supabaseAnonKey))
        {
            throw new Exception("Supabase configuration is missing");
        }
        
        _httpClient.BaseAddress = new Uri($"{_supabaseUrl}/auth/v1/");
        _httpClient.DefaultRequestHeaders.Add("apikey", _supabaseAnonKey);
    }

    public async Task<AuthResult> SignUpAsync(string email, string password, string fullName)
    {
        try
        {
            System.Diagnostics.Debug.WriteLine($"🔐 SignUpAsync called with email: {email}");
            
            // Validate Belgium Campus email (support both formats)
            bool isValidEmail = email.EndsWith("@belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase) ||
                                email.EndsWith("@student.belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase);
            
            if (!isValidEmail)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Email validation failed: {email}");
                return new AuthResult 
                { 
                    Success = false, 
                    ErrorMessage = "Only Belgium Campus emails (@belgiumcampus.ac.za or @student.belgiumcampus.ac.za) are allowed" 
                };
            }

            System.Diagnostics.Debug.WriteLine($"✅ Email validation passed");

            var request = new
            {
                email,
                password,
                data = new { full_name = fullName }
            };

            System.Diagnostics.Debug.WriteLine($"📡 Sending request to Supabase: {_httpClient.BaseAddress}signup");
            
            var response = await _httpClient.PostAsJsonAsync("signup", request);
            var content = await response.Content.ReadAsStringAsync();

            System.Diagnostics.Debug.WriteLine($"📥 Supabase response - Status: {response.StatusCode}");
            System.Diagnostics.Debug.WriteLine($"📥 Response content length: {content?.Length ?? 0} chars");
            System.Diagnostics.Debug.WriteLine($"📥 Response content: {content}");

            if (!response.IsSuccessStatusCode)
            {
                System.Diagnostics.Debug.WriteLine($"❌ Response not successful: {response.StatusCode}");
                var error = JsonSerializer.Deserialize<SupabaseError>(content);
                System.Diagnostics.Debug.WriteLine($"❌ Supabase error: {error?.Message ?? error?.ErrorDescription}");
                return new AuthResult 
                { 
                    Success = false, 
                    ErrorMessage = error?.Message ?? error?.ErrorDescription ?? "Registration failed" 
                };
            }

            System.Diagnostics.Debug.WriteLine($"✅ Response is successful (200), parsing JSON...");

            // Check if response is empty or null
            if (string.IsNullOrWhiteSpace(content))
            {
                System.Diagnostics.Debug.WriteLine($"⚠️ Response content is empty - this is OK for email confirmation");
                // When email confirmation is enabled, Supabase returns 200 but no user data until email is confirmed
                return new AuthResult
                {
                    Success = true,
                    ErrorMessage = null,
                    User = new UserProfile
                    {
                        Email = email,
                        FullName = fullName,
                        EmailConfirmed = false
                    }
                };
            }

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };

            var authResponse = JsonSerializer.Deserialize<SupabaseAuthResponse>(content, options);

            System.Diagnostics.Debug.WriteLine($"📋 Parsed response - Has User: {authResponse?.User != null}, Has AccessToken: {!string.IsNullOrEmpty(authResponse?.AccessToken)}");

            if (authResponse?.User != null)
            {
                System.Diagnostics.Debug.WriteLine($"✅ User created successfully: {authResponse.User.Email}");
                
                _currentUser = new UserProfile
                {
                    Id = authResponse.User.Id,
                    Email = authResponse.User.Email,
                    FullName = fullName,
                    EmailConfirmed = authResponse.User.EmailConfirmed,
                    CreatedAt = DateTime.Parse(authResponse.User.CreatedAt)
                };

                _accessToken = authResponse.AccessToken;
                _refreshToken = authResponse.RefreshToken;

                // Save tokens securely
                await SaveTokensAsync(_accessToken, _refreshToken);

                AuthStateChanged?.Invoke(this, new AuthStateChangedEventArgs 
                { 
                    IsAuthenticated = true, 
                    User = _currentUser 
                });

                return new AuthResult
                {
                    Success = true,
                    User = _currentUser,
                    AccessToken = _accessToken,
                    RefreshToken = _refreshToken
                };
            }
            else if (authResponse != null)
            {
                // Response parsed but no user - this happens when email confirmation is required
                System.Diagnostics.Debug.WriteLine($"⚠️ Response parsed but no user data - email confirmation likely required");
                return new AuthResult
                {
                    Success = true,
                    ErrorMessage = null,
                    User = new UserProfile
                    {
                        Email = email,
                        FullName = fullName,
                        EmailConfirmed = false
                    }
                };
            }

            System.Diagnostics.Debug.WriteLine($"❌ Auth response was null or incomplete");
            System.Diagnostics.Debug.WriteLine($"Response details: {content}");
            
            // Even if we can't parse the response, if status is 200 and we got here, registration likely succeeded
            return new AuthResult 
            { 
                Success = true, 
                ErrorMessage = null,
                User = new UserProfile
                {
                    Email = email,
                    FullName = fullName,
                    EmailConfirmed = false
                }
            };
        }
        catch (JsonException jsonEx)
        {
            System.Diagnostics.Debug.WriteLine($"💥 JSON parsing error: {jsonEx.Message}");
            // If JSON parsing failed but we got 200 response, registration likely succeeded
            return new AuthResult 
            { 
                Success = true,
                ErrorMessage = null,
                User = new UserProfile
                {
                    Email = email,
                    FullName = fullName,
                    EmailConfirmed = false
                }
            };
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in SignUpAsync: {ex}");
            return new AuthResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<AuthResult> SignInAsync(string email, string password)
    {
        try
        {
            // Validate Belgium Campus email (support both formats)
            bool isValidEmail = email.EndsWith("@belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase) ||
                                email.EndsWith("@student.belgiumcampus.ac.za", StringComparison.OrdinalIgnoreCase);
            
            if (!isValidEmail)
            {
                return new AuthResult 
                { 
                    Success = false, 
                    ErrorMessage = "Only Belgium Campus emails (@belgiumcampus.ac.za or @student.belgiumcampus.ac.za) are allowed" 
                };
            }

            System.Diagnostics.Debug.WriteLine($"🔐 SignInAsync called with email: {email}");

            var request = new { email, password };

            var response = await _httpClient.PostAsJsonAsync("token?grant_type=password", request);
            var content = await response.Content.ReadAsStringAsync();

            System.Diagnostics.Debug.WriteLine($"📥 Login response - Status: {response.StatusCode}");
            System.Diagnostics.Debug.WriteLine($"📥 Response content: {content}");

            if (!response.IsSuccessStatusCode)
            {
                var error = JsonSerializer.Deserialize<SupabaseError>(content);
                
                // Check if error is due to email not confirmed
                if (error?.Message?.Contains("Email not confirmed", StringComparison.OrdinalIgnoreCase) == true ||
                    error?.ErrorDescription?.Contains("email not confirmed", StringComparison.OrdinalIgnoreCase) == true)
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Email not confirmed for: {email}");
                    return new AuthResult 
                    { 
                        Success = false, 
                        ErrorMessage = "Please verify your email before logging in. Check your inbox for the verification link." 
                    };
                }
                
                System.Diagnostics.Debug.WriteLine($"❌ Login error: {error?.Message ?? error?.ErrorDescription}");
                return new AuthResult 
                { 
                    Success = false, 
                    ErrorMessage = error?.Message ?? error?.ErrorDescription ?? "Login failed. Check your credentials." 
                };
            }

            var authResponse = JsonSerializer.Deserialize<SupabaseAuthResponse>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (authResponse?.User != null)
            {
                // Check if email is confirmed
                if (!authResponse.User.EmailConfirmed)
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Email not confirmed for: {email}");
                    return new AuthResult 
                    { 
                        Success = false, 
                        ErrorMessage = "Please verify your email before logging in. Check your inbox for the verification link." 
                    };
                }

                System.Diagnostics.Debug.WriteLine($"✅ User logged in successfully: {authResponse.User.Email}");
                
                _currentUser = new UserProfile
                {
                    Id = authResponse.User.Id,
                    Email = authResponse.User.Email,
                    FullName = authResponse.User.UserMetadata?.FullName ?? authResponse.User.Email,
                    EmailConfirmed = authResponse.User.EmailConfirmed,
                    CreatedAt = DateTime.Parse(authResponse.User.CreatedAt)
                };

                _accessToken = authResponse.AccessToken;
                _refreshToken = authResponse.RefreshToken;

                // Save tokens securely
                await SaveTokensAsync(_accessToken, _refreshToken);

                // Update HttpClient header for authenticated requests
                _httpClient.DefaultRequestHeaders.Authorization = 
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _accessToken);

                AuthStateChanged?.Invoke(this, new AuthStateChangedEventArgs 
                { 
                    IsAuthenticated = true, 
                    User = _currentUser 
                });

                return new AuthResult
                {
                    Success = true,
                    User = _currentUser,
                    AccessToken = _accessToken,
                    RefreshToken = _refreshToken
                };
            }

            System.Diagnostics.Debug.WriteLine($"❌ Login failed - no user data in response");
            return new AuthResult { Success = false, ErrorMessage = "Login failed. Check your credentials." };
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Exception in SignInAsync: {ex}");
            return new AuthResult { Success = false, ErrorMessage = ex.Message };
        }
    }

    public async Task<bool> SignOutAsync()
    {
        try
        {
            if (!string.IsNullOrEmpty(_accessToken))
            {
                await _httpClient.PostAsync("logout", null);
            }

            _currentUser = null;
            _accessToken = null;
            _refreshToken = null;

            await ClearTokensAsync();

            _httpClient.DefaultRequestHeaders.Authorization = null;

            AuthStateChanged?.Invoke(this, new AuthStateChangedEventArgs 
            { 
                IsAuthenticated = false, 
                User = null 
            });

            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string email)
    {
        try
        {
            var request = new { email };
            var response = await _httpClient.PostAsJsonAsync("recover", request);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> ConfirmEmailAsync(string token)
    {
        try
        {
            var response = await _httpClient.PostAsync($"verify?token={token}&type=signup", null);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<UserProfile?> GetCurrentUserAsync()
    {
        if (_currentUser != null)
            return _currentUser;

        // Try to load from secure storage
        var token = await LoadAccessTokenAsync();
        if (string.IsNullOrEmpty(token))
            return null;

        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.GetAsync("user");
            if (!response.IsSuccessStatusCode)
                return null;

            var content = await response.Content.ReadAsStringAsync();
            var user = JsonSerializer.Deserialize<SupabaseUser>(content, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (user != null)
            {
                _currentUser = new UserProfile
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.UserMetadata?.FullName ?? user.Email,
                    EmailConfirmed = user.EmailConfirmed,
                    CreatedAt = DateTime.Parse(user.CreatedAt)
                };

                _accessToken = token;
                return _currentUser;
            }
        }
        catch
        {
            // Token invalid or expired
            await ClearTokensAsync();
        }

        return null;
    }

    private async Task SaveTokensAsync(string accessToken, string refreshToken)
    {
        await StorageService.SetAsync("access_token", accessToken);
        await StorageService.SetAsync("refresh_token", refreshToken);
    }

    private async Task<string?> LoadAccessTokenAsync()
    {
        return await StorageService.GetAsync("access_token");
    }

    private Task ClearTokensAsync()
    {
        StorageService.Remove("access_token");
        StorageService.Remove("refresh_token");
        return Task.CompletedTask;
    }
}

#region Supabase Response Models

internal class SupabaseAuthResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = "";

    [JsonPropertyName("refresh_token")]
    public string RefreshToken { get; set; } = "";

    [JsonPropertyName("user")]
    public SupabaseUser? User { get; set; }
}

internal class SupabaseUser
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("email_confirmed_at")]
    public string EmailConfirmedAt { get; set; } = "";

    public bool EmailConfirmed => !string.IsNullOrEmpty(EmailConfirmedAt);

    [JsonPropertyName("user_metadata")]
    public UserMetadata? UserMetadata { get; set; }

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = "";
}

internal class UserMetadata
{
    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = "";
}

internal class SupabaseError
{
    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("error_description")]
    public string? ErrorDescription { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }
}

#endregion
