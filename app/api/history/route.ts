import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = Number(process.env.SEARCH_HISTORY_LIMIT || 3);

  const searches = await prisma.search.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { articles: true },
    take: limit,
  });

  return NextResponse.json({ searches });
}
