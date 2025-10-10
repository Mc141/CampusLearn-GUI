using Microsoft.Extensions.Configuration;
using Supabase;

namespace CampusLearn.Services;

/// <summary>
/// Supabase Service using the official Supabase .NET library
/// Handles authentication and provides access to the Supabase client
/// </summary>
public class SupabaseService
{
    private readonly Supabase.Client _client;
    private readonly IConfiguration _configuration;

    public SupabaseService(IConfiguration configuration)
    {
        _configuration = configuration;

        var url = _configuration["Supabase:Url"];
        var key = _configuration["Supabase:AnonKey"];

        // Fallback to hardcoded values if configuration not loaded
        if (string.IsNullOrEmpty(url))
        {
            url = "https://xypafpgtxmahoyarrvny.supabase.co";
        }

        if (string.IsNullOrEmpty(key))
        {
            key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cGFmcGd0eG1haG95YXJydm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTM2MjgsImV4cCI6MjA3NTU4OTYyOH0.kCdiZffTO-P4i2pFBp5ICVsmesqjS_Vf9Ved-MOouM0";
        }

        var options = new SupabaseOptions
        {
            AutoConnectRealtime = true
        };

        _client = new Supabase.Client(url, key, options);
    }

    public async Task InitializeAsync()
    {
        await _client.InitializeAsync();
    }

    public Supabase.Client GetClient() => _client;

    public dynamic Auth => _client.Auth;
}