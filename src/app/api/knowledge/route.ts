import { NextResponse } from "next/server";
import { 
  searchKnowledgeBase, 
  getAllKnowledgeArticles, 
  createKnowledgeArticle,
  extractKeywordsFromText 
} from "@/lib/knowledgeBase";
import { TicketCategory } from "@/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (q && q.trim().length > 0) {
      const articles = await searchKnowledgeBase(q, 20);
      return NextResponse.json({ articles });
    }

    const articles = await getAllKnowledgeArticles();
    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch articles", details: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, category, content, keywords } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Article title and content are required." },
        { status: 400 }
      );
    }

    const assignedCategory: TicketCategory = 
      ["billing", "technical", "account", "general"].includes(category) 
        ? category 
        : "general";

    const parsedKeywords = Array.isArray(keywords) && keywords.length > 0
      ? keywords
      : extractKeywordsFromText(`${title} ${content}`);

    const article = await createKnowledgeArticle({
      title: title.trim(),
      category: assignedCategory,
      content: content.trim(),
      keywords: parsedKeywords,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create knowledge article", details: err?.message },
      { status: 500 }
    );
  }
}
