using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class ForumViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    // Static collection to share posts across navigation
    public static ObservableCollection<ForumPost> AllPosts { get; set; } = new();

    public ForumViewModel(INavigator navigator)
    {
        _navigator = navigator;
        if (AllPosts.Count == 0)
        {
            LoadSamplePosts();
        }
        else
        {
            Posts = AllPosts;
            ApplyFilter();
        }
    }

    [ObservableProperty]
    private ObservableCollection<ForumPost> posts = new();

    [ObservableProperty]
    private ObservableCollection<ForumPost> filteredPosts = new();

    [ObservableProperty]
    private string selectedFilter = "Trending";

    [ObservableProperty]
    private string searchQuery = "";

    // Load sample data - replace this with API call later
    private void LoadSamplePosts()
    {
        AllPosts = new ObservableCollection<ForumPost>
        {
            new ForumPost
            {
                PostId = 1,
                Title = "Stuck on SQL Joins in BIT222",
                Text = "I understand basic SELECT queries, but struggling with joins between multiple tables.",
                AuthorName = "John Doe",
                AuthorUserId = 1,
                AnonymousFlag = false,
                CreatedAt = DateTime.Now.AddHours(-2),
                UpvoteCount = 12,
                DownvoteCount = 2,
                ReplyCount = 4
            },
            new ForumPost
            {
                PostId = 2,
                Title = "Need help with Java Collections",
                Text = "Can someone explain the difference between ArrayList and LinkedList?",
                AuthorName = "Anonymous User",
                AuthorUserId = 2,
                AnonymousFlag = true,
                CreatedAt = DateTime.Now.AddHours(-5),
                UpvoteCount = 8,
                DownvoteCount = 1,
                ReplyCount = 7
            },
            new ForumPost
            {
                PostId = 3,
                Title = "Best practices for Git workflows?",
                Text = "What branching strategy do you recommend for team projects?",
                AuthorName = "Sarah Smith",
                AuthorUserId = 3,
                AnonymousFlag = false,
                CreatedAt = DateTime.Now.AddHours(-1),
                UpvoteCount = 15,
                DownvoteCount = 0,
                ReplyCount = 12
            },
            new ForumPost
            {
                PostId = 4,
                Title = "Struggling with UML diagrams",
                Text = "How do I represent inheritance in class diagrams?",
                AuthorName = "Anonymous User",
                AuthorUserId = 4,
                AnonymousFlag = true,
                CreatedAt = DateTime.Now.AddMinutes(-30),
                UpvoteCount = 5,
                DownvoteCount = 0,
                ReplyCount = 3
            }
        };

        Posts = AllPosts;
        ApplyFilter();
    }

    public void RefreshPosts()
    {
        Posts = AllPosts;
        ApplyFilter();
    }

    partial void OnSearchQueryChanged(string value)
    {
        ApplyFilter();
    }

    [RelayCommand]
    private void ApplyFilter()
    {
        var filtered = Posts.AsEnumerable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(SearchQuery))
        {
            filtered = filtered.Where(p =>
                p.Title.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                p.Text.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase));
        }

        // Apply sorting based on selected filter
        filtered = SelectedFilter switch
        {
            "Trending" => filtered.OrderByDescending(p => p.UpvoteCount + p.ReplyCount),
            "Likes" => filtered.OrderByDescending(p => p.UpvoteCount),
            "Dislikes" => filtered.OrderByDescending(p => p.DownvoteCount),
            "Recent" => filtered.OrderByDescending(p => p.CreatedAt),
            _ => filtered.OrderByDescending(p => p.CreatedAt)
        };

        FilteredPosts = new ObservableCollection<ForumPost>(filtered);
    }

    [RelayCommand]
    private void SelectFilter(string filter)
    {
        SelectedFilter = filter;
        ApplyFilter();
    }

    [RelayCommand]
    private void UpvotePost(ForumPost post)
    {
        post.Upvote();
        // Later: Call API to save upvote
    }

    [RelayCommand]
    private void DownvotePost(ForumPost post)
    {
        post.Downvote();
        // Later: Call API to save downvote
    }

    [RelayCommand]
    private async Task NavigateToTopics()
    {
        await _navigator.NavigateViewModelAsync<TopicsViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToChat()
    {
        await _navigator.NavigateViewModelAsync<ChatViewModel>(this, qualifier: Qualifiers.ClearBackStack);
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this);
    }

    [RelayCommand]
    private async Task NavigateToForumDetail(ForumPost post)
    {
        // Set the post in the static property so ForumDetailViewModel can access it
        ForumDetailViewModel.SelectedPost = post;

        // Navigate to the detail page
        await _navigator.NavigateViewModelAsync<ForumDetailViewModel>(this);
    }

    [RelayCommand]
    private async Task CreateNewPost()
    {
        await _navigator.NavigateViewModelAsync<CreatePostViewModel>(this);
    }
}
