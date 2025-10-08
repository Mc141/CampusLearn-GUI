using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public class ModuleItem
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public int ModuleId { get; set; }
}

public partial class CreateTopicViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public CreateTopicViewModel(INavigator navigator)
    {
        _navigator = navigator;
        LoadModules();
    }

    [ObservableProperty]
    private string topicTitle = "";

    [ObservableProperty]
    private string topicDescription = "";

    [ObservableProperty]
    private int selectedModuleIndex = -1;

    [ObservableProperty]
    private int selectedDifficultyIndex = 0;

    [ObservableProperty]
    private ObservableCollection<ModuleItem> availableModules = new();

    private void LoadModules()
    {
        // Sample modules - replace with API call later
        AvailableModules = new ObservableCollection<ModuleItem>
        {
            new ModuleItem { Code = "BIT222", Name = "Database Systems", ModuleId = 1 },
            new ModuleItem { Code = "BIT216", Name = "Software Engineering", ModuleId = 2 },
            new ModuleItem { Code = "BIT311", Name = "Advanced Programming", ModuleId = 3 },
            new ModuleItem { Code = "BCom101", Name = "Business Fundamentals", ModuleId = 4 },
            new ModuleItem { Code = "BIT201", Name = "Web Development", ModuleId = 5 }
        };
    }

    [RelayCommand]
    private async Task CreateTopic()
    {
        // Validate input
        if (SelectedModuleIndex < 0)
        {
            // TODO: Show error message
            return;
        }

        if (string.IsNullOrWhiteSpace(TopicTitle))
        {
            // TODO: Show error message
            return;
        }

        if (string.IsNullOrWhiteSpace(TopicDescription))
        {
            // TODO: Show error message
            return;
        }

        var selectedModule = AvailableModules[SelectedModuleIndex];
        var difficultyLevels = new[] { "Beginner", "Intermediate", "Advanced" };

        // Create new topic object
        var newTopic = new Topic
        {
            TopicId = new Random().Next(1000, 9999),
            TopicTitle = TopicTitle,
            Description = TopicDescription,
            ModuleCode = selectedModule.Code,
            ModuleName = selectedModule.Name,
            ModuleId = selectedModule.ModuleId,
            CreatorName = "Current User", // Replace with actual user
            CreatorUserId = 1,
            AssignedTutorName = "Not Assigned",
            CreatedAt = DateTime.Now,
            SubscriberCount = 1, // Creator is auto-subscribed
            PostCount = 0,
            ResourceCount = 0,
            IsSubscribed = true,
            DifficultyLevel = difficultyLevels[SelectedDifficultyIndex],
            Status = "Open"
        };

        // Add to the shared topics collection
        TopicsViewModel.AllTopics.Insert(0, newTopic);

        // TODO: Call API to save topic and notify tutors
        // await _apiService.CreateTopicAsync(newTopic);
        // await _notificationService.NotifyTutorsAsync(newTopic);

        // Navigate back to topics
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }
}
