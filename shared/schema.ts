import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// API Configuration table
export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  endpoint: text("endpoint").notNull(),
  headers: json("headers").$type<Record<string, string>>(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).pick({
  name: true,
  endpoint: true,
  headers: true,
});

// Field Mapping table
export const fieldMappings = pgTable("field_mappings", {
  id: serial("id").primaryKey(),
  api_configuration_id: integer("api_configuration_id").notNull(),
  source_field: text("source_field").notNull(),
  target_field: text("target_field").notNull(),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertFieldMappingSchema = createInsertSchema(fieldMappings).pick({
  api_configuration_id: true,
  source_field: true,
  target_field: true,
  is_active: true,
});

// Define Zod schemas for API requests and responses
export const searchRequestSchema = z.object({
  query: z.string().min(1),
  field: z.string().min(1),
  apiConfigId: z.number(),
  // Optional selection information
  selection: z.object({
    baseId: z.string().nullable().optional(),
    tableId: z.string().nullable().optional(),
    fieldId: z.string().nullable().optional(),
    viewId: z.string().nullable().optional(),
    recordId: z.string().nullable().optional(),
  }).optional(),
});

export const updateRequestSchema = z.object({
  recordId: z.string().min(1),
  primaryKey: z.string().min(1),
  primaryKeyValue: z.string().min(1),
  apiConfigId: z.number(),
  mappings: z.array(z.object({
    id: z.number().optional(),
    sourceField: z.string(),
    targetField: z.string(),
    isActive: z.boolean(),
  })),
  // Optional field values that will be updated
  fieldValues: z.record(z.string(), z.any()).optional(),
  // Optional selection information
  selection: z.object({
    baseId: z.string().nullable().optional(),
    tableId: z.string().nullable().optional(),
    fieldId: z.string().nullable().optional(),
    viewId: z.string().nullable().optional(),
    recordId: z.string().nullable().optional(),
  }).optional(),
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;

export type InsertFieldMapping = z.infer<typeof insertFieldMappingSchema>;
export type FieldMapping = typeof fieldMappings.$inferSelect;

export type SearchRequest = z.infer<typeof searchRequestSchema>;
export type UpdateRequest = z.infer<typeof updateRequestSchema>;
