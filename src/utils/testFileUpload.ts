import { fileUploadService } from '../services/fileUploadService';

// Test file upload service functionality
export const testFileUploadService = () => {
  console.log('Testing FileUploadService...');
  
  // Test file type detection
  const testFiles = [
    'document.pdf',
    'image.jpg',
    'video.mp4',
    'audio.mp3',
    'unknown.txt'
  ];
  
  testFiles.forEach(fileName => {
    const type = (fileUploadService as any).getFileType(fileName);
    console.log(`${fileName} -> ${type}`);
  });
  
  // Test file size formatting
  const testSizes = [0, 1024, 1024 * 1024, 1024 * 1024 * 1024];
  testSizes.forEach(size => {
    const formatted = fileUploadService.formatFileSize(size);
    console.log(`${size} bytes -> ${formatted}`);
  });
  
  console.log('FileUploadService tests completed');
};

// Test file validation
export const testFileValidation = () => {
  console.log('Testing file validation...');
  
  // Create mock file objects
  const mockFiles = [
    { name: 'test.pdf', size: 1024 * 1024, type: 'application/pdf' }, // 1MB PDF - valid
    { name: 'large.pdf', size: 60 * 1024 * 1024, type: 'application/pdf' }, // 60MB PDF - too large
    { name: 'test.exe', size: 1024, type: 'application/x-executable' }, // Executable - invalid type
    { name: 'test.jpg', size: 5 * 1024 * 1024, type: 'image/jpeg' }, // 5MB JPG - valid
  ];
  
  mockFiles.forEach(file => {
    const validation = (fileUploadService as any).validateFile(file);
    console.log(`${file.name} (${file.type}, ${file.size} bytes) -> ${validation.isValid ? 'VALID' : 'INVALID'}: ${validation.error || 'OK'}`);
  });
  
  console.log('File validation tests completed');
};

