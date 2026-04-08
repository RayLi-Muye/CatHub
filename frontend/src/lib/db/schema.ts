import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  integer,
  numeric,
  json,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ===== Enums =====

export const catSexEnum = pgEnum("cat_sex", ["male", "female", "unknown"]);

export const healthRecordTypeEnum = pgEnum("health_record_type", [
  "checkup",
  "vaccination",
  "surgery",
  "illness",
  "medication",
  "other",
]);

// ===== Users =====

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 40 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== Cats =====

export const cats = pgTable(
  "cats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    breed: varchar("breed", { length: 100 }),
    sex: catSexEnum("sex").default("unknown"),
    birthdate: timestamp("birthdate", { mode: "date" }),
    description: text("description"),
    avatarUrl: text("avatar_url"),
    colorMarkings: varchar("color_markings", { length: 255 }),
    microchipId: varchar("microchip_id", { length: 50 }),
    isNeutered: boolean("is_neutered").default(false),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    isPublic: boolean("is_public").default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("cats_owner_slug_idx").on(table.ownerId, table.slug)]
);

// ===== Cat Images =====

export const catImages = pgTable("cat_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  catId: uuid("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  sizeBytes: integer("size_bytes"),
  isPrimary: boolean("is_primary").default(false),
  sortOrder: integer("sort_order").default(0),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== Health Records =====

export const healthRecords = pgTable("health_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  catId: uuid("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  type: healthRecordTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  date: timestamp("date", { mode: "date" }).notNull(),
  vetName: varchar("vet_name", { length: 100 }),
  vetClinic: varchar("vet_clinic", { length: 200 }),
  attachments: json("attachments").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== Weight Logs =====

export const weightLogs = pgTable("weight_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  catId: uuid("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at", { mode: "date" }).notNull(),
  notes: text("notes"),
});
