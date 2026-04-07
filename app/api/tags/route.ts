import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';

export async function GET() {
  try {
    const allTags = await db.select().from(tags).orderBy(tags.name);
    return NextResponse.json({ tags: allTags });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
