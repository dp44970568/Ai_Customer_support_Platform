import { prisma } from "./prisma";
import { TicketCategory, TicketPriority, TicketStatus, SentimentType } from "@/types";

export const INITIAL_AGENTS = [
  {
    id: "agent-1",
    name: "Sarah Jenkins",
    email: "sarah.j@nexuscloud.io",
    role: "Lead Specialist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    isOnline: true,
    activeTicketsCount: 4,
  },
  {
    id: "agent-2",
    name: "Marcus Vance",
    email: "marcus.v@nexuscloud.io",
    role: "Technical Support",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    isOnline: true,
    activeTicketsCount: 2,
  },
  {
    id: "agent-3",
    name: "Elena Gomez",
    email: "elena.g@nexuscloud.io",
    role: "Billing Specialist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    isOnline: false,
    activeTicketsCount: 1,
  },
  {
    id: "agent-4",
    name: "David Kim",
    email: "david.k@nexuscloud.io",
    role: "Tier 1 Support",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    isOnline: true,
    activeTicketsCount: 3,
  },
];

export const INITIAL_KNOWLEDGE_ARTICLES = [
  {
    id: "kb-1",
    title: "Billing Cycles, Invoicing, and Payment Methods",
    category: "billing",
    keywords: ["billing", "invoice", "payment", "credit card", "stripe", "receipt", "charge", "subscription", "annual", "monthly"],
    lastUpdated: "2026-09-15",
    content: `All subscription plans renew automatically on either a monthly or annual billing cycle based on your selected plan.
Payment methods supported: Major credit cards (Visa, MasterCard, Amex), PayPal, and wire transfers for Enterprise tiers ($5,000+).
Invoices are generated automatically within 1 hour of payment and can be downloaded from Settings > Billing > Invoices.
If a payment fails, our system retries up to 3 times over 7 days before suspending access. No data is deleted during suspension.`
  },
  {
    id: "kb-2",
    title: "Refund Policy and Cancellation Terms",
    category: "billing",
    keywords: ["refund", "cancel", "money back", "guarantee", "return", "chargeback", "terminate"],
    lastUpdated: "2026-08-20",
    content: `We offer a 14-day no-questions-asked money-back guarantee for all new monthly and annual subscriptions.
To request a refund, customers must submit a ticket within 14 days of the original purchase date.
Pro-rated refunds are not issued for mid-cycle cancellations after 14 days, but access continues until the end of the billing period.
Enterprise contracts are governed by their respective Master Services Agreement (MSA).`
  },
  {
    id: "kb-3",
    title: "Resetting Passwords, Two-Factor Authentication (2FA), and SSO",
    category: "account",
    keywords: ["password", "reset", "2fa", "mfa", "login", "authenticator", "sso", "saml", "okta", "locked"],
    lastUpdated: "2026-09-01",
    content: `To reset your password, visit https://app.nexuscloud.io/forgot-password and enter your registered email address. Password reset links expire after 30 minutes.
For 2FA reset when you lost your authenticator device: Contact support with your account recovery codes or request account identity verification.
SAML SSO is available on Team and Enterprise plans. It supports Okta, Azure AD, Google Workspace, and OneLogin.
If an account is locked after 5 failed attempts, it will automatically unlock after 15 minutes.`
  },
  {
    id: "kb-4",
    title: "API Rate Limits, Authentication, and Webhook Retries",
    category: "technical",
    keywords: ["api", "rate limit", "token", "bearer", "webhook", "429", "timeout", "latency", "rest", "endpoint"],
    lastUpdated: "2026-09-18",
    content: `API Rate Limits:
- Free Tier: 60 requests per minute (RPM).
- Pro Tier: 1,000 requests per minute (RPM).
- Enterprise Tier: 10,000 requests per minute (RPM) with custom burst limits.
When a rate limit is exceeded, the server returns HTTP 429 Too Many Requests with a 'Retry-After' header indicating the wait time in seconds.
Webhooks retry with exponential backoff at intervals of 1m, 5m, 15m, 1h, and 6h before marking the event as failed. Ensure your webhook endpoints return HTTP 200 within 5 seconds.`
  },
  {
    id: "kb-5",
    title: "System Status, Downtime SLA, and Scheduled Maintenance",
    category: "technical",
    keywords: ["status", "down", "outage", "sla", "maintenance", "incident", "uptime", "latency", "offline"],
    lastUpdated: "2026-09-22",
    content: `We guarantee a 99.95% uptime Service Level Agreement (SLA) for paid customers.
Live incident updates and scheduled maintenance windows are posted on https://status.nexuscloud.io.
Scheduled maintenance is performed every second Tuesday between 02:00 UTC and 04:00 UTC with advance notice of 72 hours sent via email and in-app banner.
If SLA drops below 99.95% in a calendar month, eligible customers receive service credits (10% credit for 99.0%-99.94%, 25% for below 99.0%).`
  },
  {
    id: "kb-6",
    title: "User Roles, Permissions, and Workspace Management",
    category: "account",
    keywords: ["role", "permissions", "admin", "member", "viewer", "seat", "invite", "team", "organization"],
    lastUpdated: "2026-07-30",
    content: `Workspaces support four distinct role levels:
1. Owner: Full billing, security, deletion, and user management control.
2. Admin: Can invite/remove members, manage integrations, and configure workflows.
3. Member: Can create, edit, and collaborate on projects and tickets.
4. Viewer: Read-only access to dashboards and reporting.
Additional team seats can be purchased from Settings > Team at $15/seat/month.`
  }
];

interface SeedMessage {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isInternalNote?: boolean;
  suggestedActions?: string[];
}

interface SeedTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sentiment: SentimentType;
  assignedAgent?: string;
  assignedAgentName?: string;
  aiSummary?: string;
  satisfactionScore?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  messages: SeedMessage[];
}

export const INITIAL_TICKETS_SEED: SeedTicket[] = [
  {
    id: "tkt-101",
    ticketNumber: "TK-101",
    customerName: "Alex Rivera",
    customerEmail: "alex.rivera@techcorp.io",
    customerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    subject: "Urgent: Webhook 429 Rate Limits blocking production payments",
    status: "escalated",
    priority: "urgent",
    category: "technical",
    sentiment: "frustrated",
    assignedAgent: "agent-2",
    assignedAgentName: "Marcus Vance",
    aiSummary: "Customer experiencing API HTTP 429 rate limits in production. Needs immediate quota increase and webhook guidance.",
    tags: ["api", "rate-limit", "production-outage"],
    createdAt: new Date(Date.now() - 3600000 * 3),
    updatedAt: new Date(Date.now() - 3600000 * 1),
    messages: [
      {
        id: "m-1",
        sender: "customer",
        senderName: "Alex Rivera",
        text: "We are getting slammed with 429 Too Many Requests errors on our production webhook listeners! This is causing payment processing delays. I need to speak to an engineer or human agent right now!",
        timestamp: new Date(Date.now() - 3600000 * 3),
      },
      {
        id: "m-2",
        sender: "ai",
        senderName: "OmniSupport AI",
        text: "I understand how urgent this is for your production environment! Our standard Pro tier limit is 1,000 RPM. I have flagged your account, initiated an escalation to Marcus Vance from our Technical Support engineering team, and alerted on-call staff.",
        timestamp: new Date(Date.now() - 3600000 * 2.8),
      },
      {
        id: "m-3",
        sender: "system",
        senderName: "System",
        text: "Ticket status changed to Escalated. Assigned to Marcus Vance.",
        timestamp: new Date(Date.now() - 3600000 * 2.7),
      },
      {
        id: "m-4",
        sender: "agent",
        senderName: "Marcus Vance",
        text: "Alex, reviewing your API key usage logs now. I've temporarily bumped your burst ceiling to 3,500 RPM while we investigate your batch payload frequency.",
        timestamp: new Date(Date.now() - 3600000 * 1.5),
      },
      {
        id: "m-5",
        sender: "agent",
        senderName: "Marcus Vance",
        text: "Internal note: Their retry logic does not have exponential backoff. Once resolved, share article KB-4 on webhook retry best practices.",
        timestamp: new Date(Date.now() - 3600000 * 1),
        isInternalNote: true,
      }
    ]
  },
  {
    id: "tkt-102",
    ticketNumber: "TK-102",
    customerName: "Claire Dupont",
    customerEmail: "c.dupont@vogueagency.fr",
    customerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    subject: "Refund request for annual plan charged yesterday",
    status: "open",
    priority: "high",
    category: "billing",
    sentiment: "frustrated",
    aiSummary: "Customer was charged for annual renewal yesterday and requested a full refund under the 14-day policy.",
    tags: ["billing", "refund", "renewal"],
    createdAt: new Date(Date.now() - 3600000 * 5),
    updatedAt: new Date(Date.now() - 3600000 * 4.5),
    messages: [
      {
        id: "m-10",
        sender: "customer",
        senderName: "Claire Dupont",
        text: "Hi, I was charged $948 yesterday for an annual renewal that I intended to cancel. I would like a refund immediately as I have not used the platform this month.",
        timestamp: new Date(Date.now() - 3600000 * 5),
      },
      {
        id: "m-11",
        sender: "ai",
        senderName: "OmniSupport AI",
        text: "Hello Claire. Under our policy, you are well within the 14-day money-back guarantee window! I have queued your request for our Billing Specialist team to process your full credit refund.",
        timestamp: new Date(Date.now() - 3600000 * 4.8),
        suggestedActions: ["Approve 100% Refund ($948)", "Offer 20% Retention Discount", "Downgrade to Monthly"],
      }
    ]
  },
  {
    id: "tkt-103",
    ticketNumber: "TK-103",
    customerName: "Devon Miller",
    customerEmail: "devon@startuphub.co",
    customerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    subject: "How do I configure SAML SSO with Okta?",
    status: "in_progress",
    priority: "medium",
    category: "account",
    sentiment: "neutral",
    assignedAgent: "agent-1",
    assignedAgentName: "Sarah Jenkins",
    aiSummary: "Inquiry regarding Okta SAML 2.0 integration setup and certificate upload.",
    tags: ["sso", "okta", "security"],
    createdAt: new Date(Date.now() - 3600000 * 8),
    updatedAt: new Date(Date.now() - 3600000 * 2),
    messages: [
      {
        id: "m-20",
        sender: "customer",
        senderName: "Devon Miller",
        text: "We upgraded to the Team plan and want to configure single sign-on with Okta. Where can I find the ACS URL and Entity ID?",
        timestamp: new Date(Date.now() - 3600000 * 8),
      },
      {
        id: "m-21",
        sender: "ai",
        senderName: "OmniSupport AI",
        text: "Hi Devon! You can find your ACS URL and SP Entity ID in Settings > Security > SAML SSO. Paste your Identity Provider Metadata XML to complete the handshake.",
        timestamp: new Date(Date.now() - 3600000 * 7.9),
      },
      {
        id: "m-22",
        sender: "agent",
        senderName: "Sarah Jenkins",
        text: "Hi Devon, Sarah here! I've sent an invitation to test the SAML handshake in your staging sandbox. Let me know if you run into assertion mapping issues.",
        timestamp: new Date(Date.now() - 3600000 * 2),
      }
    ]
  },
  {
    id: "tkt-104",
    ticketNumber: "TK-104",
    customerName: "Sophia Zhang",
    customerEmail: "sophia@datastream.io",
    customerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    subject: "Question about workspace seats billing",
    status: "resolved",
    priority: "low",
    category: "account",
    sentiment: "positive",
    assignedAgent: "agent-4",
    assignedAgentName: "David Kim",
    satisfactionScore: 5,
    aiSummary: "Customer asked how additional team seats are billed and if they are prorated.",
    tags: ["seats", "pricing", "resolved"],
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 12),
    messages: [
      {
        id: "m-30",
        sender: "customer",
        senderName: "Sophia Zhang",
        text: "If I add 3 new members today, how does the $15/seat cost show up on our next invoice?",
        timestamp: new Date(Date.now() - 3600000 * 24),
      },
      {
        id: "m-31",
        sender: "ai",
        senderName: "OmniSupport AI",
        text: "New seats are prorated for the remaining days in your current monthly cycle and will appear as an itemized adjustment on your next invoice.",
        timestamp: new Date(Date.now() - 3600000 * 23.9),
      },
      {
        id: "m-32",
        sender: "customer",
        senderName: "Sophia Zhang",
        text: "Super clear and fast response, thank you!",
        timestamp: new Date(Date.now() - 3600000 * 12),
      }
    ]
  }
];

export async function seedDatabaseIfNeeded() {
  const agentCount = await prisma.agent.count();
  if (agentCount === 0) {
    // Seed agents
    for (const a of INITIAL_AGENTS) {
      await prisma.agent.create({
        data: a,
      });
    }

    // Seed knowledge articles
    for (const kb of INITIAL_KNOWLEDGE_ARTICLES) {
      await prisma.knowledgeArticle.create({
        data: {
          id: kb.id,
          title: kb.title,
          category: kb.category,
          content: kb.content,
          keywords: JSON.stringify(kb.keywords),
          lastUpdated: kb.lastUpdated,
        },
      });
    }

    // Seed tickets and messages
    for (const t of INITIAL_TICKETS_SEED) {
      await prisma.ticket.create({
        data: {
          id: t.id,
          ticketNumber: t.ticketNumber,
          customerName: t.customerName,
          customerEmail: t.customerEmail,
          customerAvatar: t.customerAvatar,
          subject: t.subject,
          status: t.status,
          priority: t.priority,
          category: t.category,
          sentiment: t.sentiment,
          assignedAgent: t.assignedAgent,
          assignedAgentName: t.assignedAgentName,
          satisfactionScore: t.satisfactionScore,
          aiSummary: t.aiSummary,
          tags: JSON.stringify(t.tags),
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          messages: {
            create: t.messages.map((m) => ({
              id: m.id,
              sender: m.sender,
              senderName: m.senderName,
              text: m.text,
              timestamp: m.timestamp,
              isInternalNote: m.isInternalNote || false,
              suggestedActions: m.suggestedActions ? JSON.stringify(m.suggestedActions) : null,
            })),
          },
        },
      });
    }
  }
}
