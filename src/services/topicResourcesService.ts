import { supabase, dbQuery } from '../lib/supabase';
import { fileUploadService } from './fileUploadService';
import { v4 as uuidv4 } from 'uuid';
import { topicSubscriptionService } from './topicSubscriptionService';

export interface TopicResource {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'video_link' | 'audio' | 'image' | 'link' | 'document' | 'presentation' | 'spreadsheet' | 'text';
  url: string;
  file_name?: string;
  file_path?: string;
  topic_id?: string;
  module_id?: string;
  uploaded_by: string;
  size?: number;
  downloads: number;
  tags: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  video_metadata?: {
    title?: string;
    duration?: string;
    thumbnail?: string;
    platform?: 'youtube' | 'vimeo' | 'other';
  };
  // Additional fields for display
  uploaded_by_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateTopicResourceData {
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'video_link' | 'audio' | 'image' | 'link' | 'document' | 'presentation' | 'spreadsheet' | 'text';
  url?: string; // For links and video links
  tags?: string[];
  video_metadata?: {
    title?: string;
    duration?: string;
    thumbnail?: string;
    platform?: 'youtube' | 'vimeo' | 'other';
  };
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export const topicResourcesService = {
  // Get all resources for a specific topic
  async getResourcesForTopic(topicId: string): Promise<TopicResource[]> {
    try {
      const { data, error } = await supabase
        .from('topic_resources')
        .select(`
          *,
          uploaded_by_user:users!topic_resources_uploaded_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('topic_id', topicId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(topicResourcesService.mapResourceToTopicResource);
    } catch (error) {
      console.error('Error fetching topic resources:', error);
      throw error;
    }
  },

  // Get all resources uploaded by a specific user
  async getResourcesByUser(userId: string): Promise<TopicResource[]> {
    try {
      const { data, error } = await supabase
        .from('topic_resources')
        .select(`
          *,
          uploaded_by_user:users!topic_resources_uploaded_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('uploaded_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(topicResourcesService.mapResourceToTopicResource);
    } catch (error) {
      console.error('Error fetching user resources:', error);
      throw error;
    }
  },

  // Upload files to a topic
  async uploadFilesToTopic(
    topicId: string,
    files: File[],
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<TopicResource[]> {
    try {
      const uploadedResources: TopicResource[] = [];

      for (const file of files) {
        try {
          // Upload file to storage
          const uploadedFile = await fileUploadService.uploadFile(
            file,
            `topic-resources/${topicId}`,
            onProgress
          );

          // Create resource record in database
          const resourceData: CreateTopicResourceData = {
            title: file.name,
            description: `Uploaded file: ${file.name}`,
            type: topicResourcesService.getFileType(file.type),
            tags: []
          };

          const resource = await this.createResource(
            resourceData,
            topicId,
            userId,
            uploadedFile.url,
            uploadedFile.name,
            uploadedFile.size
          );

          uploadedResources.push(resource);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          onProgress?.({
            fileId: uuidv4(),
            fileName: file.name,
            progress: 0,
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          });
        }
      }

      return uploadedResources;
    } catch (error) {
      console.error('Error uploading files to topic:', error);
      throw error;
    }
  },

  // Create a video link resource
  async createVideoLinkResource(
    topicId: string,
    videoUrl: string,
    title: string,
    description: string,
    userId: string
  ): Promise<TopicResource> {
    try {
      // Detect video platform and extract metadata
      const videoInfo = this.extractVideoInfo(videoUrl);
      
      const resourceData: CreateTopicResourceData = {
        title: title || videoInfo.title || 'Video Resource',
        description: description || `Video link: ${videoUrl}`,
        type: 'video_link',
        url: videoUrl,
        video_metadata: videoInfo,
        tags: []
      };

      return await this.createResource(resourceData, topicId, userId, videoUrl);
    } catch (error) {
      console.error('Error creating video link resource:', error);
      throw error;
    }
  },

  // Extract video information from URL
  extractVideoInfo(url: string): {
    title?: string;
    duration?: string;
    thumbnail?: string;
    platform: 'youtube' | 'vimeo' | 'other';
  } {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const vimeoRegex = /vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/;
    
    if (youtubeRegex.test(url)) {
      const match = url.match(youtubeRegex);
      const videoId = match ? match[1] : '';
      return {
        platform: 'youtube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        title: 'YouTube Video'
      };
    } else if (vimeoRegex.test(url)) {
      return {
        platform: 'vimeo',
        title: 'Vimeo Video'
      };
    } else {
      return {
        platform: 'other',
        title: 'Video Link'
      };
    }
  },

  // Validate video URL
  isValidVideoUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+/;
    const otherVideoRegex = /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i;
    
    return youtubeRegex.test(url) || vimeoRegex.test(url) || otherVideoRegex.test(url);
  },
  async createResource(
    resourceData: CreateTopicResourceData,
    topicId: string,
    userId: string,
    url?: string,
    fileName?: string,
    fileSize?: number
  ): Promise<TopicResource> {
    try {
      console.log('Creating resource with data:', {
        title: resourceData.title,
        description: resourceData.description,
        type: resourceData.type,
        url: url || resourceData.url || '',
        file_name: fileName || '',
        file_path: url ? `topic-resources/${topicId}/${fileName}` : '',
        topic_id: topicId,
        uploaded_by: userId,
        size: fileSize,
        tags: resourceData.tags || [],
        is_active: true
      });

      // Use direct supabase call like messagingService does
      const { data, error } = await supabase
        .from('topic_resources')
        .insert([{
          title: resourceData.title,
          description: resourceData.description,
          type: resourceData.type,
          url: url || resourceData.url || '',
          file_name: fileName || '',
          file_path: url ? `topic-resources/${topicId}/${fileName}` : '',
          topic_id: topicId,
          uploaded_by: userId,
          size: fileSize,
          tags: resourceData.tags || [],
          video_metadata: resourceData.video_metadata || null,
          is_active: true
        }])
        .select(`
          *,
          uploaded_by_user:users!topic_resources_uploaded_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      console.log('Database response:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from database insert');
        throw new Error('No data returned from database insert');
      }

      const resource = topicResourcesService.mapResourceToTopicResource(data);

      // Send notifications to topic subscribers
      try {
        const authorName = `${data.uploaded_by_user.first_name} ${data.uploaded_by_user.last_name}`;
        
        await topicSubscriptionService.notifyNewResource(
          topicId,
          resourceData.title,
          resourceData.type,
          authorName,
          data.id
        );
      } catch (notificationError) {
        console.error('Error sending topic subscription notifications:', notificationError);
        // Don't fail the resource creation if notification fails
      }

      return resource;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  },

  // Update resource
  async updateResource(
    resourceId: string,
    updates: Partial<CreateTopicResourceData>
  ): Promise<TopicResource> {
    try {
      const { data, error } = await dbQuery(() =>
        supabase
          .from('topic_resources')
          .update({
            title: updates.title,
            description: updates.description,
            tags: updates.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', resourceId)
          .select(`
            *,
            uploaded_by_user:users!topic_resources_uploaded_by_fkey(
              id,
              first_name,
              last_name,
              email
            )
          `)
          .single(),
        3, 1000, 15000, 'updateResource'
      );

      if (error) throw error;

      return topicResourcesService.mapResourceToTopicResource(data || {});
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  },

  // Delete resource
  async deleteResource(resourceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('topic_resources')
        .update({ is_active: false })
        .eq('id', resourceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  // Increment download count
  async incrementDownloadCount(resourceId: string): Promise<void> {
    try {
      // First get the current download count
      const { data: currentResource, error: fetchError } = await supabase
        .from('topic_resources')
        .select('downloads')
        .eq('id', resourceId)
        .single();

      if (fetchError) throw fetchError;

      // Then update with the incremented count
      const { error } = await supabase
        .from('topic_resources')
        .update({ downloads: (currentResource?.downloads || 0) + 1 })
        .eq('id', resourceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing download count:', error);
      throw error;
    }
  },

  // Helper method to determine file type from MIME type
  getFileType(mimeType: string): 'pdf' | 'video' | 'audio' | 'image' | 'document' | 'presentation' | 'spreadsheet' | 'text' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.startsWith('text/')) return 'text';
    return 'document'; // Default fallback
  },

  // Helper method to map database result to TopicResource
  mapResourceToTopicResource(data: any): TopicResource {
    console.log('Mapping resource data:', data); // Debug log
    
    // Check if data is empty or invalid
    if (!data || !data.id) {
      console.error('Invalid resource data received:', data);
      throw new Error('Invalid resource data received from database');
    }
    
    return {
      id: data.id,
      title: data.title || 'Untitled',
      description: data.description || '',
      type: data.type || 'document', // Default fallback
      url: data.url || '',
      file_name: data.file_name || '',
      file_path: data.file_path || '',
      topic_id: data.topic_id,
      module_id: undefined, // Not used in topic_resources table
      uploaded_by: data.uploaded_by,
      size: data.size || 0,
      downloads: data.downloads || 0,
      tags: data.tags || [],
      is_active: data.is_active !== false, // Default to true
      created_at: data.created_at ? new Date(data.created_at) : new Date(),
      updated_at: data.updated_at ? new Date(data.updated_at) : new Date(),
      video_metadata: data.video_metadata || undefined,
      uploaded_by_user: data.uploaded_by_user ? {
        id: data.uploaded_by_user.id,
        first_name: data.uploaded_by_user.first_name,
        last_name: data.uploaded_by_user.last_name,
        email: data.uploaded_by_user.email
      } : undefined
    };
  }
};
