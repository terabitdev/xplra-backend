/**
 * Achievement Definitions
 * Firestore collection: achievementDefinitions
 *
 * This is the admin-authored catalog of achievements a player can unlock —
 * separate from the older `achievements` / `adminAchievements` collections,
 * which store per-user "already achieved" records, not definitions.
 *
 * The enum lists below (asset type, category, rarity, status, visibility,
 * rule type, event type) were not fully specified — only one example value
 * per field was given. Everything marked "confirmed" came directly from
 * that example; the rest are a reasonable best-guess default set, kept
 * here in one place so they're easy to correct later.
 */

export type AssetType = "IMAGE" | "LOTTIE"; // IMAGE confirmed, LOTTIE inferred
export type AchievementCategory =
  | "EXPLORATION" // confirmed
  | "SOCIAL"
  | "QUESTS"
  | "EVENTS"
  | "CONTRIBUTION"
  | "MILESTONE"
  | "SEASONAL"
  | "OTHER";
export type AchievementRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"; // COMMON confirmed
export type AchievementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"; // PUBLISHED confirmed
export type AchievementVisibility = "DISCOVERABLE" | "HIDDEN" | "SECRET"; // DISCOVERABLE confirmed
export type RuleType = "COUNT" | "THRESHOLD" | "STREAK" | "MANUAL"; // COUNT confirmed
export type RuleEventType = "PLACE_VISITED" | "QUEST_COMPLETED" | "EVENT_ATTENDED" | "CONTRIBUTION_APPROVED"; // PLACE_VISITED confirmed

export interface AchievementRuleConfig {
  event_type: string;
  /** Only meaningful when event_type is PLACE_VISITED. */
  place_category?: string;
  target: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  unlock_hint: string;
  badge_asset_url: string;
  thumbnail_url: string;
  asset_type: string;
  category: string;
  rarity: string;
  status: string;
  visibility: string;
  rule_type: string;
  rule_config: AchievementRuleConfig;
  xp_reward: number;
  retroactive_enabled: boolean;
  sort_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type AchievementDefinitionInput = Omit<
  AchievementDefinition,
  "id" | "created_by" | "created_at" | "updated_at"
>;
