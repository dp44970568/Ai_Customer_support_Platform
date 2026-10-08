import { prisma } from "./prisma";
import { KnowledgeArticle, TicketCategory } from "@/types";
import { INITIAL_KNOWLEDGE_ARTICLES, seedDatabaseIfNeeded } from "./seed";

export { INITIAL_KNOWLEDGE_ARTICLES as DEFAULT_KNOWLEDGE_ARTICLES };

function formatArticle(row: any): KnowledgeArticle {
  let keywords: string[] = [];
  try {
    keywords = typeof row.keywords === "string" ? JSON.parse(row.keywords) : row.keywords || [];
  } catch {
    keywords = [];
  }

  return {
    id: row.id,
    title: row.title,
    category: row.category as TicketCategory,
    content: row.content,
    keywords,
    lastUpdated: row.lastUpdated,
  };
}

export async function getAllKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  await seedDatabaseIfNeeded();
  const rows = await prisma.knowledgeArticle.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(formatArticle);
}

export async function getKnowledgeArticleById(id: string): Promise<KnowledgeArticle | null> {
  await seedDatabaseIfNeeded();
  const row = await prisma.knowledgeArticle.findUnique({
    where: { id },
  });
  return row ? formatArticle(row) : null;
}

export async function searchKnowledgeBase(query: string, limit: number = 3): Promise<KnowledgeArticle[]> {
  const articles = await getAllKnowledgeArticles();
  const queryTokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (queryTokens.length === 0) return articles.slice(0, limit);

  const scored = articles.map((article) => {
    let score = 0;
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();

    for (const token of queryTokens) {
      if (titleLower.includes(token)) score += 5;
      if (article.keywords.some((k) => k.toLowerCase().includes(token))) score += 4;
      if (contentLower.includes(token)) score += 1;
    }

    return { article, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

export async function createKnowledgeArticle(data: {
  id?: string;
  title: string;
  category: TicketCategory;
  content: string;
  keywords?: string[];
}): Promise<KnowledgeArticle> {
  await seedDatabaseIfNeeded();

  const id = data.id || `kb-${Date.now().toString(36)}`;
  const dateStr = new Date().toISOString().split("T")[0];
  const keywords = data.keywords && data.keywords.length > 0
    ? data.keywords
    : extractKeywordsFromText(data.title + " " + data.content);

  const row = await prisma.knowledgeArticle.create({
    data: {
      id,
      title: data.title,
      category: data.category,
      content: data.content,
      keywords: JSON.stringify(keywords),
      lastUpdated: dateStr,
    },
  });

  return formatArticle(row);
}

export async function updateKnowledgeArticle(
  id: string,
  data: {
    title?: string;
    category?: TicketCategory;
    content?: string;
    keywords?: string[];
  }
): Promise<KnowledgeArticle | null> {
  await seedDatabaseIfNeeded();

  const existing = await prisma.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) return null;

  const dateStr = new Date().toISOString().split("T")[0];
  const keywords = data.keywords
    ? JSON.stringify(data.keywords)
    : existing.keywords;

  const row = await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      category: data.category ?? existing.category,
      content: data.content ?? existing.content,
      keywords,
      lastUpdated: dateStr,
    },
  });

  return formatArticle(row);
}

export async function deleteKnowledgeArticle(id: string): Promise<boolean> {
  await seedDatabaseIfNeeded();
  try {
    await prisma.knowledgeArticle.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}

export function extractKeywordsFromText(text: string, count: number = 6): string[] {
  const stopWords = new Set([
    "the", "and", "that", "have", "for", "not", "with", "you", "this", "but", "his", "from",
    "they", "say", "her", "she", "will", "one", "all", "would", "there", "their", "what",
    "out", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time",
    "no", "just", "him", "know", "take", "people", "into", "year", "your", "good", "some",
    "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its",
    "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first",
    "well", "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const freqMap: Record<string, number> = {};
  for (const w of words) {
    freqMap[w] = (freqMap[w] || 0) + 1;
  }

  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([w]) => w);
}
