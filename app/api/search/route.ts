import { NextResponse } from 'next/server';
import openai from '@/src/lib/openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

interface MedicalArticle {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  publishDate: Date;
  source: string;
  url?: string;
}


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // extract keywords from the query
    const keywordExtraction = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Extract relevant medical keywords as a comma separated list.' },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
    });

    const keywords =
      keywordExtraction.choices[0].message.content?.split(',').map((k) => k.trim()) || [];

    // ask OpenAI for recent articles related to the query
    const searchPrompt = `You are a medical research assistant. Provide a JSON object with an \
    \"articles\" array of up to 5 items from reputable online research journals \
    or the newest American Medical Association guidelines that best match the \
    following query: \"${query}\". Respond with JSON only and include for each \
    article the fields title, abstract, authors (array), keywords (array), \
    publishDate (ISO 8601 date), source, and url.`;

    const articleResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: searchPrompt }],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const articleContent = articleResponse.choices[0].message.content || '{}';
    let parsedArticles: unknown[] = [];
    let rawArticleContent: string | null = null;
    try {
      const { articles = [] } = JSON.parse(articleContent);
      parsedArticles = Array.isArray(articles) ? articles : [];
    } catch (e) {
      console.error('Failed to parse article response', e, articleContent);
      rawArticleContent = articleContent;
    }

    const articles: MedicalArticle[] = [];
    if (Array.isArray(parsedArticles)) {
      for (const item of parsedArticles) {
        try {
          const stored = await prisma.medicalArticle.upsert({
            where: { title: item.title },
            update: {},
            create: {
              title: item.title,
              abstract: item.abstract,
              authors: item.authors || [],
              keywords: item.keywords || [],
              publishDate: item.publishDate ? new Date(item.publishDate) : new Date(),
              source: item.source || 'unknown',
              url: item.url || undefined,
            },
          });
          articles.push(stored);
        } catch (e) {
          console.error('Failed to store article', e);
        }
      }
    }

    let aiSummary: string | null = null;
    if (articles.length > 0) {
      const summaryPrompt = `Please summarize the following articles in clear and accessible language. Highlight any practical management steps or clinical implications. Maintain scientific accuracy:\n\n${articles
        .map((a) => `Title: ${a.title}\nAbstract: ${a.abstract}`)
        .join('\n\n')}\n\nConcise summary:`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: summaryPrompt }],
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        max_tokens: 800,
      });

      aiSummary = completion.choices[0]?.message?.content || null;
    }

    // record the search for history
    await prisma.search.create({
      data: {
        query,
        userId: session.user.id,
        aiSummary,
        articles: { connect: articles.map((a) => ({ id: a.id })) },
      },
    });

    const citations = articles.map((a) => ({ id: a.id, title: a.title, url: a.url }));
    return NextResponse.json({ articles: citations, aiSummary, keywords, rawArticleContent });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
