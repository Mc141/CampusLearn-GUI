import { supabase, dbQuery } from '../lib/supabase';
import type { ChatMessage } from '../hooks/useRealtimeChat';
import { notificationService } from './notificationService';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: MessageAttachment[];
  isRead: boolean;
  createdAt: Date;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'link';
  url: string;
  size?: number;
}

export interface Conversation {
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage?: Message;
  unreadCount: number;
  topicId?: string;
  topicTitle?: string;
}

export interface CreateMessageData {
  senderId: string;
  receiverId: string;
  content: string;
  topicId?: string;
}

export const messagingService = {
  // Get all conversations for a user (grouped by other user)
  async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          receiver:users!messages_receiver_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(200); // Limit to prevent huge queries

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      // Group messages by conversation partner
      const conversationsMap = new Map<string, Conversation>();

      messages.forEach((msg: any) => {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;

        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            userId: otherUserId,
            userName: `${otherUser.first_name} ${otherUser.last_name}`,
            userEmail: otherUser.email,
            unreadCount: 0,
            lastMessage: undefined,
          });
        }

        const conversation = conversationsMap.get(otherUserId)!;
        
        // Update unread count
        if (!msg.is_read && msg.sender_id !== userId) {
          conversation.unreadCount++;
        }

        // Set last message if this is more recent
        if (!conversation.lastMessage || new Date(msg.created_at) > conversation.lastMessage.createdAt) {
          conversation.lastMessage = {
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            isRead: msg.is_read,
            createdAt: new Date(msg.created_at),
          };
        }
      });

      return Array.from(conversationsMap.values()).sort((a, b) => {
        if (!a.lastMessage || !b.lastMessage) return 0;
        return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
      });
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      throw error;
    }
  },

  // Get messages between two users
  async getMessagesBetweenUsers(userId1: string, userId2: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          attachments:message_attachments(
            attachment:attachments(
              id,
              name,
              type,
              url,
              size,
              uploaded_at
            )
          )
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true })
        .limit(100); // Limit to prevent huge queries

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return data.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        isRead: msg.is_read,
        createdAt: new Date(msg.created_at),
        attachments: msg.attachments?.map((att: any) => ({
          id: att.attachment.id,
          name: att.attachment.name,
          type: att.attachment.type,
          url: att.attachment.url,
          size: att.attachment.size,
          uploadedAt: new Date(att.attachment.uploaded_at),
        })) || [],
      }));
    } catch (error) {
      console.error('Error in getMessagesBetweenUsers:', error);
      throw error;
    }
  },

  // Send a message
  async sendMessage(data: CreateMessageData): Promise<Message> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: data.senderId,
            receiver_id: data.receiverId,
            content: data.content,
            is_read: false,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      return {
        id: message.id,
        senderId: message.sender_id,
        receiverId: message.receiver_id,
        content: message.content,
        isRead: message.is_read,
        createdAt: new Date(message.created_at),
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  },

  // Mark messages as read
  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId);

      if (error) {
        console.error('Error marking messages as read:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error);
      throw error;
    }
  },

  // Get available tutors for a topic (for starting conversations)
  async getAvailableTutorsForTopic(topicId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('topic_tutors')
        .select(`
          tutor:users!topic_tutors_tutor_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('topic_id', topicId);

      if (error) {
        console.error('Error fetching available tutors:', error);
        throw error;
      }

      return data.map(item => ({
        id: item.tutor.id,
        firstName: item.tutor.first_name,
        lastName: item.tutor.last_name,
        email: item.tutor.email,
      }));
    } catch (error) {
      console.error('Error in getAvailableTutorsForTopic:', error);
      throw error;
    }
  },

  // Get user details by ID
  async getUserById(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        throw error;
      }

      return {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
      };
    } catch (error) {
      console.error('Error in getUserById:', error);
      throw error;
    }
  },

  // Convert ChatMessage to Message format
  chatMessageToMessage(chatMessage: ChatMessage, senderId: string, receiverId: string): Message {
    return {
      id: chatMessage.id,
      senderId,
      receiverId,
      content: chatMessage.content,
      isRead: false,
      createdAt: new Date(chatMessage.createdAt),
    };
  },

  // Convert Message to ChatMessage format
  messageToChatMessage(message: Message, senderName: string): ChatMessage {
    return {
      id: message.id,
      content: message.content,
      user: {
        name: senderName,
      },
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments?.map(att => ({
        id: att.id,
        name: att.name,
        type: att.type,
        url: att.url,
        size: att.size,
        uploadedAt: att.uploadedAt,
      })),
    };
  },

  // Store messages from RealtimeChat
  async storeMessages(messages: ChatMessage[], senderId: string, receiverId: string): Promise<void> {
    try {
      // Convert ChatMessages to Message format and store in database
      const messagesToStore = messages.map(msg => ({
        id: msg.id,
        sender_id: senderId,
        receiver_id: receiverId,
        content: msg.content,
        is_read: false,
        created_at: msg.createdAt,
      }));

      // Insert messages (ignore duplicates)
      const { error } = await supabase
        .from('messages')
        .upsert(messagesToStore, { 
          onConflict: 'id',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('Error storing messages:', error);
        throw error;
      }

      console.log('Messages stored successfully');

      // Create notification for the receiver (only once per message batch)
      try {
        // Check if we already created a notification for this message batch
        const messageIds = messages.map(msg => msg.id).sort().join(',');
        const notificationKey = `msg-${senderId}-${receiverId}-${messageIds}`;
        
        // Simple in-memory cache to prevent duplicates (clears on page refresh)
        if (!window.notificationCache) {
          window.notificationCache = new Set();
        }
        
        if (window.notificationCache.has(notificationKey)) {
          return; // Skip duplicate notification
        }
        
        window.notificationCache.add(notificationKey);
        
        // Get sender's name for the notification
        const { data: senderData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', senderId)
          .single();

        if (senderData) {
          const senderName = `${senderData.first_name} ${senderData.last_name}`;
          const conversationId = messagingService.generateRoomName(senderId, receiverId);
          
          await notificationService.notifyNewMessage(receiverId, senderName, conversationId);
        }
      } catch (notificationError) {
        console.error('Error creating message notification:', notificationError);
        // Don't fail the message storage if notification fails
      }

      // Handle attachments if they exist
      for (const message of messages) {
        if (message.attachments && message.attachments.length > 0) {
          // Store attachments
          const attachmentsToStore = message.attachments.map(att => ({
            id: att.id,
            name: att.name,
            type: att.type,
            url: att.url,
            size: att.size,
            uploaded_by: senderId,
            uploaded_at: att.uploadedAt.toISOString(),
          }));

          // Insert attachments (ignore duplicates)
          const { error: attachmentError } = await supabase
            .from('attachments')
            .upsert(attachmentsToStore, { 
              onConflict: 'id',
              ignoreDuplicates: true 
            });

          if (attachmentError) {
            console.error('Error storing attachments:', attachmentError);
            // Don't throw here, just log the error
          }

          // Link attachments to message
          const messageAttachments = message.attachments.map(att => ({
            message_id: message.id,
            attachment_id: att.id,
          }));

          const { error: linkError } = await supabase
            .from('message_attachments')
            .upsert(messageAttachments, { 
              onConflict: 'message_id,attachment_id',
              ignoreDuplicates: true 
            });

          if (linkError) {
            console.error('Error linking attachments to message:', linkError);
            // Don't throw here, just log the error
          }
        }
      }
    } catch (error) {
      console.error('Error in storeMessages:', error);
      throw error;
    }
  },

  // Generate room name for conversation
  generateRoomName(userId1: string, userId2: string): string {
    // Sort IDs to ensure consistent room name regardless of order
    const sortedIds = [userId1, userId2].sort();
    return `conversation-${sortedIds[0]}-${sortedIds[1]}`;
  },
};