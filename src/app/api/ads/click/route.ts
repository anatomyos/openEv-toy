import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request) {
  try {
    const { adId, impressionId } = await req.json();
    await prisma.adImpression.update({
      where: { id: impressionId },
      data: { clicked: true },
    });
    await prisma.ad.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record click' }, { status: 500 });
  }
}
