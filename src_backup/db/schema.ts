import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ----------------------------------------------------------------------------
// User Settings
// ----------------------------------------------------------------------------
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  defaultReminderTimesByTaskType: text('default_reminder_times_by_task_type'), // JSON string
  quietHours: text('quiet_hours'), // JSON string, e.g., { start: "22:00", end: "08:00" }
});

// ----------------------------------------------------------------------------
// Templates
// ----------------------------------------------------------------------------
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  difficulty: text('difficulty').notNull(),
  estimatedDailyTimeMins: integer('estimated_daily_time_mins').notNull(),
  totalDurationDays: integer('total_duration_days').notNull(),
  environment: text('environment').notNull(),
});

export const templateTools = sqliteTable('template_tools', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => templates.id),
  name: text('name').notNull(),
});

export const templateConsumables = sqliteTable('template_consumables', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => templates.id),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
});

export const templateTasks = sqliteTable('template_tasks', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => templates.id),
  title: text('title').notNull(),
  description: text('description'),
  taskType: text('task_type').notNull(),
  windowStartDay: integer('window_start_day').notNull(),
  windowEndDay: integer('window_end_day').notNull(),
  timeOfDay: text('time_of_day'), // "09:00" for fixed singular tasks
  isRepeating: integer('is_repeating', { mode: 'boolean' }).notNull().default(false),
  dailyTimes: text('daily_times'), // JSON array of strings e.g., '["09:00", "21:00"]'
});

export const templateLinks = sqliteTable('template_links', {
  fromTemplateId: text('from_template_id').notNull().references(() => templates.id),
  toTemplateId: text('to_template_id').notNull().references(() => templates.id),
  linkType: text('link_type').notNull(), // e.g., "guide", "prerequisite", "learn-more"
  label: text('label').notNull(),
});

// ----------------------------------------------------------------------------
// Inventory & Shopping List
// ----------------------------------------------------------------------------
export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category', { enum: ['tool', 'consumable'] }).notNull(),
  unitDefault: text('unit_default'),
  notes: text('notes'),
});

export const shoppingListItems = sqliteTable('shopping_list_items', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  quantity: real('quantity'),
  unit: text('unit'),
  checked: integer('checked', { mode: 'boolean' }).notNull().default(false),
  storeNote: text('store_note'),
  createdAt: text('created_at').notNull(), // ISO Datetime
});

export const shoppingListLinks = sqliteTable('shopping_list_links', {
  id: text('id').primaryKey(),
  shoppingListItemId: text('shopping_list_item_id').notNull().references(() => shoppingListItems.id),
  runId: text('run_id'), // optional: links to a run
  templateId: text('template_id'), // optional: links to a template definition
});

// ----------------------------------------------------------------------------
// Runs & Timeline
// ----------------------------------------------------------------------------
export const runs = sqliteTable('runs', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull().references(() => templates.id),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['active', 'completed', 'archived'] }).notNull().default('active'),
});

export const runRequiredItems = sqliteTable('run_required_items', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => runs.id),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  requirementType: text('requirement_type', { enum: ['tool', 'consumable'] }).notNull(),
  requiredQuantity: real('required_quantity'),
  unit: text('unit'),
  status: text('status', { enum: ['missing', 'have', 'bought', 'not_needed'] }).notNull().default('missing'),
  linkedShoppingItemId: text('linked_shopping_item_id'), // optional mapping
});

export const runTasks = sqliteTable('run_tasks', {
  id: text('id').primaryKey(),
  runId: text('run_id').notNull().references(() => runs.id),
  templateTaskId: text('template_task_id').notNull().references(() => templateTasks.id),
  dueAt: text('due_at').notNull(), // ISO Datetime string for exact sorting and TZ agnosticism
  status: text('status', { enum: ['pending', 'completed', 'skipped', 'snoozed'] }).notNull().default('pending'),
  completedAt: text('completed_at'), // ISO Datetime string
  note: text('note'),
  // Notifications
  reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).notNull().default(true),
  notificationId: text('notification_id'),
  notificationScheduledAt: text('notification_scheduled_at'), // ISO Datetime string
});
