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

    // Use OpenAI to extract relevant keywords from the query
    const keywordExtraction = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Extract relevant medical keywords as a comma separated list.',
        },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
    });

    const keywords =
      keywordExtraction.choices[0].message.content
        ?.split(',')
        .map((k) => k.trim()) || [];

    // Search for articles using the extracted keywords
    const articles = (await prisma.medicalArticle.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { abstract: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: keywords.length ? keywords : query.split(' ') } },
        ],
      },
      orderBy: {
        publishDate: 'desc',
      },
      take: 10,
    })) as MedicalArticle[];

    // Generate AI summary if articles are found
    let aiSummary = null;
    if (articles.length > 0) {
      const prompt = `Analyze and summarize these medical research findings:

${articles.map((a: MedicalArticle) => `Title: ${a.title}\nAbstract: ${a.abstract}`).join('\n\n')}

Please provide a comprehensive yet digestible summary that:
1. Highlights the key findings from each study
2. Identifies common themes or patterns across the studies
3. Explains the practical implications for medical practice
4. Uses clear, accessible language while maintaining scientific accuracy
5. Organizes the information in a logical flow

Keep the summary focused on the most important insights that would be valuable for medical professionals.`;

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        max_tokens: 800,
      });

      aiSummary = completion.choices[0]?.message?.content;
    }

    // Save the search
    await prisma.search.create({
      data: {
        query,
        userId: session.user.id,
        aiSummary,
        articles: {
          connect: articles.map((article: MedicalArticle) => ({ id: article.id })),
        },
      },
    });

    return NextResponse.json({
      articles,
      aiSummary,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
