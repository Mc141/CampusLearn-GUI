using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace Uml_Implementation.Entities
{
    public class LearningMaterial : INotifyPropertyChanged
    {
        public int MaterialId { get; set; }
        
        private string _title = "";
        public string Title
        {
            get => _title;
            set
            {
                _title = value;
                OnPropertyChanged();
            }
        }

        private string _description = "";
        public string Description
        {
            get => _description;
            set
            {
                _description = value;
                OnPropertyChanged();
            }
        }

        public int TypeId { get; set; }
        public string FileType { get; set; } = ""; // PDF, DOCX, PNG, MP4, etc.
        public string FileName { get; set; } = "";
        public int SizeKb { get; set; }
        
        public string FileSizeFormatted
        {
            get
            {
                if (SizeKb < 1024) return $"{SizeKb} KB";
                var sizeMb = SizeKb / 1024.0;
                return $"{sizeMb:F2} MB";
            }
        }

        public string Url { get; set; } = "";
        public DateTime UploadedAt { get; set; }
        
        public string TimeAgo
        {
            get
            {
                var timeSpan = DateTime.Now - UploadedAt;
                if (timeSpan.TotalMinutes < 1) return "Just now";
                if (timeSpan.TotalMinutes < 60) return $"{(int)timeSpan.TotalMinutes} min ago";
                if (timeSpan.TotalHours < 24) return $"{(int)timeSpan.TotalHours} hr ago";
                if (timeSpan.TotalDays < 7) return $"{(int)timeSpan.TotalDays} day(s) ago";
                return UploadedAt.ToString("MMM dd, yyyy");
            }
        }

        public int UploaderId { get; set; }
        public string UploaderName { get; set; } = "";
        public string UploaderRole { get; set; } = "Student"; // Student or Tutor
        
        public int TopicId { get; set; }
        public string TopicTitle { get; set; } = "";
        public string ModuleCode { get; set; } = "";

        private int _downloadCount;
        public int DownloadCount
        {
            get => _downloadCount;
            set
            {
                _downloadCount = value;
                OnPropertyChanged();
            }
        }

        private int _viewCount;
        public int ViewCount
        {
            get => _viewCount;
            set
            {
                _viewCount = value;
                OnPropertyChanged();
            }
        }

        // Icon glyph based on file type
        public string FileIcon
        {
            get
            {
                return FileType.ToUpper() switch
                {
                    "PDF" => "\uE8A5", // PDF icon
                    "DOCX" or "DOC" => "\uE8A5", // Document icon
                    "PPTX" or "PPT" => "\uE8FD", // Presentation icon
                    "XLSX" or "XLS" => "\uE9F9", // Excel icon
                    "PNG" or "JPG" or "JPEG" => "\uE91B", // Image icon
                    "MP4" or "AVI" or "MOV" => "\uE714", // Video icon
                    "MP3" or "WAV" => "\uE8D6", // Audio icon
                    "ZIP" or "RAR" => "\uE8B7", // Archive icon
                    _ => "\uE8A5" // Default document icon
                };
            }
        }

        // Color for file type badge
        public string FileTypeColor
        {
            get
            {
                return FileType.ToUpper() switch
                {
                    "PDF" => "#D32F2F",
                    "DOCX" or "DOC" => "#1976D2",
                    "PPTX" or "PPT" => "#F57C00",
                    "XLSX" or "XLS" => "#388E3C",
                    "PNG" or "JPG" or "JPEG" => "#7B1FA2",
                    "MP4" or "AVI" or "MOV" => "#C62828",
                    "MP3" or "WAV" => "#00796B",
                    _ => "#616161"
                };
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public void Upload() => Console.WriteLine($"{Title} uploaded.");
        public void Download()
        {
            DownloadCount++;
            Console.WriteLine($"{Title} downloaded.");
        }
        public void View()
        {
            ViewCount++;
            Console.WriteLine($"{Title} viewed.");
        }
    }
}
