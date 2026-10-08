import { NextResponse } from "next/server";
import { 
  getKnowledgeArticleById, 
  updateKnowledgeArticle, 
  deleteKnowledgeArticle,
  extractKeywordsFromText 
} from "@/lib/knowledgeBase";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await getKnowledgeArticleById(params.id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ article });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch article", details: err?.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { title, category, content, keywords } = body;

    let updatedKeywords = keywords;
    if (!updatedKeywords && (title || content)) {
      const existing = await getKnowledgeArticleById(params.id);
      if (existing) {
        updatedKeywords = extractKeywordsFromText(
          `${title || existing.title} ${content || existing.content}`
        );
      }
    }

    const updated = await updateKnowledgeArticle(params.id, {
      title,
      category,
      content,
      keywords: updatedKeywords,
    });

    if (!updated) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update article", details: err?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteKnowledgeArticle(params.id);
    if (!success) {
      return NextResponse.json({ error: "Failed to delete article" }, { status: 400 });
    }
    return NextResponse.json({ success: true, deletedId: params.id });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete article", details: err?.message }, { status: 500 });
  }
}
