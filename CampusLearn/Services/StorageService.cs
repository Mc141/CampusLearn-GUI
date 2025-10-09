namespace CampusLearn.Services;

/// <summary>
/// Simple storage service that works across all Uno Platform targets
/// Uses ApplicationData for storage which works on all platforms
/// </summary>
public static class StorageService
{
    private static readonly Windows.Storage.ApplicationDataContainer LocalSettings = 
        Windows.Storage.ApplicationData.Current.LocalSettings;

    public static Task SetAsync(string key, string value)
    {
        try
        {
            LocalSettings.Values[key] = value;
            return Task.CompletedTask;
        }
        catch
        {
            return Task.CompletedTask;
        }
    }

    public static Task<string?> GetAsync(string key)
    {
        try
        {
            if (LocalSettings.Values.TryGetValue(key, out var value))
            {
                return Task.FromResult(value as string);
            }
        }
        catch
        {
            // Ignore errors
        }

        return Task.FromResult<string?>(null);
    }

    public static void Remove(string key)
    {
        try
        {
            LocalSettings.Values.Remove(key);
        }
        catch
        {
            // Ignore errors
        }
    }

    public static void Clear()
    {
        try
        {
            LocalSettings.Values.Clear();
        }
        catch
        {
            // Ignore errors
        }
    }
}
