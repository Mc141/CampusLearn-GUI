using System.Collections.ObjectModel;
using Uml_Implementation.Entities;

namespace CampusLearn.Presentation;

public partial class ResourcesLibraryViewModel : ObservableObject
{
    private readonly INavigator _navigator;
    
    // Static collection to share resources across navigation
    public static ObservableCollection<LearningMaterial> AllResources { get; set; } = new();

    public ResourcesLibraryViewModel(INavigator navigator)
    {
        _navigator = navigator;
        if (AllResources.Count == 0)
        {
            LoadSampleResources();
        }
        else
        {
            Resources = AllResources;
            ApplyFilter();
        }
    }

    [ObservableProperty]
    private ObservableCollection<LearningMaterial> resources = new();

    [ObservableProperty]
    private ObservableCollection<LearningMaterial> filteredResources = new();

    [ObservableProperty]
    private string selectedFilter = "All";

    [ObservableProperty]
    private string searchQuery = "";

    private void LoadSampleResources()
    {
        AllResources = new ObservableCollection<LearningMaterial>
        {
            new LearningMaterial
            {
                MaterialId = 1,
                FileName = "SQL_Joins_Guide.pdf",
                Title = "Complete Guide to SQL Joins",
                Description = "Comprehensive guide covering INNER, LEFT, RIGHT, and FULL OUTER joins",
                FileType = "PDF",
                SizeKb = 1843,
                UploaderName = "Prof. Smith",
                UploaderId = 10,
                UploaderRole = "Tutor",
                TopicId = 1,
                TopicTitle = "SQL JOIN Operations",
                ModuleCode = "BIT222",
                UploadedAt = DateTime.Now.AddDays(-5),
                DownloadCount = 45,
                ViewCount = 120,
                Url = "https://example.com/resources/sql_joins.pdf"
            },
            new LearningMaterial
            {
                MaterialId = 2,
                FileName = "Java_Collections_Presentation.pptx",
                Title = "Java Collections Framework Overview",
                Description = "Slides explaining ArrayList, LinkedList, HashMap, and more",
                FileType = "PPTX",
                SizeKb = 2456,
                UploaderName = "Dr. Williams",
                UploaderId = 11,
                UploaderRole = "Tutor",
                TopicId = 2,
                TopicTitle = "Java Collections Framework",
                ModuleCode = "BIT311",
                UploadedAt = DateTime.Now.AddDays(-2),
                DownloadCount = 32,
                ViewCount = 85,
                Url = "https://example.com/resources/java_collections.pptx"
            },
            new LearningMaterial
            {
                MaterialId = 3,
                FileName = "UML_Class_Diagram_Example.png",
                Title = "UML Class Diagram with Inheritance",
                Description = "Example showing proper inheritance notation",
                FileType = "PNG",
                SizeKb = 643,
                UploaderName = "Prof. Davis",
                UploaderId = 12,
                UploaderRole = "Tutor",
                TopicId = 3,
                TopicTitle = "UML Class Diagrams",
                ModuleCode = "BIT216",
                UploadedAt = DateTime.Now.AddHours(-6),
                DownloadCount = 28,
                ViewCount = 67,
                Url = "https://example.com/resources/uml_example.png"
            },
            new LearningMaterial
            {
                MaterialId = 4,
                FileName = "React_Hooks_Tutorial.mp4",
                Title = "React Hooks Complete Tutorial",
                Description = "Video tutorial covering useState, useEffect, and custom hooks",
                FileType = "MP4",
                SizeKb = 8756,
                UploaderName = "Dr. Williams",
                UploaderId = 11,
                UploaderRole = "Tutor",
                TopicId = 4,
                TopicTitle = "React Hooks Explained",
                ModuleCode = "BIT311",
                UploadedAt = DateTime.Now.AddDays(-1),
                DownloadCount = 56,
                ViewCount = 142,
                Url = "https://example.com/resources/react_hooks.mp4"
            },
            new LearningMaterial
            {
                MaterialId = 5,
                FileName = "Accounting_Practice_Questions.docx",
                Title = "Financial Accounting Practice Problems",
                Description = "50 practice questions with solutions",
                FileType = "DOCX",
                SizeKb = 456,
                UploaderName = "Prof. Taylor",
                UploaderId = 13,
                UploaderRole = "Tutor",
                TopicId = 5,
                TopicTitle = "Financial Accounting Basics",
                ModuleCode = "BCom101",
                UploadedAt = DateTime.Now.AddHours(-12),
                DownloadCount = 71,
                ViewCount = 95,
                Url = "https://example.com/resources/accounting_questions.docx"
            },
            new LearningMaterial
            {
                MaterialId = 6,
                FileName = "Database_Normalization_Notes.pdf",
                Title = "Database Normalization Study Notes",
                Description = "Notes on 1NF, 2NF, 3NF, and BCNF with examples",
                FileType = "PDF",
                SizeKb = 1234,
                UploaderName = "Prof. Smith",
                UploaderId = 10,
                UploaderRole = "Tutor",
                TopicId = 1,
                TopicTitle = "SQL JOIN Operations",
                ModuleCode = "BIT222",
                UploadedAt = DateTime.Now.AddDays(-3),
                DownloadCount = 38,
                ViewCount = 92,
                Url = "https://example.com/resources/normalization.pdf"
            }
        };

        Resources = AllResources;
        ApplyFilter();
    }

    partial void OnSearchQueryChanged(string value)
    {
        ApplyFilter();
    }

    [RelayCommand]
    private void ApplyFilter()
    {
        var filtered = Resources.AsEnumerable();

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(SearchQuery))
        {
            filtered = filtered.Where(r =>
                r.FileName.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                r.Title.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                r.Description.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase) ||
                r.ModuleCode.Contains(SearchQuery, StringComparison.OrdinalIgnoreCase));
        }

        // Apply file type filter
        filtered = SelectedFilter switch
        {
            "Documents" => filtered.Where(r => r.FileType == "PDF" || r.FileType == "DOCX" || r.FileType == "PPTX"),
            "Videos" => filtered.Where(r => r.FileType == "MP4" || r.FileType == "AVI" || r.FileType == "MOV"),
            "Images" => filtered.Where(r => r.FileType == "PNG" || r.FileType == "JPG" || r.FileType == "JPEG"),
            _ => filtered
        };

        // Sort by most recent
        filtered = filtered.OrderByDescending(r => r.UploadedAt);

        FilteredResources = new ObservableCollection<LearningMaterial>(filtered);
    }

    [RelayCommand]
    private void SelectFilter(string filter)
    {
        SelectedFilter = filter;
        ApplyFilter();
    }

    [RelayCommand]
    private void DownloadResource(LearningMaterial resource)
    {
        resource.Download();
        // TODO: Call API to download file
        // TODO: Increment download count in database
    }

    [RelayCommand]
    private async Task UploadResource()
    {
        await _navigator.NavigateViewModelAsync<UploadResourceViewModel>(this);
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
}
