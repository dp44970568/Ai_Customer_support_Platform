import { GoogleGenerativeAI } from "@google/generative-ai";
import { TicketCategory, TicketPriority, SentimentType } from "@/types";
import { searchKnowledgeBase } from "./knowledgeBase";

export interface AIAnalysisResult {
  reply: string;
  sentiment: SentimentType;
  category: TicketCategory;
  priority: TicketPriority;
  shouldEscalate: boolean;
  suggestedActions?: string[];
  summary?: string;
}

export type StreamChunk =
  | { type: "token"; text: string }
  | { type: "done"; result: AIAnalysisResult };

const HUMAN_ESCALATION_KEYWORDS = [
  "human", "representative", "real person", "agent", "manager", "supervisor",
  "broken", "down", "outage", "lawyer", "refund immediately", "cancel my subscription",
  "talk to someone", "escalate", "terrible", "unacceptable", "furious", "urgent"
];

function analyzeIntent(userMessage: string): {
  sentiment: SentimentType;
  category: TicketCategory;
  priority: TicketPriority;
  shouldEscalate: boolean;
} {
  const lowerMsg = userMessage.toLowerCase();
  const matchedKeywords = HUMAN_ESCALATION_KEYWORDS.filter(k => lowerMsg.includes(k));
  const shouldEscalate = matchedKeywords.length > 0 && (
    lowerMsg.includes("human") ||
    lowerMsg.includes("agent") ||
    lowerMsg.includes("talk to someone") ||
    lowerMsg.includes("manager") ||
    lowerMsg.includes("refund immediately") ||
    lowerMsg.includes("lawyer") ||
    lowerMsg.includes("outage")
  );

  let sentiment: SentimentType = "neutral";
  if (lowerMsg.includes("urgent") || lowerMsg.includes("down") || lowerMsg.includes("emergency") || lowerMsg.includes("429")) {
    sentiment = "urgent";
  } else if (lowerMsg.includes("angry") || lowerMsg.includes("bad") || lowerMsg.includes("terrible") || lowerMsg.includes("ridiculous") || lowerMsg.includes("frustrated")) {
    sentiment = "frustrated";
  } else if (lowerMsg.includes("thanks") || lowerMsg.includes("thank you") || lowerMsg.includes("great") || lowerMsg.includes("helpful") || lowerMsg.includes("awesome")) {
    sentiment = "positive";
  }

  let category: TicketCategory = "general";
  if (lowerMsg.includes("bill") || lowerMsg.includes("invoice") || lowerMsg.includes("charge") || lowerMsg.includes("refund") || lowerMsg.includes("payment") || lowerMsg.includes("credit card")) {
    category = "billing";
  } else if (lowerMsg.includes("api") || lowerMsg.includes("webhook") || lowerMsg.includes("error") || lowerMsg.includes("bug") || lowerMsg.includes("500") || lowerMsg.includes("code") || lowerMsg.includes("rate limit")) {
    category = "technical";
  } else if (lowerMsg.includes("password") || lowerMsg.includes("login") || lowerMsg.includes("sso") || lowerMsg.includes("2fa") || lowerMsg.includes("account") || lowerMsg.includes("seat") || lowerMsg.includes("invite")) {
    category = "account";
  }

  let priority: TicketPriority = "medium";
  if (sentiment === "urgent" || shouldEscalate) priority = "urgent";
  else if (sentiment === "frustrated") priority = "high";

  return { sentiment, category, priority, shouldEscalate };
}

function getMockDeterministicReply(userMessage: string, category: TicketCategory, shouldEscalate: boolean): { reply: string; suggestedActions: string[] } {
  const lowerMsg = userMessage.toLowerCase();
  let reply = "";
  let suggestedActions: string[] = [];

  if (shouldEscalate) {
    reply = `I completely understand, and I want to make sure you get the best assistance possible. I have flagged your conversation for immediate escalation to our human support team. A specialist is reviewing your context and will step in shortly.`;
    suggestedActions = ["Connect with Human Specialist", "Submit Priority Callback", "Keep Chatting with AI"];
  } else if (category === "billing") {
    if (lowerMsg.includes("refund")) {
      reply = `Under our 14-day refund policy, new monthly and annual subscriptions can be fully refunded with no questions asked if requested within 14 days of purchase. Would you like me to open a formal refund ticket for our Billing team to issue your credit?`;
      suggestedActions = ["Confirm Refund Request", "Check Invoice Date", "Speak to Billing Agent"];
    } else {
      reply = `Invoices are generated within 1 hour of payment and can be downloaded anytime from **Settings > Billing > Invoices**. We accept all major cards, PayPal, and wire transfers for Enterprise plans.`;
      suggestedActions = ["Download Invoices", "Update Payment Method", "Billing FAQ"];
    }
  } else if (category === "technical") {
    if (lowerMsg.includes("rate limit") || lowerMsg.includes("429")) {
      reply = `Our Pro tier provides 1,000 RPM, while Free tier is capped at 60 RPM. When receiving HTTP 429, please inspect the \`Retry-After\` response header to pace requests. If you require an emergency production quota increase, our engineering team can adjust your ceiling.`;
      suggestedActions = ["Request Quota Increase", "View Webhook Docs", "Talk to Engineering"];
    } else {
      reply = `For technical issues, you can verify system health at status.nexuscloud.io (99.95% SLA). Ensure all webhook endpoints respond with HTTP 200 within 5 seconds. If you're experiencing a persistent exception, please share your error trace.`;
      suggestedActions = ["Check Status Page", "Upload Log Details", "Escalate to Support"];
    }
  } else if (category === "account") {
    if (lowerMsg.includes("sso") || lowerMsg.includes("okta") || lowerMsg.includes("saml")) {
      reply = `SAML SSO is supported for Team and Enterprise tiers with Okta, Azure AD, and Google Workspace. You can retrieve your SP ACS URL and Entity ID inside **Settings > Security > SAML SSO**.`;
      suggestedActions = ["View SAML Setup Guide", "Download SP Metadata", "Talk to Security Team"];
    } else {
      reply = `To reset your credentials, visit the forgot password page or manage your 2FA devices under **Settings > Security**. Let me know if you need recovery codes or help verifying your identity.`;
      suggestedActions = ["Reset Password Link", "2FA Troubleshooting", "Contact Agent"];
    }
  } else {
    reply = `Hello! I'm OmniSupport AI, your Nexus Cloud assistant. I can assist you with billing questions, technical API configurations, SAML SSO setup, or connect you directly with a human specialist. How can I help you today?`;
    suggestedActions = ["Billing & Invoices", "API Rate Limits", "Talk to Human Agent"];
  }

  return { reply, suggestedActions };
}

export async function processCustomerMessage(
  userMessage: string,
  conversationHistory: { sender: string; text: string }[]
): Promise<AIAnalysisResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const { sentiment, category, priority, shouldEscalate } = analyzeIntent(userMessage);

  // Retrieve relevant knowledge base articles (RAG from SQLite)
  const relevantArticles = await searchKnowledgeBase(userMessage, 2);
  const kbContext = relevantArticles.map(a => `Article: ${a.title}\n${a.content}`).join("\n\n");

  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const historyFormatted = conversationHistory
        .map(h => `${h.sender === "customer" ? "Customer" : "Assistant"}: ${h.text}`)
        .join("\n");

      const prompt = `
You are OmniSupport AI, a helpful, polite, and technical tier-1 AI support assistant for Nexus Cloud Technologies.
Use the following company Knowledge Base information to accurately answer customer queries:

[KNOWLEDGE BASE]
${kbContext}

[CONVERSATION HISTORY]
${historyFormatted}

Customer query: "${userMessage}"

Instructions:
1. Provide a direct, professional, and friendly response grounded in the knowledge base.
2. If the customer clearly asks to speak to a human or is angry/stuck, acknowledge their wish warmly and confirm that a human specialist has been alerted.
3. Return your response in standard clear markdown text.`;

      const result = await model.generateContent(prompt);
      const reply = result.response.text();

      return {
        reply,
        sentiment,
        category,
        priority,
        shouldEscalate,
        suggestedActions: shouldEscalate
          ? ["Connect with Human Specialist", "Submit Priority Callback", "Keep Chatting with AI"]
          : ["View Related Documentation", "Was this helpful?", "Contact an Agent"]
      };
    } catch (err) {
      console.warn("Gemini API call failed, falling back to deterministic engine:", err);
    }
  }

  const { reply, suggestedActions } = getMockDeterministicReply(userMessage, category, shouldEscalate);

  return {
    reply,
    sentiment,
    category,
    priority,
    shouldEscalate,
    suggestedActions
  };
}

export async function* processCustomerMessageStream(
  userMessage: string,
  conversationHistory: { sender: string; text: string }[]
): AsyncGenerator<StreamChunk, void, unknown> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const { sentiment, category, priority, shouldEscalate } = analyzeIntent(userMessage);

  // Retrieve relevant knowledge base articles (RAG from SQLite)
  const relevantArticles = await searchKnowledgeBase(userMessage, 2);
  const kbContext = relevantArticles.map(a => `Article: ${a.title}\n${a.content}`).join("\n\n");

  let fullReply = "";

  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const historyFormatted = conversationHistory
        .map(h => `${h.sender === "customer" ? "Customer" : "Assistant"}: ${h.text}`)
        .join("\n");

      const prompt = `
You are OmniSupport AI, a helpful, polite, and technical tier-1 AI support assistant for Nexus Cloud Technologies.
Use the following company Knowledge Base information to accurately answer customer queries:

[KNOWLEDGE BASE]
${kbContext}

[CONVERSATION HISTORY]
${historyFormatted}

Customer query: "${userMessage}"

Instructions:
1. Provide a direct, professional, and friendly response grounded in the knowledge base.
2. If the customer clearly asks to speak to a human or is angry/stuck, acknowledge their wish warmly and confirm that a human specialist has been alerted.
3. Return your response in standard clear markdown text.`;

      const resultStream = await model.generateContentStream(prompt);
      for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        if (text) {
          fullReply += text;
          yield { type: "token", text };
        }
      }

      const finalResult: AIAnalysisResult = {
        reply: fullReply,
        sentiment,
        category,
        priority,
        shouldEscalate,
        suggestedActions: shouldEscalate
          ? ["Connect with Human Specialist", "Submit Priority Callback", "Keep Chatting with AI"]
          : ["View Related Documentation", "Was this helpful?", "Contact an Agent"]
      };

      yield { type: "done", result: finalResult };
      return;
    } catch (err) {
      console.warn("Gemini streaming failed, falling back to token generator:", err);
    }
  }

  // Fallback streaming token generator
  const { reply, suggestedActions } = getMockDeterministicReply(userMessage, category, shouldEscalate);
  const words = reply.split(" ");

  // Stream in small natural word chunks
  for (let i = 0; i < words.length; i += 2) {
    const chunkText = words.slice(i, i + 2).join(" ") + (i + 2 < words.length ? " " : "");
    fullReply += chunkText;
    yield { type: "token", text: chunkText };
    await new Promise((res) => setTimeout(res, 35));
  }

  const finalResult: AIAnalysisResult = {
    reply: fullReply.trim(),
    sentiment,
    category,
    priority,
    shouldEscalate,
    suggestedActions
  };

  yield { type: "done", result: finalResult };
}

// AI Copilot for Human Agents
export async function generateAgentCopilotSuggestions(
  ticketSubject: string,
  ticketCategory: TicketCategory,
  messages: { sender: string; text: string }[]
): Promise<{ suggestedReply: string; summary: string; actionPoints: string[] }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
You are an expert AI Copilot assisting human customer support agents.
Analyze the following support ticket conversation:

Subject: ${ticketSubject}
Category: ${ticketCategory}

Conversation:
${messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}

Respond with a JSON object with strictly these keys:
{
  "suggestedReply": "A concise, empathetic, professional response for the agent to send to the customer.",
  "summary": "A 1-2 sentence executive summary of the customer's core issue and status.",
  "actionPoints": ["Action point 1", "Action point 2"]
}
`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (err) {
      console.warn("Copilot Gemini failed, using deterministic agent copilot:", err);
    }
  }

  // Deterministic high-quality copilot suggestions
  let suggestedReply = `Hi there! Thank you for your patience while we looked into this. I've reviewed your request regarding "${ticketSubject}" and have applied the necessary configuration updates to your account. Please let me know if you are able to verify this on your end!`;
  let summary = `Customer is inquiring about ${ticketSubject}. Issue requires agent verification and follow-up.`;
  let actionPoints = ["Verify customer plan entitlements", "Check telemetry/logs for error codes", "Send follow-up confirmation"];

  if (ticketCategory === "technical") {
    suggestedReply = `Hello! I took a look at the telemetry for your workspace. I've initiated a temporary burst quota adjustment and verified that our webhook listeners are operating normally. Could you try re-triggering your batch request now?`;
    summary = `Customer encountered technical latency or HTTP rate limiting. Verified logs and adjusted quota headroom.`;
    actionPoints = ["Confirm webhook HTTP 200 responses", "Advise customer on exponential backoff retries"];
  } else if (ticketCategory === "billing") {
    suggestedReply = `Hello! I've reviewed your billing ledger. As your request is within the 14-day policy window, I've submitted a full refund request to Stripe. You should see the credit reflected on your statement within 3-5 business days.`;
    summary = `Billing inquiry requesting refund or invoice clarification within eligible policy window.`;
    actionPoints = ["Process Stripe refund token", "Issue revised zero-balance credit note"];
  }

  return {
    suggestedReply,
    summary,
    actionPoints
  };
}
