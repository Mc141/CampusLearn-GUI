using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class CreatePostViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public CreatePostViewModel(INavigator navigator)
    {
        _navigator = navigator;
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

        // Create new post object
        var newPost = new ForumPost
        {
            PostId = new Random().Next(1000, 9999), // Temporary ID
            Title = PostTitle,
            Text = PostContent,
            AuthorName = IsAnonymous ? "Anonymous User" : "Current User", // Replace with actual user
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

        // TODO: Call API to save post
        // await _apiService.CreatePostAsync(newPost);

        // Navigate back to forum
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }
}