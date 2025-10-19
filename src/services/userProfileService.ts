import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  studentNumber?: string;
  modules?: string[];
  profilePicture?: string | null;
  githubUsername?: string;
  githubProfileUrl?: string;
  githubBio?: string;
  githubLocation?: string;
  githubWebsite?: string;
  githubCompany?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  notificationPreferences?: {
    new_messages: boolean;
    tutor_escalations: boolean;
    forum_replies: boolean;
    topic_replies: boolean;
    new_topics: boolean;
    new_answers: boolean;
  };
}

export const userProfileService = {
  // Update user profile
  async updateUserProfile(userId: string, profileData: UpdateUserProfileData): Promise<User> {
    try {
      console.log("💾 DEBUG: userProfileService.updateUserProfile called with:", {
        userId,
        profileData
      });

      // Build update object with only provided fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that are provided and not undefined
      if (profileData.firstName !== undefined) updateData.first_name = profileData.firstName;
      if (profileData.lastName !== undefined) updateData.last_name = profileData.lastName;
      if (profileData.studentNumber !== undefined) updateData.student_number = profileData.studentNumber;
      if (profileData.modules !== undefined) updateData.modules = profileData.modules;
      if (profileData.profilePicture !== undefined) updateData.profile_picture = profileData.profilePicture;
      if (profileData.githubUsername !== undefined) updateData.github_username = profileData.githubUsername;
      if (profileData.githubProfileUrl !== undefined) updateData.github_profile_url = profileData.githubProfileUrl;
      if (profileData.githubBio !== undefined) updateData.github_bio = profileData.githubBio;
      if (profileData.githubLocation !== undefined) updateData.github_location = profileData.githubLocation;
      if (profileData.githubWebsite !== undefined) updateData.github_website = profileData.githubWebsite;
      if (profileData.githubCompany !== undefined) updateData.github_company = profileData.githubCompany;
      if (profileData.emailNotifications !== undefined) updateData.email_notifications = profileData.emailNotifications;
      if (profileData.smsNotifications !== undefined) updateData.sms_notifications = profileData.smsNotifications;
      if (profileData.notificationPreferences !== undefined) updateData.notification_preferences = profileData.notificationPreferences;

      console.log("💾 DEBUG: Update data being sent to database:", updateData);

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user profile:', error);
        throw error;
      }

      console.log("✅ DEBUG: Database update successful, returned data:", data);
      return this.mapUserData(data);
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      return this.mapUserData(data);
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  },

  // Fetch GitHub profile data
  async fetchGitHubProfile(username: string): Promise<any> {
    try {
      const response = await fetch(`https://api.github.com/users/${username}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const githubData = await response.json();
      
      return {
        githubUsername: githubData.login,
        githubProfileUrl: githubData.html_url,
        githubBio: githubData.bio || '',
        githubLocation: githubData.location || '',
        githubWebsite: githubData.blog || '',
        githubCompany: githubData.company || ''
      };
    } catch (error) {
      console.error('Error fetching GitHub profile:', error);
      throw error;
    }
  },

  // Helper function to map database user data to User interface
  mapUserData(data: any): User {
    console.log("🔄 DEBUG: Mapping user data from database:", {
      emailNotifications: data.email_notifications,
      smsNotifications: data.sms_notifications,
      notificationPreferences: data.notification_preferences
    });

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      studentNumber: data.student_number || undefined,
      modules: data.modules || [],
      profilePicture: data.profile_picture || undefined,
      githubUsername: data.github_username || undefined,
      githubProfileUrl: data.github_profile_url || undefined,
      githubBio: data.github_bio || undefined,
      githubLocation: data.github_location || undefined,
      githubWebsite: data.github_website || undefined,
      githubCompany: data.github_company || undefined,
      emailNotifications: data.email_notifications ?? true,
      smsNotifications: data.sms_notifications ?? false,
      notificationPreferences: data.notification_preferences || {
        new_messages: true,
        tutor_escalations: true,
        forum_replies: true,
        topic_replies: true,
        new_topics: true,
        new_answers: true,
      },
      createdAt: new Date(data.created_at),
      lastLogin: data.last_login ? new Date(data.last_login) : undefined
    };
  }
};
