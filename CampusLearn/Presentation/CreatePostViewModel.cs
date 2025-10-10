using System.Collections.ObjectModel;
using Uml_Implementation.Entities;
using CampusLearn.Services;
using CampusLearn.Models;

namespace CampusLearn.Presentation;

public partial class CreatePostViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    private readonly SupabaseService _supabaseService;
    private readonly CampusLearn.Services.IAuthenticationService _authService;

    public CreatePostViewModel(INavigator navigator, SupabaseService supabaseService, CampusLearn.Services.IAuthenticationService authService)
    {
        _navigator = navigator;
        _supabaseService = supabaseService;
        _authService = authService;
        LoadTopics();
    }

    [ObservableProperty]
    private string postTitle = "";

    [ObservableProperty]
    private string postContent = "";

    [ObservableProperty]
    private bool isAnonymous = false;

    [ObservableProperty]
    private int selectedTopicIndex = -1;

    [ObservableProperty]
    private ObservableCollection<string> availableTopics = new();

    private void LoadTopics()
    {
        // Sample topics - replace with API call later
        AvailableTopics = new ObservableCollection<string>
        {
            "BIT222 - Database Systems",
            "BIT216 - Software Engineering",
            "BIT311 - Advanced Programming",
            "BCom101 - Business Fundamentals",
            "General Discussion"
        };
    }

    [RelayCommand]
    private async Task CreatePost()
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(PostTitle))
        {
            // TODO: Show error message
            return;
        }

        if (string.IsNullOrWhiteSpace(PostContent))
        {
            // TODO: Show error message
            return;
        }

        // Get current user
        var currentUser = await _authService.GetCurrentUserAsync();
        if (currentUser == null)
        {
            // TODO: Show error message - user not logged in
            return;
        }

        // Insert into database
        var supabase = _supabaseService.GetClient();
        var dbPost = new DbForumPost
        {
            Id = Guid.NewGuid(),
            Title = PostTitle,
            Content = PostContent,
            UserId = Guid.Parse(currentUser.Id),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Simple database insert using Supabase
        await supabase.Postgrest.Table<DbForumPost>().Insert(dbPost);

        // Create new post object for UI
        var newPost = new ForumPost
        {
            PostId = new Random().Next(1000, 9999), // Temporary ID
            Title = PostTitle,
            Text = PostContent,
            AuthorName = IsAnonymous ? "Anonymous User" : currentUser.FullName,
            AuthorUserId = 1, // Replace with actual user ID
            AnonymousFlag = IsAnonymous,
            CreatedAt = DateTime.Now,
            UpvoteCount = 0,
            DownvoteCount = 0,
            ReplyCount = 0,
            TopicId = SelectedTopicIndex >= 0 ? SelectedTopicIndex : 0
        };

        // Add to the shared posts collection
        ForumViewModel.AllPosts.Insert(0, newPost); // Add at the beginning

        // Navigate back to forum
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }
}