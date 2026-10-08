export type TicketStatus = 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory = 'billing' | 'technical' | 'account' | 'general';

export type SentimentType = 'positive' | 'neutral' | 'frustrated' | 'urgent';

export type MessageSender = 'customer' | 'ai' | 'agent' | 'system';

export interface ChatMessage {
  id: string;
  ticketId: string;
  sender: MessageSender;
  senderName?: string;
  text: string;
  timestamp: string;
  isInternalNote?: boolean;
  suggestedActions?: string[];
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sentiment: SentimentType;
  assignedAgent?: string;
  assignedAgentName?: string;
  aiSummary?: string;
  aiSuggestedReply?: string;
  satisfactionScore?: number; // 1 to 5
  tags: string[];
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: TicketCategory;
  content: string;
  keywords: string[];
  lastUpdated: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'Lead Specialist' | 'Tier 1 Support' | 'Technical Support' | 'Billing Specialist';
  avatar: string;
  isOnline: boolean;
  activeTicketsCount: number;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  escalatedTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
  csatAverage: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    frustrated: number;
    urgent: number;
  };
  categoryBreakdown: {
    billing: number;
    technical: number;
    account: number;
    general: number;
  };
}
