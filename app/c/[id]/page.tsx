'use client';

import { use } from 'react';
import { BriefPageContent } from '@/components/brief/brief-page-content';

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BriefPageContent initialThreadId={id} />;
}
