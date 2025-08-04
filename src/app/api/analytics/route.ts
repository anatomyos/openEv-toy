import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const advertiserId = searchParams.get('advertiserId');
    const timeframe = searchParams.get('timeframe') || '7d';
    const daysAgo = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const metrics = await prisma.adImpression.groupBy({
      by: ['createdAt'],
      where: {
        ...(advertiserId ? { ad: { advertiserId } } : {}),
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    });
    return NextResponse.json({ metrics });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
