import { supabase } from '../lib/supabase';

export interface ChatExpiryInfo {
  conversationId: string;
  lastActivity: Date;
  daysUntilExpiry: number;
  isExpired: boolean;
}

export const chatExpiryService = {
  // Get expiry information for a conversation
  async getChatExpiryInfo(conversationId: string): Promise<ChatExpiryInfo | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('last_activity')
        .eq('conversation_id', conversationId)
        .order('last_activity', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (!data) return null;

      const lastActivity = new Date(data.last_activity);
      const daysSinceActivity = Math.floor(
        (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysUntilExpiry = Math.max(0, 7 - daysSinceActivity);
      const isExpired = daysSinceActivity >= 7;

      return {
        conversationId,
        lastActivity,
        daysUntilExpiry,
        isExpired
      };
    } catch (error) {
      console.error('Error getting chat expiry info:', error);
      throw error;
    }
  },

  // Get all conversations with their expiry status
  async getAllChatExpiryInfo(): Promise<ChatExpiryInfo[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          conversation_id,
          last_activity
        `)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      // Group by conversation and get the latest activity
      const conversationMap = new Map<string, Date>();
      
      data?.forEach(message => {
        const conversationId = message.conversation_id;
        const lastActivity = new Date(message.last_activity);
        
        if (!conversationMap.has(conversationId) || 
            lastActivity > conversationMap.get(conversationId)!) {
          conversationMap.set(conversationId, lastActivity);
        }
      });

      // Convert to expiry info array
      const expiryInfo: ChatExpiryInfo[] = [];
      conversationMap.forEach((lastActivity, conversationId) => {
        const daysSinceActivity = Math.floor(
          (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysUntilExpiry = Math.max(0, 7 - daysSinceActivity);
        const isExpired = daysSinceActivity >= 7;

        expiryInfo.push({
          conversationId,
          lastActivity,
          daysUntilExpiry,
          isExpired
        });
      });

      return expiryInfo.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    } catch (error) {
      console.error('Error getting all chat expiry info:', error);
      throw error;
    }
  },

  // Manually trigger cleanup (for admin use)
  async triggerCleanup(): Promise<{ deletedCount: number; message: string }> {
    try {
      const { data, error } = await supabase.rpc('manual_cleanup_expired_chats');

      if (error) throw error;

      return {
        deletedCount: 0, // The function returns a string, we'd need to parse it
        message: data || 'Cleanup completed'
      };
    } catch (error) {
      console.error('Error triggering cleanup:', error);
      throw error;
    }
  },

  // Check if a conversation is about to expire (within 1 day)
  async isConversationExpiringSoon(conversationId: string): Promise<boolean> {
    try {
      const expiryInfo = await this.getChatExpiryInfo(conversationId);
      return expiryInfo ? expiryInfo.daysUntilExpiry <= 1 : false;
    } catch (error) {
      console.error('Error checking if conversation is expiring:', error);
      return false;
    }
  },

  // Get conversations that are expiring soon (for notifications)
  async getExpiringConversations(): Promise<ChatExpiryInfo[]> {
    try {
      const allExpiryInfo = await this.getAllChatExpiryInfo();
      return allExpiryInfo.filter(info => 
        info.daysUntilExpiry <= 1 && !info.isExpired
      );
    } catch (error) {
      console.error('Error getting expiring conversations:', error);
      throw error;
    }
  },

  // Format expiry message for UI
  formatExpiryMessage(expiryInfo: ChatExpiryInfo): string {
    if (expiryInfo.isExpired) {
      return 'This conversation has expired and will be deleted soon.';
    }
    
    if (expiryInfo.daysUntilExpiry === 0) {
      return 'This conversation will expire today if no activity occurs.';
    }
    
    if (expiryInfo.daysUntilExpiry === 1) {
      return 'This conversation will expire tomorrow if no activity occurs.';
    }
    
    return `This conversation will expire in ${expiryInfo.daysUntilExpiry} days if no activity occurs.`;
  },

  // Format last activity for UI
  formatLastActivity(lastActivity: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }
};
