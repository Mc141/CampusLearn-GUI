import { supabase } from "../lib/supabase";
import { messagingService } from "./messagingService";
import { notificationService } from "./notificationService";

export interface ChatbotEscalation {
  id: string;
  conversationId: string;
  studentId: string;
  tutorId?: string;
  moduleCode?: string;
  originalQuestion: string;
  escalationReason?: string;
  status: 'pending' | 'assigned' | 'resolved' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  messageThreadId?: string;
  assignedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TutorNotification {
  id: string;
  tutorId: string;
  escalationId: string;
  notificationType: 'email' | 'sms' | 'in_app';
  status: 'pending' | 'sent' | 'failed' | 'read';
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface TutorWithAvailability {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  modules: string[];
  isAvailable: boolean;
  currentEscalations: number;
}

class ChatbotEscalationService {
  async createEscalation(
    conversationId: string,
    studentId: string,
    originalQuestion: string,
    moduleCode?: string,
    escalationReason?: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ChatbotEscalation | null> {
    try {
      const { data, error } = await supabase
        .from("chatbot_escalations")
        .insert({
          conversation_id: conversationId,
          student_id: studentId,
          module_code: moduleCode,
          original_question: originalQuestion,
          escalation_reason: escalationReason,
          priority: priority,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating escalation:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating escalation:", error);
      return null;
    }
  }

  async findAvailableTutors(moduleCode?: string): Promise<TutorWithAvailability[]> {
    try {
      console.log("🔍 Finding available tutors for module:", moduleCode);
      
      // Get tutors assigned to the specific module or all tutors if no module specified
      let query = supabase
        .from("users")
        .select(`
          id,
          first_name,
          last_name,
          email,
          modules,
          role
        `)
        .eq("role", "tutor")
        .eq("is_active", true);

      const { data: tutors, error } = await query;

      if (error) {
        console.error("Error fetching tutors:", error);
        return [];
      }

      if (!tutors) return [];

      console.log("📊 All tutors found:", tutors.length);
      console.log("📋 Tutor details:", tutors.map(t => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        modules: t.modules
      })));

      // Filter tutors by module if specified
      // If moduleCode is "General" or undefined, return all tutors
      const relevantTutors = (moduleCode && moduleCode !== "General") 
        ? tutors.filter(tutor => 
            tutor.modules && 
            Array.isArray(tutor.modules) && 
            tutor.modules.includes(moduleCode)
          )
        : tutors;

      console.log("✅ Relevant tutors after filtering:", relevantTutors.length);

      // Get current escalation counts for each tutor
      const tutorIds = relevantTutors.map(tutor => tutor.id);
      const { data: escalationCounts } = await supabase
        .from("chatbot_escalations")
        .select("tutor_id")
        .in("tutor_id", tutorIds)
        .eq("status", "assigned");

      const escalationCountMap = new Map<string, number>();
      if (escalationCounts) {
        escalationCounts.forEach(escalation => {
          const count = escalationCountMap.get(escalation.tutor_id) || 0;
          escalationCountMap.set(escalation.tutor_id, count + 1);
        });
      }

      // Map to TutorWithAvailability format
      return relevantTutors.map(tutor => ({
        id: tutor.id,
        firstName: tutor.first_name,
        lastName: tutor.last_name,
        email: tutor.email,
        modules: tutor.modules || [],
        isAvailable: (escalationCountMap.get(tutor.id) || 0) < 5, // Max 5 concurrent escalations
        currentEscalations: escalationCountMap.get(tutor.id) || 0,
      }));
    } catch (error) {
      console.error("Error finding available tutors:", error);
      return [];
    }
  }

  async assignTutorToEscalation(
    escalationId: string,
    tutorId: string
  ): Promise<boolean> {
    try {
      // Update escalation with tutor assignment
      const { error: escalationError } = await supabase
        .from("chatbot_escalations")
        .update({
          tutor_id: tutorId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
        })
        .eq("id", escalationId);

      if (escalationError) {
        console.error("Error assigning tutor to escalation:", escalationError);
        return false;
      }

      // Get escalation details for creating message thread
      const { data: escalation, error: fetchError } = await supabase
        .from("chatbot_escalations")
        .select(`
          *,
          student:student_id(first_name, last_name, email),
          tutor:tutor_id(first_name, last_name, email)
        `)
        .eq("id", escalationId)
        .single();

      if (fetchError || !escalation) {
        console.error("Error fetching escalation details:", fetchError);
        return false;
      }

      // Create message thread between student and tutor
      try {
        console.log("🚀 Creating escalation message thread...");
        console.log("📧 Tutor ID:", tutorId);
        console.log("👨‍🎓 Student ID:", escalation.student_id);
        console.log("📝 Original Question:", escalation.original_question);
        console.log("📚 Module:", escalation.module_code || 'General');

        const messageContent = `Hi! I'm your assigned tutor for the CampusLearn AI escalation. 

**Student Question:** ${escalation.original_question}

**Module:** ${escalation.module_code || 'General'}

**Escalation Reason:** ${escalation.escalation_reason || 'Complex question requiring human assistance'}

I'm here to help you with this question. Please feel free to ask any follow-up questions or provide more details about what you need help with.`;

        console.log("💬 Message content:", messageContent);

        const messageResult = await messagingService.sendMessage({
          senderId: tutorId,
          receiverId: escalation.student_id,
          content: messageContent,
        });

        console.log("✅ Message sent successfully:", messageResult);

        if (messageResult) {
          // Update escalation with message thread ID
          await supabase
            .from("chatbot_escalations")
            .update({
              message_thread_id: messageResult.conversationId,
            })
            .eq("id", escalationId);
        }
      } catch (messageError) {
        console.error("Error creating message thread:", messageError);
        // Don't fail the assignment if message creation fails
      }

      // Create notification for tutor
      await this.createTutorNotification(tutorId, escalationId, 'in_app');

      // Create in-app notification for the assigned tutor
      try {
        // Get student's name for the notification
        const { data: studentData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', escalation.student_id)
          .single();

        if (studentData) {
          const studentName = `${studentData.first_name} ${studentData.last_name}`;
          const moduleCode = escalation.module_code || 'General';
          
          await notificationService.notifyNewEscalation(tutorId, studentName, moduleCode, escalationId);
        }
      } catch (notificationError) {
        console.error('Error creating escalation notification:', notificationError);
        // Don't fail the assignment if notification fails
      }

      return true;
    } catch (error) {
      console.error("Error assigning tutor to escalation:", error);
      return false;
    }
  }

  async createTutorNotification(
    tutorId: string,
    escalationId: string,
    notificationType: 'email' | 'sms' | 'in_app'
  ): Promise<TutorNotification | null> {
    try {
      const { data, error } = await supabase
        .from("tutor_notifications")
        .insert({
          tutor_id: tutorId,
          escalation_id: escalationId,
          notification_type: notificationType,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating tutor notification:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating tutor notification:", error);
      return null;
    }
  }

  async getEscalationsForTutor(tutorId: string): Promise<ChatbotEscalation[]> {
    try {
      const { data, error } = await supabase
        .from("chatbot_escalations")
        .select(`
          *,
          student:student_id(first_name, last_name, email),
          conversation:conversation_id(title, created_at)
        `)
        .eq("tutor_id", tutorId)
        .in("status", ["assigned", "resolved"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching escalations for tutor:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching escalations for tutor:", error);
      return [];
    }
  }

  async getPendingEscalations(): Promise<ChatbotEscalation[]> {
    try {
      const { data, error } = await supabase
        .from("chatbot_escalations")
        .select(`
          *,
          student:student_id(first_name, last_name, email),
          conversation:conversation_id(title, created_at)
        `)
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching pending escalations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching pending escalations:", error);
      return [];
    }
  }

  // Check for pending escalations and auto-assign them when tutors become available
  async processPendingEscalations(): Promise<void> {
    try {
      console.log("🔄 Processing pending escalations...");
      
      const pendingEscalations = await this.getPendingEscalations();
      
      if (pendingEscalations.length === 0) {
        console.log("✅ No pending escalations to process");
        return;
      }

      console.log(`📋 Found ${pendingEscalations.length} pending escalations`);

      for (const escalation of pendingEscalations) {
        console.log(`🔍 Processing escalation ${escalation.id} for module ${escalation.module_code}`);
        
        // Try to find available tutors for this escalation's module
        const availableTutors = await this.findAvailableTutors(escalation.module_code);
        
        if (availableTutors.length > 0) {
          console.log(`👨‍🏫 Found ${availableTutors.length} available tutors for escalation ${escalation.id}`);
          
          // Sort by current escalations (least busy first) and assign
          const sortedTutors = availableTutors
            .filter(tutor => tutor.isAvailable)
            .sort((a, b) => a.currentEscalations - b.currentEscalations);

          if (sortedTutors.length > 0) {
            const selectedTutor = sortedTutors[0];
            console.log(`🎯 Auto-assigning escalation ${escalation.id} to tutor ${selectedTutor.id}`);
            
            const assigned = await this.assignTutorToEscalation(escalation.id, selectedTutor.id);
            
            if (assigned) {
              console.log(`✅ Successfully auto-assigned escalation ${escalation.id} to tutor ${selectedTutor.id}`);
            } else {
              console.log(`❌ Failed to auto-assign escalation ${escalation.id} to tutor ${selectedTutor.id}`);
            }
          }
        } else {
          console.log(`⚠️ No available tutors found for escalation ${escalation.id} (module: ${escalation.module_code})`);
        }
      }
    } catch (error) {
      console.error("💥 Error processing pending escalations:", error);
    }
  }

  async resolveEscalation(escalationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chatbot_escalations")
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq("id", escalationId);

      if (error) {
        console.error("Error resolving escalation:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error resolving escalation:", error);
      return false;
    }
  }

  async cancelEscalation(escalationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("chatbot_escalations")
        .update({
          status: 'cancelled',
        })
        .eq("id", escalationId);

      if (error) {
        console.error("Error cancelling escalation:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error cancelling escalation:", error);
      return false;
    }
  }

  async getEscalationStats(): Promise<{
    total: number;
    pending: number;
    assigned: number;
    resolved: number;
    cancelled: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("chatbot_escalations")
        .select("status");

      if (error) {
        console.error("Error fetching escalation stats:", error);
        return { total: 0, pending: 0, assigned: 0, resolved: 0, cancelled: 0 };
      }

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(e => e.status === 'pending').length || 0,
        assigned: data?.filter(e => e.status === 'assigned').length || 0,
        resolved: data?.filter(e => e.status === 'resolved').length || 0,
        cancelled: data?.filter(e => e.status === 'cancelled').length || 0,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching escalation stats:", error);
      return { total: 0, pending: 0, assigned: 0, resolved: 0, cancelled: 0 };
    }
  }

  // Auto-assignment logic
  async autoAssignEscalation(escalationId: string): Promise<boolean> {
    try {
      console.log("🔍 Starting auto-assignment for escalation:", escalationId);
      
      // Get escalation details
      const { data: escalation, error: fetchError } = await supabase
        .from("chatbot_escalations")
        .select("*")
        .eq("id", escalationId)
        .single();

      if (fetchError || !escalation) {
        console.error("❌ Error fetching escalation for auto-assignment:", fetchError);
        return false;
      }

      console.log("📋 Escalation details:", {
        id: escalation.id,
        student_id: escalation.student_id,
        module_code: escalation.module_code,
        original_question: escalation.original_question
      });

      // Find available tutors for the module
      const availableTutors = await this.findAvailableTutors(escalation.module_code);
      
      console.log("👨‍🏫 Available tutors found:", availableTutors.length);
      console.log("📊 Tutor details:", availableTutors.map(t => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        email: t.email,
        modules: t.modules,
        isAvailable: t.isAvailable,
        currentEscalations: t.currentEscalations
      })));
      
      if (availableTutors.length === 0) {
        console.log("❌ No available tutors found for escalation:", escalationId);
        return false;
      }

      // Sort by current escalations (least busy first) and assign
      const sortedTutors = availableTutors
        .filter(tutor => tutor.isAvailable)
        .sort((a, b) => a.currentEscalations - b.currentEscalations);

      console.log("📈 Sorted available tutors:", sortedTutors.map(t => ({
        name: `${t.firstName} ${t.lastName}`,
        currentEscalations: t.currentEscalations
      })));

      if (sortedTutors.length === 0) {
        console.log("❌ No tutors available for escalation:", escalationId);
        return false;
      }

      const selectedTutor = sortedTutors[0];
      console.log("🎯 Selected tutor:", {
        id: selectedTutor.id,
        name: `${selectedTutor.firstName} ${selectedTutor.lastName}`,
        email: selectedTutor.email,
        currentEscalations: selectedTutor.currentEscalations
      });

      const assignmentResult = await this.assignTutorToEscalation(escalationId, selectedTutor.id);
      console.log("✅ Assignment result:", assignmentResult);
      
      return assignmentResult;
    } catch (error) {
      console.error("Error in auto-assignment:", error);
      return false;
    }
  }
}

export const chatbotEscalationService = new ChatbotEscalationService();
