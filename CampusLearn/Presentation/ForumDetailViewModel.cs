using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class ForumDetailViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    
    // Static property to receive the selected post
    public static ForumPost? SelectedPost { get; set; }

    public ForumDetailViewModel(INavigator navigator)
    {
        _navigator = navigator;
        
        // Load the post from the static property
        if (SelectedPost != null)
        {
            CurrentPost = SelectedPost;
            LoadReplies();
        }
    }

    [ObservableProperty]
    private ForumPost? currentPost;

    [ObservableProperty]
    private ObservableCollection<ForumPost> replies = new();

    [ObservableProperty]
    private string replyText = "";

    [ObservableProperty]
    private bool hasUpvoted = false;

    [ObservableProperty]
    private bool hasDownvoted = false;

    private void LoadReplies()
    {
        if (CurrentPost == null) return;

        // Sample replies - replace with API call later
        Replies = new ObservableCollection<ForumPost>
        {
            new ForumPost
            {
                PostId = 101,
                Text = "Have you tried using INNER JOIN? It combines rows from both tables where there's a match.",
                AuthorName = "Jane Smith",
                AuthorUserId = 5,
                AnonymousFlag = false,
                CreatedAt = DateTime.Now.AddHours(-1),
                UpvoteCount = 5,
                DownvoteCount = 0,
                ParentPostId = CurrentPost.PostId
            },
            new ForumPost
            {
                PostId = 102,
                Text = "I had the same issue! Check out this resource: https://example.com/sql-joins",
                AuthorName = "Anonymous User",
                AuthorUserId = 6,
                AnonymousFlag = true,
                CreatedAt = DateTime.Now.AddMinutes(-30),
                UpvoteCount = 3,
                DownvoteCount = 0,
                ParentPostId = CurrentPost.PostId
            }
        };
    }

    [RelayCommand]
    private void UpvotePost()
    {
        if (CurrentPost == null) return;

        if (HasUpvoted)
        {
            // Remove upvote
            CurrentPost.UpvoteCount--;
            HasUpvoted = false;
        }
        else
        {
            // Add upvote
            CurrentPost.UpvoteCount++;
            HasUpvoted = true;

            // Remove downvote if it was active
            if (HasDownvoted)
            {
                CurrentPost.DownvoteCount--;
                HasDownvoted = false;
            }
        }

        // TODO: Call API to save vote
    }

    [RelayCommand]
    private void DownvotePost()
    {
        if (CurrentPost == null) return;

        if (HasDownvoted)
        {
            // Remove downvote
            CurrentPost.DownvoteCount--;
            HasDownvoted = false;
        }
        else
        {
            // Add downvote
            CurrentPost.DownvoteCount++;
            HasDownvoted = true;

            // Remove upvote if it was active
            if (HasUpvoted)
            {
                CurrentPost.UpvoteCount--;
                HasUpvoted = false;
            }
        }

        // TODO: Call API to save vote
    }

    [RelayCommand]
    private void PostReply()
    {
        if (string.IsNullOrWhiteSpace(ReplyText) || CurrentPost == null)
            return;

        var newReply = new ForumPost
        {
            PostId = new Random().Next(1000, 9999),
            Text = ReplyText,
            AuthorName = "Current User",
            AuthorUserId = 1,
            AnonymousFlag = false,
            CreatedAt = DateTime.Now,
            UpvoteCount = 0,
            DownvoteCount = 0,
            ParentPostId = CurrentPost.PostId
        };

        Replies.Add(newReply);
        CurrentPost.ReplyCount++;
        ReplyText = "";

        // TODO: Call API to save reply
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await _navigator.NavigateViewModelAsync<ProfileViewModel>(this);
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
}
