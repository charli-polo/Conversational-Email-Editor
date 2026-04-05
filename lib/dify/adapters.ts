import type {
  FeedbackAdapter,
  AttachmentAdapter,
  DictationAdapter,
  PendingAttachment,
  CompleteAttachment,
  Attachment,
} from '@assistant-ui/react';
import { basePath } from '@/lib/base-path';

/**
 * Creates a FeedbackAdapter that submits like/dislike to the Dify feedback API
 * and persists the rating in SQLite via the /api/brief/feedback proxy route.
 */
export function createDifyFeedbackAdapter(
  getThreadId: () => string
): FeedbackAdapter {
  return {
    submit: async (feedback) => {
      const threadId = getThreadId();
      const metadata = feedback.message.metadata as unknown as Record<string, unknown> | undefined;
      const custom = metadata?.custom as Record<string, unknown> | undefined;
      const difyMessageId = custom?.difyMessageId as string | undefined;
      const rating = feedback.type === 'positive' ? 'like' : 'dislike';

      await fetch(`${basePath}/api/brief/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: feedback.message.id,
          difyMessageId,
          threadId,
          rating,
        }),
      });
    },
  };
}

/**
 * Creates an AttachmentAdapter that uploads files to Dify via the /api/brief/upload
 * proxy route and stores the upload_file_id for chat-messages reference.
 */
export function createDifyAttachmentAdapter(): AttachmentAdapter {
  return {
    accept: 'image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.md',

    async add({ file }: { file: File }): Promise<PendingAttachment> {
      return {
        id: crypto.randomUUID(),
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        contentType: file.type,
        file,
        status: { type: 'requires-action', reason: 'composer-send' },
      } satisfies PendingAttachment;
    },

    async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
      const formData = new FormData();
      formData.append('file', attachment.file);

      const res = await fetch(`${basePath}/api/brief/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`File upload failed: ${res.status}`);
      }

      const data = await res.json();
      return {
        ...attachment,
        id: data.id, // Dify upload_file_id — extracted in onNew to reference in chat
        status: { type: 'complete' },
        content: [{ type: 'text', text: `[File: ${attachment.name}]` }],
      } as unknown as CompleteAttachment;
    },

    async remove(_attachment: Attachment): Promise<void> {
      // No Dify endpoint for removing uploaded files — no-op
    },
  };
}

/**
 * Creates a DictationAdapter that records audio via MediaRecorder,
 * sends it to Dify's /audio-to-text endpoint via the /api/brief/audio proxy,
 * and returns the transcribed text to fill the composer.
 */
export function createDifyDictationAdapter(): DictationAdapter {
  return {
    listen(): DictationAdapter.Session {
      let mediaRecorder: MediaRecorder | null = null;
      let audioChunks: Blob[] = [];
      const subscribers = {
        speechStart: [] as (() => void)[],
        speechEnd: [] as ((result: DictationAdapter.Result) => void)[],
        speech: [] as ((result: DictationAdapter.Result) => void)[],
      };
      let status: DictationAdapter.Status = { type: 'starting' };

      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstart = () => {
          status = { type: 'running' };
          subscribers.speechStart.forEach((cb) => cb());
        };

        mediaRecorder.start();
      }).catch(() => {
        status = { type: 'ended', reason: 'error' };
      });

      return {
        get status() {
          return status;
        },

        async stop(): Promise<void> {
          if (!mediaRecorder) return;
          return new Promise<void>((resolve) => {
            mediaRecorder!.onstop = async () => {
              const blob = new Blob(audioChunks, { type: 'audio/webm' });
              const formData = new FormData();
              formData.append('file', blob, 'recording.webm');
              try {
                const res = await fetch(`${basePath}/api/brief/audio`, {
                  method: 'POST',
                  body: formData,
                });
                const data = await res.json();
                const result: DictationAdapter.Result = {
                  transcript: data.text || '',
                  isFinal: true,
                };
                subscribers.speechEnd.forEach((cb) => cb(result));
                subscribers.speech.forEach((cb) => cb(result));
              } catch {
                subscribers.speechEnd.forEach((cb) =>
                  cb({ transcript: '', isFinal: true })
                );
              }
              status = { type: 'ended', reason: 'stopped' };
              // Release microphone
              mediaRecorder!.stream.getTracks().forEach((t) => t.stop());
              resolve();
            };
            mediaRecorder!.stop();
          });
        },

        cancel(): void {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stream.getTracks().forEach((t) => t.stop());
            mediaRecorder.stop();
          }
          status = { type: 'ended', reason: 'cancelled' };
        },

        onSpeechStart(cb: () => void) {
          subscribers.speechStart.push(cb);
          return () => {
            subscribers.speechStart = subscribers.speechStart.filter((c) => c !== cb);
          };
        },

        onSpeechEnd(cb: (result: DictationAdapter.Result) => void) {
          subscribers.speechEnd.push(cb);
          return () => {
            subscribers.speechEnd = subscribers.speechEnd.filter((c) => c !== cb);
          };
        },

        onSpeech(cb: (result: DictationAdapter.Result) => void) {
          subscribers.speech.push(cb);
          return () => {
            subscribers.speech = subscribers.speech.filter((c) => c !== cb);
          };
        },
      };
    },
  };
}
