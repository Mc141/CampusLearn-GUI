import { User } from '../types';
import { chatbotEscalationService } from './chatbotEscalationService';

export interface ChatbotMessage {
  id: string;
  content: string;
  isFromBot: boolean;
  escalatedToTutor?: boolean;
  tutorModule?: string;
  confidenceScore?: number;
  needsEscalationConfirmation?: boolean;
}

export interface ChatbotResponse {
  text: string;
  suggestions?: string[];
  escalated?: boolean;
  needsEscalationConfirmation?: boolean;
  tutorModule?: string;
  confidence?: number;
}

class ChatbotService {
  private apiUrl = 'https://campuslearn-bot.onrender.com/api/v1/prediction/aedfd635-f70e-4d21-9681-1b59a3d118bc';

  async sendMessage(
    message: string, 
    user: User | null,
    conversationHistory: ChatbotMessage[] = [],
    conversationId?: string
  ): Promise<ChatbotResponse> {
    try {
      const context = this.buildContext(user, conversationHistory);
      const formattedHistory = this.formatConversationHistory(conversationHistory);
      
      const requestBody = {
        question: message,
        context: context,
        conversationHistory: formattedHistory,
        userRole: user?.role || 'student',
        userModules: user?.modules || [],
        currentMessage: message,
        prompt: `${context}${formattedHistory}NEW MESSAGE: "${message}"\n\nRespond to this message considering the conversation context above. If the user is asking about something related to previous topics (like adding features to code), provide specific help that builds on the previous discussion.`
      };

      console.log('🤖 CHATBOT REQUEST BODY:');
      console.log(JSON.stringify(requestBody, null, 2));

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Chatbot API error: ${response.status}`);
      }

      const result = await response.json();
      
      const parsedResponse = this.parseResponse(result, message);
      
      if (parsedResponse.escalated && user?.id && conversationId) {
        await this.handleEscalation(
          conversationId,
          user.id,
          message,
          parsedResponse.tutorModule,
          parsedResponse.confidence
        );
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Error calling chatbot:', error);
      return {
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact a tutor directly.",
        suggestions: [
          "Contact a tutor",
          "Browse topics",
          "Check FAQ"
        ],
        escalated: false
      };
    }
  }

  private buildContext(user: User | null, history: ChatbotMessage[]): string {
    let context = "";
    
    if (user) {
      context += `User: ${user.firstName} ${user.lastName} (${user.role})\n`;
      
      if (user.modules && user.modules.length > 0) {
        context += `Modules: ${user.modules.join(', ')}\n`;
      }
      
      if (user.role === 'student') {
        const studentNumber = this.extractStudentNumber(user.email);
        if (studentNumber) {
          context += `Student Number: ${studentNumber}\n`;
        }
      }
      
      context += `\n`;
    }

    return context;
  }

  private formatConversationHistory(history: ChatbotMessage[]): string {
    if (history.length === 0) {
      return "";
    }

    // Take the last 10 messages to avoid context overflow
    const recentHistory = history.slice(-10);
    
    let formattedHistory = "CONVERSATION:\n\n";
    
    recentHistory.forEach((msg, index) => {
      const role = msg.isFromBot ? "Assistant" : "User";
      
      formattedHistory += `${role}: ${msg.content}\n\n`;
    });
    
    formattedHistory += "CONTEXT: The user is asking a follow-up question related to the previous conversation. Provide a helpful response that builds on the previous discussion.\n\n";
    
    return formattedHistory;
  }

  private extractStudentNumber(email: string): string | null {
    if (!email) return null;
    
    if (email.includes('@student.belgiumcampus.ac.za') || email.includes('@belgiumcampus.ac.za')) {
      const numberPart = email.split('@')[0];
      if (/^\d+$/.test(numberPart)) {
        return numberPart;
      }
    }
    return null;
  }

  private parseResponse(result: any, originalMessage: string): ChatbotResponse {
    // Extract text response
    let text = '';
    if (result.text) {
      text = result.text;
    } else if (result.message) {
      text = result.message;
    } else if (typeof result === 'string') {
      text = result;
    } else {
      text = "I understand your question. Let me help you with that.";
    }

    // Determine if escalation is needed based on keywords or confidence
    const escalationKeywords = [
      'specific tutor', 'human help', 'personal assistance', 'contact tutor',
      'assignment help', 'project help', 'urgent help', 'emergency',
      'escalate to tutor', 'need human', 'speak to tutor'
    ];

    const needsEscalation = escalationKeywords.some(keyword => 
      originalMessage.toLowerCase().includes(keyword)
    ) || text.toLowerCase().includes('escalate') || text.toLowerCase().includes('contact tutor');

    // If escalation is needed, ask for confirmation instead of escalating directly
    if (needsEscalation) {
      const module = this.detectModule(originalMessage);
      const moduleText = module ? ` for ${module}` : '';
      
      text = `${text}\n\n🤔 **Would you like me to connect you with a human tutor${moduleText}?**\n\nI can escalate your question to a qualified tutor who can provide personalized assistance. Please confirm if you'd like me to do this.`;
    }

    // Generate suggestions based on response
    const suggestions = this.generateSuggestions(text, needsEscalation);

    return {
      text: text,
      suggestions: suggestions,
      escalated: false, // Never escalate directly - always ask for confirmation first
      needsEscalationConfirmation: needsEscalation, // New field to indicate confirmation needed
      tutorModule: this.detectModule(originalMessage),
      confidence: this.calculateConfidence(text)
    };
  }

  private generateSuggestions(responseText: string, escalated: boolean): string[] {
    const suggestions: string[] = [];

    if (escalated) {
      suggestions.push('Find a tutor', 'Browse topics', 'Post in forum');
    } else {
      if (responseText.toLowerCase().includes('module')) {
        suggestions.push('Browse modules', 'Find tutors', 'View resources');
      } else if (responseText.toLowerCase().includes('assignment')) {
        suggestions.push('Find assignment help', 'Contact tutor', 'Browse topics');
      } else if (responseText.toLowerCase().includes('study')) {
        suggestions.push('Study resources', 'Find study groups', 'Browse topics');
      } else {
        suggestions.push('Browse topics', 'Find tutors', 'Check FAQ');
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private detectModule(message: string): string | null {
    const moduleKeywords = {
      'BCS101': ['bcs101', 'programming fundamentals', 'intro to programming'],
      'BCS102': ['bcs102', 'data structures', 'algorithms'],
      'BCS201': ['bcs201', 'software engineering', 'software development'],
      'BCS202': ['bcs202', 'database', 'sql', 'database management'],
      'DIP101': ['dip101', 'diploma', 'foundation'],
      'BCom': ['bcom', 'business', 'commerce', 'management']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [module, keywords] of Object.entries(moduleKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return module;
      }
    }

    return null;
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on response characteristics
    if (text.toLowerCase().includes("i don't know") || text.toLowerCase().includes("i'm not sure")) {
      return 0.3;
    } else if (text.toLowerCase().includes("escalate") || text.toLowerCase().includes("tutor")) {
      return 0.6;
    } else if (text.length > 100 && !text.toLowerCase().includes("sorry")) {
      return 0.9;
    } else {
      return 0.7;
    }
  }

  async handleEscalation(
    conversationId: string,
    studentId: string,
    originalQuestion: string,
    moduleCode?: string,
    confidence?: number
  ): Promise<boolean> {
    try {
      console.log("🚨 ESCALATION TRIGGERED!");
      console.log("📋 Escalation details:", {
        conversationId,
        studentId,
        originalQuestion,
        moduleCode,
        confidence
      });

      // Determine escalation reason based on confidence
      let escalationReason = 'Complex question requiring human assistance';
      let priority: 'low' | 'medium' | 'high' = 'medium';

      if (confidence && confidence < 0.5) {
        escalationReason = 'Low confidence response - requires human expertise';
        priority = 'high';
      } else if (confidence && confidence < 0.7) {
        escalationReason = 'Moderate confidence - human verification recommended';
        priority = 'medium';
      } else {
        escalationReason = 'Student requested human assistance';
        priority = 'low';
      }

      console.log("📊 Escalation priority:", priority);
      console.log("📝 Escalation reason:", escalationReason);

      // Create escalation record
      const escalation = await chatbotEscalationService.createEscalation(
        conversationId,
        studentId,
        originalQuestion,
        moduleCode,
        escalationReason,
        priority
      );

      if (escalation) {
        console.log('✅ Escalation created:', escalation.id);
        
        // Attempt auto-assignment
        const assigned = await chatbotEscalationService.autoAssignEscalation(escalation.id);
        
        if (assigned) {
          console.log('🎯 Escalation auto-assigned to tutor');
          return true;
        } else {
          console.log('⚠️ Escalation created but no tutor available for auto-assignment');
          return false;
        }
      } else {
        console.log('❌ Failed to create escalation record');
        return false;
      }
    } catch (error) {
      console.error('💥 Error handling escalation:', error);
      return false;
    }
  }
}

export const chatbotService = new ChatbotService();
