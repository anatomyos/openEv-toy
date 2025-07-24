import { NextResponse } from 'next/server';
import openai from '@/src/lib/openai';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const { query, searchId } = await req.json();
    const keywordExtraction = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Extract medical keywords as comma-separated list.' },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
    });
    const keywords =
      keywordExtraction.choices[0].message.content?.split(',').map((k) => k.trim()) || [];
    const matchingAds = await prisma.ad.findMany({
      where: { isActive: true, keywords: { hasSome: keywords }, budget: { gt: 0 } },
      take: 3,
    });
    await prisma.adImpression.createMany({
      data: matchingAds.map((ad) => ({ adId: ad.id, searchId, clicked: false })),
    });
    return NextResponse.json({ ads: matchingAds });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to match ads' }, { status: 500 });
  }
}
