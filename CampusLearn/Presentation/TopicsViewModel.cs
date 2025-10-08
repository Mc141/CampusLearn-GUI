using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class TopicsViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    
    // Static collection to share topics across navigation
    public static ObservableCollection<Topic> AllTopics { get; set; } = new();

    public TopicsViewModel(INavigator navigator)
    {
        _navigator = navigator;
        if (AllTopics.Count == 0)
        {
            LoadSampleTopics();
        }
        else
        {
            Topics = AllTopics;
            ApplyFilter();
        }
    }

    [ObservableProperty]
    private ObservableCollection<Topic> topics = new();

    [ObservableProperty]
    private ObservableCollection<Topic> filteredTopics = new();

    [ObservableProperty]
    private string selectedFilter = "All";

    [ObservableProperty]
    private string searchQuery = "";

    [ObservableProperty]
    private bool showOnlySubscribed = false;

    private void LoadSampleTopics()
    {
        AllTopics = new ObservableCollection<Topic>
        {
            new Topic
            {
                TopicId = 1,
                TopicTitle = "SQL JOIN Operations",
                Description = "Need help understanding INNER, LEFT, RIGHT, and FULL OUTER JOINs",
                ModuleCode = "BIT222",
                ModuleName = "Database Systems",
                CreatorName = "John Doe",
                CreatorUserId = 1,
                AssignedTutorName = "Prof. Smith",
                CreatedAt = DateTime.Now.AddHours(-3),
                SubscriberCount = 12,
                PostCount = 8,
                ResourceCount = 3,
                IsSubscribed = false,
                DifficultyLevel = "Intermediate",
                Status = "Open"
            },
            new Topic
            {
                TopicId = 2,
                TopicTitle = "Java Collections Framework",
                Description = "ArrayList vs LinkedList - when to use each?",
                ModuleCode = "BIT311",
                ModuleName = "Advanced Programming",
                CreatorName = "Sarah Johnson",
                CreatorUserId = 2,
                AssignedTutorName = "Dr. Williams",
                CreatedAt = DateTime.Now.AddHours(-6),
                SubscriberCount = 18,
                PostCount = 15,
                ResourceCount = 5,
                IsSubscribed = true,
                DifficultyLevel = "Intermediate",
                Status = "In Progress"
            },
            new Topic
            {
                TopicId = 3,
                TopicTitle = "UML Class Diagrams",
                Description = "How to represent relationships and inheritance",
                ModuleCode = "BIT216",
                ModuleName = "Software Engineering",
                CreatorName = "Mike Chen",
                CreatorUserId = 3,
                AssignedTutorName = "Prof. Davis",
                CreatedAt = DateTime.Now.AddDays(-1),
                SubscriberCount = 25,
                PostCount = 12,
                ResourceCount = 7,
                IsSubscribed = true,
                DifficultyLevel = "Beginner",
                Status = "Open"
            },
            new Topic
            {
                TopicId = 4,
                TopicTitle = "React Hooks Explained",
                Description = "useState, useEffect, and custom hooks",
                ModuleCode = "BIT311",
                ModuleName = "Advanced Programming",
                CreatorName = "Emma Brown",
                CreatorUserId = 4,
                AssignedTutorName = "Dr. Williams",
                CreatedAt = DateTime.Now.AddMinutes(-45),
                SubscriberCount = 8,
                PostCount = 4,
                ResourceCount = 2,
                IsSubscribed = false,
                DifficultyLevel = "Advanced",
                Status = "Open"
            },
            new Topic
            {
                TopicId = 5,
                TopicTitle = "Financial Accounting Basics",
                Description = "Understanding debits, credits, and journal entries",
                ModuleCode = "BCom101",
                ModuleName = "Business Fundamentals",
                CreatorName = "David Lee",
                CreatorUserId = 5,
                AssignedTutorName = "Prof. Taylor",
                CreatedAt = DateTime.Now.AddHours(-2),
                SubscriberCount = 20,
                PostCount = 10,
                ResourceCount = 6,
                IsSubscribed = false,
                DifficultyLevel = "Beginner",
                Status = "Resolved"
            }
        };

        Topics = AllTopics;
        ApplyFilter();
    }

    partial void OnSearchQueryChanged(string value)
    {
        ApplyFilter();
    }

    partial void OnShowOnlySubscribedChanged(bool value)
    {
        ApplyFilter();
    }

    [RelayCommand]
    private void ApplyFilter()
    {
        var filtered = Topics.AsEnumerable();

        // Apply subscribed filter
        if (ShowOnlySubscribed)
        {
            filtered = filtered.Where(t => t.IsSubscribed);
        }

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(SearchQuery))
        {
            filtered = filtered.Where(t =>
                t.TopicTitle.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                t.Description.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                t.ModuleCode.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase));
        }

        // Apply module filter
        if (SelectedFilter != "All")
        {
            filtered = filtered.Where(t => t.ModuleCode == SelectedFilter);
        }

        // Sort by most recent
        filtered = filtered.OrderByDescending(t => t.CreatedAt);

        FilteredTopics = new ObservableCollection<Topic>(filtered);
    }

    [RelayCommand]
    private void SelectFilter(string filter)
    {
        SelectedFilter = filter;
        ApplyFilter();
    }

    [RelayCommand]
    private void ToggleSubscription(Topic topic)
    {
        topic.IsSubscribed = !topic.IsSubscribed;
        
        if (topic.IsSubscribed)
        {
            topic.SubscriberCount++;
        }
        else
        {
            topic.SubscriberCount--;
        }

        // TODO: Call API to save subscription
        ApplyFilter();
    }

    [RelayCommand]
    private async Task NavigateToForum()
    {
        await _navigator.NavigateViewModelAsync<ForumViewModel>(this, qualifier: Qualifiers.ClearBackStack);
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
    private async Task NavigateToTopicsDetail(Topic topic)
    {
        TopicsDetailViewModel.SelectedTopic = topic;
        await _navigator.NavigateViewModelAsync<TopicsDetailViewModel>(this);
    }

    [RelayCommand]
    private async Task CreateNewTopic()
    {
        await _navigator.NavigateViewModelAsync<CreateTopicViewModel>(this);
    }
}
