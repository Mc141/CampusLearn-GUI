using System.Collections.ObjectModel;
using Uml_Implementation.Entities;
using CampusLearn.Services;
using CampusLearn.Models;

namespace CampusLearn.Presentation;

public partial class ForumViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    private readonly SupabaseService _supabaseService;
    private readonly CampusLearn.Services.IAuthenticationService _authService;

    // Static collection to share posts across navigation
    public static ObservableCollection<ForumPost> AllPosts { get; set; } = new();

    public ForumViewModel(INavigator navigator, SupabaseService supabaseService, CampusLearn.Services.IAuthenticationService authService)
    {
        _navigator = navigator;
        _supabaseService = supabaseService;
        _authService = authService;
        if (AllPosts.Count == 0)
        {
            _ = LoadPostsFromDatabase(); // Fire and forget async call
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

    partial void OnFilteredPostsChanged(ObservableCollection<ForumPost> value)
    {
        System.Diagnostics.Debug.WriteLine($"🔄 FilteredPosts changed - Count: {value?.Count ?? 0}");
    }

    [ObservableProperty]
    private string selectedFilter = "Trending";

    [ObservableProperty]
    private string searchQuery = "";

    // Load posts from database
    private async Task LoadPostsFromDatabase()
    {
        try
        {
            System.Diagnostics.Debug.WriteLine("🔄 Starting to load posts from database...");

            var supabase = _supabaseService.GetClient();

            // Get current user for like/dislike status
            var currentUser = await _authService.GetCurrentUserAsync();
            var currentUserId = currentUser?.Id;

            System.Diagnostics.Debug.WriteLine($"👤 Current user: {currentUserId ?? "null"}");

            // Load posts from database
            var dbPosts = await supabase.Postgrest.Table<DbForumPost>()
                .Order(column: "created_at", ordering: Supabase.Postgrest.Constants.Ordering.Descending)
                .Get();

            System.Diagnostics.Debug.WriteLine($"📊 Found {dbPosts.Models.Count} posts in database");

            AllPosts = new ObservableCollection<ForumPost>();

            foreach (var dbPost in dbPosts.Models)
            {
                try
                {
                    System.Diagnostics.Debug.WriteLine($"📝 Processing post: {dbPost.Title}");

                    // Use user_name directly from the post - NO MORE COMPLEX QUERIES!
                    string authorName = string.IsNullOrEmpty(dbPost.UserName) ? "Unknown User" : dbPost.UserName;
                    System.Diagnostics.Debug.WriteLine($"✅ Using direct user_name: {authorName} for post {dbPost.Title}");

                    // Get user's like/dislike status for this post (with error handling)
                    bool isLiked = false;
                    bool isDisliked = false;

                    if (currentUserId != null)
                    {
                        try
                        {
                            var userLikes = await supabase.Postgrest.Table<PostLike>()
                                .Filter("post_id", Supabase.Postgrest.Constants.Operator.Equals, dbPost.Id)
                                .Filter("user_id", Supabase.Postgrest.Constants.Operator.Equals, Guid.Parse(currentUserId))
                                .Get();

                            var userLike = userLikes.Models.FirstOrDefault();
                            if (userLike != null)
                            {
                                isLiked = userLike.LikeType == "like";
                                isDisliked = userLike.LikeType == "dislike";
                            }
                        }
                        catch (Exception likeEx)
                        {
                            System.Diagnostics.Debug.WriteLine($"⚠️ Could not fetch likes for post {dbPost.Id}: {likeEx.Message}");
                        }
                    }

                    // Convert DbForumPost to ForumPost for UI
                    var forumPost = new ForumPost
                    {
                        PostId = dbPost.Id.GetHashCode(), // Convert Guid to int for UI compatibility
                        DbId = dbPost.Id, // Store actual database ID
                        Title = dbPost.Title,
                        Text = dbPost.Content,
                        AuthorName = dbPost.IsAnonymous ? "Anonymous User" : authorName,
                        AuthorUserId = dbPost.UserId.GetHashCode(), // Convert Guid to int
                        AnonymousFlag = dbPost.IsAnonymous,
                        CreatedAt = dbPost.CreatedAt,
                        UpvoteCount = dbPost.LikesCount,
                        DownvoteCount = dbPost.DislikesCount,
                        ReplyCount = dbPost.CommentsCount,
                        IsLiked = isLiked,
                        IsDisliked = isDisliked
                    };

                    AllPosts.Add(forumPost);
                    System.Diagnostics.Debug.WriteLine($"✅ Added post: {forumPost.Title} by {forumPost.AuthorName}");
                }
                catch (Exception postEx)
                {
                    System.Diagnostics.Debug.WriteLine($"❌ Error processing post {dbPost.Id}: {postEx.Message}");
                    // Continue with next post instead of failing completely
                }
            }

            Posts = AllPosts;
            ApplyFilter();

            System.Diagnostics.Debug.WriteLine($"🎉 Successfully loaded {AllPosts.Count} posts from database, FilteredPosts: {FilteredPosts.Count}");
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Critical error loading posts from database: {ex.Message}");
            System.Diagnostics.Debug.WriteLine($"💥 Stack trace: {ex.StackTrace}");
            // Clear posts if database fails
            AllPosts.Clear();
            Posts = AllPosts;
            ApplyFilter();
        }
    }


    public async Task RefreshPosts()
    {
        await LoadPostsFromDatabase();
    }

    // Force refresh posts from database (clears cache first)
    public async Task ForceRefreshPosts()
    {
        AllPosts.Clear(); // Clear the static cache
        await LoadPostsFromDatabase();
    }

    partial void OnSearchQueryChanged(string value)
    {
        ApplyFilter();
    }

    [RelayCommand]
    private void ApplyFilter()
    {
        System.Diagnostics.Debug.WriteLine($"🔍 ApplyFilter called - Posts count: {Posts?.Count ?? 0}, SelectedFilter: {SelectedFilter}");

        var filtered = Posts?.AsEnumerable() ?? Enumerable.Empty<ForumPost>();

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

        var filteredList = filtered.ToList();
        FilteredPosts = new ObservableCollection<ForumPost>(filteredList);

        System.Diagnostics.Debug.WriteLine($"🔍 FilteredPosts updated with {filteredList.Count} posts");
    }

    [RelayCommand]
    private void SelectFilter(string filter)
    {
        SelectedFilter = filter;
        ApplyFilter();
    }

    [RelayCommand]
    private async Task UpvotePost(ForumPost post)
    {
        await ToggleLike(post, "like");
    }

    [RelayCommand]
    private async Task DownvotePost(ForumPost post)
    {
        await ToggleLike(post, "dislike");
    }

    private async Task ToggleLike(ForumPost post, string likeType)
    {
        try
        {
            System.Diagnostics.Debug.WriteLine($"🔄 Toggling {likeType} for post: {post.Title}");

            var currentUser = await _authService.GetCurrentUserAsync();
            if (currentUser == null)
            {
                System.Diagnostics.Debug.WriteLine("❌ No current user found");
                return;
            }

            var supabase = _supabaseService.GetClient();
            var currentUserId = Guid.Parse(currentUser.Id);

            // Check if user already liked/disliked this post
            var existingLikes = await supabase.Postgrest.Table<PostLike>()
                .Filter("post_id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                .Filter("user_id", Supabase.Postgrest.Constants.Operator.Equals, currentUserId)
                .Get();

            var existingLike = existingLikes.Models.FirstOrDefault();

            if (existingLike != null)
            {
                if (existingLike.LikeType == likeType)
                {
                    // User is trying to like/dislike the same type, so remove it
                    System.Diagnostics.Debug.WriteLine($"🗑️ Removing existing {likeType}");

                    await supabase.Postgrest.Table<PostLike>()
                        .Filter("post_id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                        .Filter("user_id", Supabase.Postgrest.Constants.Operator.Equals, currentUserId)
                        .Delete();

                    // Update database counts
                    if (likeType == "like")
                    {
                        await supabase.Postgrest.Table<DbForumPost>()
                            .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                            .Set(x => x.LikesCount, Math.Max(0, post.UpvoteCount - 1))
                            .Update();

                        post.IsLiked = false;
                        post.UpvoteCount = Math.Max(0, post.UpvoteCount - 1);
                    }
                    else
                    {
                        await supabase.Postgrest.Table<DbForumPost>()
                            .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                            .Set(x => x.DislikesCount, Math.Max(0, post.DownvoteCount - 1))
                            .Update();

                        post.IsDisliked = false;
                        post.DownvoteCount = Math.Max(0, post.DownvoteCount - 1);
                    }
                }
                else
                {
                    // User is switching from like to dislike or vice versa
                    System.Diagnostics.Debug.WriteLine($"🔄 Switching from {existingLike.LikeType} to {likeType}");

                    await supabase.Postgrest.Table<PostLike>()
                        .Filter("post_id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                        .Filter("user_id", Supabase.Postgrest.Constants.Operator.Equals, currentUserId)
                        .Set(x => x.LikeType, likeType)
                        .Update();

                    // Update database counts
                    if (likeType == "like")
                    {
                        await supabase.Postgrest.Table<DbForumPost>()
                            .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                            .Set(x => x.LikesCount, post.UpvoteCount + 1)
                            .Set(x => x.DislikesCount, Math.Max(0, post.DownvoteCount - 1))
                            .Update();

                        post.IsLiked = true;
                        post.IsDisliked = false;
                        post.UpvoteCount++;
                        post.DownvoteCount = Math.Max(0, post.DownvoteCount - 1);
                    }
                    else
                    {
                        await supabase.Postgrest.Table<DbForumPost>()
                            .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                            .Set(x => x.DislikesCount, post.DownvoteCount + 1)
                            .Set(x => x.LikesCount, Math.Max(0, post.UpvoteCount - 1))
                            .Update();

                        post.IsLiked = false;
                        post.IsDisliked = true;
                        post.DownvoteCount++;
                        post.UpvoteCount = Math.Max(0, post.UpvoteCount - 1);
                    }
                }
            }
            else
            {
                // User hasn't liked/disliked this post yet, so add it
                System.Diagnostics.Debug.WriteLine($"➕ Adding new {likeType}");

                var newLike = new PostLike
                {
                    Id = Guid.NewGuid(),
                    PostId = post.DbId,
                    UserId = currentUserId,
                    LikeType = likeType,
                    CreatedAt = DateTime.UtcNow
                };

                await supabase.Postgrest.Table<PostLike>().Insert(newLike);

                // Update database counts
                if (likeType == "like")
                {
                    await supabase.Postgrest.Table<DbForumPost>()
                        .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                        .Set(x => x.LikesCount, post.UpvoteCount + 1)
                        .Update();

                    post.IsLiked = true;
                    post.UpvoteCount++;
                }
                else
                {
                    await supabase.Postgrest.Table<DbForumPost>()
                        .Filter("id", Supabase.Postgrest.Constants.Operator.Equals, post.DbId)
                        .Set(x => x.DislikesCount, post.DownvoteCount + 1)
                        .Update();

                    post.IsDisliked = true;
                    post.DownvoteCount++;
                }
            }

            System.Diagnostics.Debug.WriteLine($"✅ Updated post counts - Likes: {post.UpvoteCount}, Dislikes: {post.DownvoteCount}");

            // Refresh the filtered posts to update the UI
            ApplyFilter();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"💥 Error toggling like: {ex.Message}");
            System.Diagnostics.Debug.WriteLine($"💥 Stack trace: {ex.StackTrace}");
        }
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
