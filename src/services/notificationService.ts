import { supabase } from "../lib/supabase";
import { emailService, EmailPreferences } from "./emailService";

export interface Notification {
  id: string;
  userId: string;
  type: 'new_message' | 'new_escalation' | 'forum_reply' | 'topic_reply' | 'new_topic' | 'new_answer' | 'new_resource' | 'tutor_assignment' | 'moderation_action';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  relatedEntityId?: string;
  createdAt: string;
}

export interface CreateNotificationData {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  link?: string;
  relatedEntityId?: string;
}

class NotificationService {
  // Create a new notification
  async createNotification(data: CreateNotificationData): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from("notifications")
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link,
          related_entity_id: data.relatedEntityId,
        })
        .select()
        .single();

      if (error) {
        console.error(" Error creating notification:", error);
        return null;
      }

      const mappedNotification = this.mapNotification(notification);
      
      // Send email notification if enabled
      await this.sendEmailNotificationIfEnabled(data.userId, data.type, data.title, data.message, data.link);

      return mappedNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  // Send email notification if user has email notifications enabled
  private async sendEmailNotificationIfEnabled(
    userId: string, 
    type: Notification['type'], 
    title: string, 
    message: string, 
    link?: string
  ): Promise<void> {
    try {
      // Get user profile to check email preferences
      const { data: userProfile, error } = await supabase
        .from("users")
        .select("email, first_name, last_name, email_notifications, notification_preferences")
        .eq("id", userId)
        .single();

      if (error || !userProfile) {
        console.log("Could not fetch user profile for email notification:", error);
        return;
      }

      // Check if email notifications are enabled
      if (!userProfile.email_notifications) {
        console.log("Email notifications disabled for user:", userId);
        return;
      }

      // Check specific notification type preference
      const preferences = userProfile.notification_preferences as EmailPreferences['notification_preferences'] || {};
      const notificationTypeKey = this.getNotificationTypeKey(type);
      
      if (notificationTypeKey && preferences[notificationTypeKey] === false) {
        console.log("Email notifications disabled for type:", type);
        return;
      }

      // Send email notification
      const recipientName = `${userProfile.first_name} ${userProfile.last_name}`.trim() || "User";
      const fullLink = link ? `${window.location.origin}${link}` : window.location.origin;
      
      await emailService.sendEmailNotification({
        to_email: userProfile.email,
        to_name: recipientName,
        notification_type: this.getEmailNotificationType(type),
        notification_title: title,
        notification_message: message,
        notification_link: fullLink,
        platform_name: 'CampusLearn'
      });

      console.log("Email notification sent successfully to:", userProfile.email);
    } catch (error) {
      console.error("Error sending email notification:", error);
      // Don't throw error - email failure shouldn't break the notification system
    }
  }

  // Map notification type to email notification type
  private getEmailNotificationType(type: Notification['type']): string {
    const typeMap: Record<Notification['type'], string> = {
      'new_message': 'New Message',
      'new_escalation': 'Tutor Escalation',
      'forum_reply': 'Forum Reply',
      'topic_reply': 'Topic Reply',
      'new_topic': 'New Topic',
      'new_answer': 'New Answer',
      'new_resource': 'New Resource',
      'tutor_assignment': 'Tutor Assignment',
      'moderation_action': 'Moderation Action'
    };
    return typeMap[type] || 'Notification';
  }

  // Map notification type to preference key
  private getNotificationTypeKey(type: Notification['type']): keyof EmailPreferences['notification_preferences'] | null {
    const keyMap: Record<Notification['type'], keyof EmailPreferences['notification_preferences'] | null> = {
      'new_message': 'new_messages',
      'new_escalation': 'tutor_escalations',
      'forum_reply': 'forum_replies',
      'topic_reply': 'topic_replies',
      'new_topic': 'new_topics',
      'new_answer': 'new_answers',
      'answer_reply': 'topic_replies',
      'new_resource': null,
      'tutor_assignment': null,
      'moderation_action': null
    };
    return keyMap[type];
  }

  // Get notifications for a user
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      console.log('Getting notifications for user:', userId);
      
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error(" Error fetching notifications:", error);
        return [];
      }

      console.log('Raw notifications data:', data);
      const mappedNotifications = (data || []).map(this.mapNotification);
      console.log('Mapped notifications:', mappedNotifications);
      
      return mappedNotifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      console.log('Getting unread count for user:', userId);
      
      const { data, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error(" Error fetching unread count:", error);
        return 0;
      }

      console.log('Unread count query result:', data);
      console.log('Actual unread count:', data?.length || 0);
      
      return data?.length || 0;
    } catch (error) {
      console.error("Error fetching unread count:", error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  // Helper method to map database record to interface
  private mapNotification(record: any): Notification {
    return {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      title: record.title,
      message: record.message,
      link: record.link,
      isRead: record.is_read,
      relatedEntityId: record.related_entity_id,
      createdAt: record.created_at,
    };
  }

  // Convenience methods for common notification types
  async notifyNewMessage(recipientId: string, senderName: string, conversationId: string): Promise<void> {
    const notification = await this.createNotification({
      userId: recipientId,
      type: 'new_message',
      title: 'New Message',
      message: `You received a new message from ${senderName}`,
      link: `/messages?conversation=${conversationId}`,
      // Don't pass relatedEntityId for messages - it expects UUID but we have a string
    });
  }

  async notifyNewEscalation(tutorId: string, studentName: string, moduleCode: string, escalationId: string): Promise<void> {
    await this.createNotification({
      userId: tutorId,
      type: 'new_escalation',
      title: 'New Escalation Assignment',
      message: `You've been assigned a new escalation from ${studentName} for ${moduleCode}`,
      link: `/tutor/escalations`,
      relatedEntityId: escalationId, // This should be a valid UUID
    });
  }

  async notifyForumReply(postAuthorId: string, replierName: string, postTitle: string, postId: string): Promise<void> {
    await this.createNotification({
      userId: postAuthorId,
      type: 'forum_reply',
      title: 'New Forum Reply',
      message: `${replierName} replied to your post: "${postTitle}"`,
      link: `/forum/post/${postId}`,
      relatedEntityId: postId, // This should be a valid UUID
    });
  }

  async notifyTopicReply(answerAuthorId: string, replierName: string, topicTitle: string, answerId: string): Promise<void> {
    await this.createNotification({
      userId: answerAuthorId,
      type: 'topic_reply',
      title: 'New Topic Reply',
      message: `${replierName} replied to your answer in topic: "${topicTitle}"`,
      link: `/topics/${answerId}`,
      relatedEntityId: answerId, // This should be a valid UUID
    });
  }

  async notifyNewTopic(tutorIds: string[], topicTitle: string, moduleCode: string, topicId: string): Promise<void> {
    const notifications = tutorIds.map(tutorId => ({
      userId: tutorId,
      type: 'new_topic' as const,
      title: 'New Topic Created',
      message: `A new topic "${topicTitle}" has been created for ${moduleCode}`,
      link: `/topics/${topicId}`,
      relatedEntityId: topicId, // This should be a valid UUID
    }));

    // Create all notifications
    await Promise.all(notifications.map(notification => this.createNotification(notification)));
  }

  async notifyNewAnswer(questionAuthorId: string, answererName: string, questionTitle: string, questionId: string): Promise<void> {
    await this.createNotification({
      userId: questionAuthorId,
      type: 'new_answer',
      title: 'New Answer',
      message: `${answererName} answered your question: "${questionTitle}"`,
      link: `/topics/question/${questionId}`,
      relatedEntityId: questionId, // This should be a valid UUID
    });
  }
}

export const notificationService = new NotificationService();
