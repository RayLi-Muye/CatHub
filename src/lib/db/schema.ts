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
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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

export const postMediaTypeEnum = pgEnum("post_media_type", [
  "none",
  "image",
  "video",
]);

export const bowelStatusEnum = pgEnum("bowel_status", [
  "normal",
  "soft",
  "hard",
  "diarrhea",
  "constipation",
  "none",
]);

export const lineageParentRoleEnum = pgEnum("lineage_parent_role", [
  "sire",
  "dam",
  "unknown",
]);

export const lineageStatusEnum = pgEnum("lineage_status", [
  "pending",
  "confirmed",
  "disputed",
  "revoked",
]);

export const lineageSourceTypeEnum = pgEnum("lineage_source_type", [
  "internal",
  "external",
  "registry",
  "import",
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

// ===== Cat Lineage Graph =====

export const catLineageEdges = pgTable(
  "cat_lineage_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentCatId: uuid("parent_cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    childCatId: uuid("child_cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    parentRole: lineageParentRoleEnum("parent_role").notNull(),
    status: lineageStatusEnum("status").notNull().default("confirmed"),
    sourceType: lineageSourceTypeEnum("source_type")
      .notNull()
      .default("internal"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    confirmedByUserId: uuid("confirmed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    identitySnapshot: json("identity_snapshot").$type<{
      parent: {
        id: string;
        ownerId: string;
        slug: string;
        name: string;
        breed: string | null;
        sex: "male" | "female" | "unknown" | null;
        birthdate: string | null;
        avatarUrl: string | null;
      };
      child: {
        id: string;
        ownerId: string;
        slug: string;
        name: string;
        breed: string | null;
        sex: "male" | "female" | "unknown" | null;
        birthdate: string | null;
        avatarUrl: string | null;
      };
    }>(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("lineage_edges_parent_idx").on(table.parentCatId),
    index("lineage_edges_child_idx").on(table.childCatId),
    index("lineage_edges_created_by_idx").on(table.createdByUserId),
    index("lineage_edges_child_role_status_idx").on(
      table.childCatId,
      table.parentRole,
      table.status
    ),
    index("lineage_edges_parent_status_idx").on(
      table.parentCatId,
      table.status
    ),
    uniqueIndex("lineage_edges_parent_child_confirmed_idx")
      .on(table.parentCatId, table.childCatId)
      .where(sql`${table.status} = 'confirmed'`),
    uniqueIndex("lineage_edges_child_sire_confirmed_idx")
      .on(table.childCatId)
      .where(
        sql`${table.parentRole} = 'sire' and ${table.status} = 'confirmed'`
      ),
    uniqueIndex("lineage_edges_child_dam_confirmed_idx")
      .on(table.childCatId)
      .where(
        sql`${table.parentRole} = 'dam' and ${table.status} = 'confirmed'`
      ),
    check(
      "lineage_edges_no_self_parent_check",
      sql`${table.parentCatId} <> ${table.childCatId}`
    ),
  ]
);

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

// ===== Timeline Posts =====

export const timelinePosts = pgTable("timeline_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  catId: uuid("cat_id")
    .notNull()
    .references(() => cats.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  mediaType: postMediaTypeEnum("media_type").default("none"),
  isHealthAlert: boolean("is_health_alert").default(false),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ===== Daily Check-ins =====

export const dailyCheckins = pgTable(
  "daily_checkins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    catId: uuid("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    appetiteScore: integer("appetite_score").notNull(),
    energyScore: integer("energy_score").notNull(),
    bowelStatus: bowelStatusEnum("bowel_status").notNull(),
    moodEmoji: varchar("mood_emoji", { length: 10 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("checkins_cat_date_idx").on(table.catId, table.date),
  ]
);
