import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(), // nanoid
  label: text('label').notNull(),
  apiKey: text('api_key').notNull(),
  baseUrl: text('base_url').notNull().default('https://api.dify.ai'),
  difyUrl: text('dify_url'),
  conversationMode: text('conversation_mode', { enum: ['chatbot', 'agent'] }).notNull().default('chatbot'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const testPrompts = sqliteTable('test_prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  text: text('text').notNull(),
  autoSend: integer('auto_send', { mode: 'boolean' }).notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title'),
  agentId: text('agent_id').references(() => agents.id),
  agentConfigSnapshot: text('agent_config_snapshot'),
  difyConversationId: text('dify_conversation_id'),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
