import { supabase } from "../lib/supabase";
import { ChatbotMessage } from "./chatbotService";

export interface ChatbotConversation {
  id: string;
  userId: string;
  title?: string;
  messageCount: number;
  isActive: boolean;
  contextLimitReached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotMessageRecord {
  id: string;
  conversationId: string;
  content: string;
  isFromBot: boolean;
  escalatedToTutor: boolean;
  tutorModule?: string;
  confidenceScore?: number;
  createdAt: string;
}

class ChatbotConversationService {
  private readonly MAX_MESSAGES = 50; // Context limit
  private readonly WARNING_THRESHOLD = 45; // Show warning at this count

  async getActiveConversation(userId: string): Promise<ChatbotConversation | null> {
    try {
      console.log("🔍 Looking for active conversation for user:", userId);
      
      const { data, error } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      console.log("📊 Active conversation query result:", { data, error });

      if (error) {
        console.error("❌ Error fetching active conversation:", error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log("ℹ️ No active conversation found");
        return null;
      }

      console.log("✅ Found active conversation:", data[0]);
      return data[0];
    } catch (error) {
      console.error("💥 Exception fetching active conversation:", error);
      return null;
    }
  }

  async createConversation(userId: string, title?: string): Promise<ChatbotConversation | null> {
    try {
      console.log("🆕 Creating conversation for user:", userId);
      
      const insertData = {
        user_id: userId,
        title: title || "New Chat",
        message_count: 0,
        is_active: true,
        context_limit_reached: false,
      };
      
      console.log("💾 Creating conversation with data:", insertData);
      
      const { data, error } = await supabase
        .from("chatbot_conversations")
        .insert(insertData)
        .select()
        .single();

      console.log("📊 Create conversation response:", { data, error });

      if (error) {
        console.error("❌ Error creating conversation:", error);
        return null;
      }

      console.log("✅ Conversation created successfully:", data);
      return data;
    } catch (error) {
      console.error("💥 Exception creating conversation:", error);
      return null;
    }
  }

  async getMessages(conversationId: string): Promise<ChatbotMessageRecord[]> {
    try {
      console.log("📨 Fetching messages for conversation:", conversationId);
      
      const { data, error } = await supabase
        .from("chatbot_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      console.log("📊 Messages query result:", { data, error });

      if (error) {
        console.error("❌ Error fetching messages:", error);
        return [];
      }

      console.log("✅ Found messages:", data?.length || 0);
      
      // Map database column names to interface properties
      const mappedMessages = (data || []).map((dbRecord: any) => ({
        id: dbRecord.id,
        conversationId: dbRecord.conversation_id,
        content: dbRecord.content,
        isFromBot: dbRecord.is_from_bot, // Map database column to interface property
        escalatedToTutor: dbRecord.escalated_to_tutor,
        tutorModule: dbRecord.tutor_module,
        confidenceScore: dbRecord.confidence_score,
        createdAt: dbRecord.created_at,
      }));
      
      console.log("🔄 Mapped database records:", mappedMessages);
      return mappedMessages;
    } catch (error) {
      console.error("💥 Exception fetching messages:", error);
      return [];
    }
  }

  async addMessage(
    conversationId: string,
    message: Omit<ChatbotMessageRecord, "id" | "conversationId" | "createdAt">
  ): Promise<ChatbotMessageRecord | null> {
    try {
      console.log("🔍 Adding message to conversation:", conversationId);
      console.log("📝 Message data:", message);
      
      const insertData = {
        conversation_id: conversationId,
        content: message.content,
        is_from_bot: message.isFromBot,
        escalated_to_tutor: message.escalatedToTutor,
        tutor_module: message.tutorModule,
        confidence_score: message.confidenceScore,
      };
      
      console.log("💾 Insert data:", insertData);
      
      const { data, error } = await supabase
        .from("chatbot_messages")
        .insert(insertData)
        .select()
        .single();

      console.log("📊 Database response:", { data, error });

      if (error) {
        console.error("❌ Error adding message:", error);
        return null;
      }

      console.log("✅ Message added successfully:", data);

      // Update message count
      await this.updateMessageCount(conversationId);

      return data;
    } catch (error) {
      console.error("💥 Exception adding message:", error);
      return null;
    }
  }

  async updateMessageCount(conversationId: string): Promise<void> {
    try {
      const { count, error } = await supabase
        .from("chatbot_messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conversationId);

      if (error) {
        console.error("Error counting messages:", error);
        return;
      }

      const messageCount = count || 0;
      const contextLimitReached = messageCount >= this.MAX_MESSAGES;

      await supabase
        .from("chatbot_conversations")
        .update({
          message_count: messageCount,
          context_limit_reached: contextLimitReached,
        })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error updating message count:", error);
    }
  }

  async clearConversation(conversationId: string): Promise<void> {
    try {
      // Delete all messages
      await supabase
        .from("chatbot_messages")
        .delete()
        .eq("conversation_id", conversationId);

      // Reset conversation
      await supabase
        .from("chatbot_conversations")
        .update({
          message_count: 0,
          context_limit_reached: false,
        })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error clearing conversation:", error);
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Messages will be deleted automatically due to CASCADE
      await supabase
        .from("chatbot_conversations")
        .delete()
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }

  async deactivateConversation(conversationId: string): Promise<void> {
    try {
      await supabase
        .from("chatbot_conversations")
        .update({ is_active: false })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error deactivating conversation:", error);
    }
  }

  async getConversationHistory(userId: string): Promise<ChatbotConversation[]> {
    try {
      const { data, error } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching conversation history:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      return [];
    }
  }

  // Helper methods for context management
  shouldShowWarning(messageCount: number): boolean {
    return messageCount >= this.WARNING_THRESHOLD && messageCount < this.MAX_MESSAGES;
  }

  hasReachedLimit(messageCount: number): boolean {
    return messageCount >= this.MAX_MESSAGES;
  }

  getRemainingMessages(messageCount: number): number {
    return Math.max(0, this.MAX_MESSAGES - messageCount);
  }

  // Convert database records to ChatbotMessage format
  convertToChatbotMessages(records: ChatbotMessageRecord[]): ChatbotMessage[] {
    console.log("🔄 Converting database records to chatbot messages:", records);
    
    const converted = records.map((record) => {
      const message = {
        content: record.content,
        isFromBot: record.isFromBot,
        escalatedToTutor: record.escalatedToTutor || false, // Ensure boolean, not undefined
        tutorModule: record.tutorModule || undefined,
        confidenceScore: record.confidenceScore || undefined,
      };
      console.log("📝 Converting record:", record, "→ message:", message);
      return message;
    });
    
    console.log("✅ Converted messages:", converted);
    return converted;
  }
}

export const chatbotConversationService = new ChatbotConversationService();
