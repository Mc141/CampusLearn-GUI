using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class UploadResourceViewModel : ObservableObject
{
    private readonly INavigator _navigator;

    public UploadResourceViewModel(INavigator navigator)
    {
        _navigator = navigator;
        LoadTopics();
    }

    [ObservableProperty]
    private string resourceTitle = "";

    [ObservableProperty]
    private string resourceDescription = "";

    [ObservableProperty]
    private int selectedTopicIndex = -1;

    [ObservableProperty]
    private string selectedFileName = "";

    [ObservableProperty]
    private string selectedFileSize = "";

    [ObservableProperty]
    private string selectedFileType = "";

    [ObservableProperty]
    private int fileSizeKb = 0;

    [ObservableProperty]
    private bool hasSelectedFile = false;

    [ObservableProperty]
    private ObservableCollection<Topic> availableTopics = new();

    private void LoadTopics()
    {
        // Get topics from TopicsViewModel
        AvailableTopics = new ObservableCollection<Topic>(TopicsViewModel.AllTopics);
    }

    [RelayCommand]
    private async Task PickFile()
    {
        // TODO: Implement file picker
        // For now, simulate file selection
        SelectedFileName = "Sample_Document.pdf";
        SelectedFileType = "PDF";
        FileSizeKb = 1234;
        SelectedFileSize = $"{FileSizeKb} KB";
        HasSelectedFile = true;
    }

    [RelayCommand]
    private async Task Upload()
    {
        // Validate input
        if (!HasSelectedFile)
        {
            // TODO: Show error message
            return;
        }

        if (string.IsNullOrWhiteSpace(ResourceTitle))
        {
            // TODO: Show error message
            return;
        }

        if (SelectedTopicIndex < 0)
        {
            // TODO: Show error message
            return;
        }

        var selectedTopic = AvailableTopics[SelectedTopicIndex];

        // Create new resource
        var newResource = new LearningMaterial
        {
            MaterialId = new Random().Next(1000, 9999),
            FileName = SelectedFileName,
            Title = ResourceTitle,
            Description = ResourceDescription,
            FileType = SelectedFileType,
            SizeKb = FileSizeKb,
            UploaderName = "Current User", // Replace with actual user
            UploaderId = 1,
            UploaderRole = "Tutor", // or "Student"
            TopicId = selectedTopic.TopicId,
            TopicTitle = selectedTopic.TopicTitle,
            ModuleCode = selectedTopic.ModuleCode,
            UploadedAt = DateTime.Now,
            DownloadCount = 0,
            ViewCount = 0,
            Url = $"https://example.com/resources/{SelectedFileName}"
        };

        // Add to resources collection
        ResourcesLibraryViewModel.AllResources.Insert(0, newResource);

        // Update topic resource count
        selectedTopic.ResourceCount++;

        // TODO: Call API to upload file
        // await _apiService.UploadResourceAsync(newResource, fileStream);

        // Navigate back
        await _navigator.NavigateBackAsync(this);
    }

    [RelayCommand]
    private async Task NavigateBack()
    {
        await _navigator.NavigateBackAsync(this);
    }
}
