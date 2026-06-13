import { GLOBAL_TELEGRAM_CONFIG } from "../storage/keys";
import type { StorageBackend } from "../storage/types";
import { getTextBlob } from "../myxl/blob";
import type { Env } from "../env";

export interface TelegramConfig {
  bot_token: string;
  enabled: boolean;
  webhook_secret: string;
  daily_summary_enabled: boolean;
  daily_summary_hour: number;
  daily_summary_minute: number;
  low_quota_threshold_pct: number;
  poll_interval_minutes: number;
}

const DEFAULTS: Omit<TelegramConfig, "bot_token" | "webhook_secret"> = {
  enabled: false,
  daily_summary_enabled: true,
  daily_summary_hour: 7,
  daily_summary_minute: 0,
  low_quota_threshold_pct: 10,
  poll_interval_minutes: 5,
};

export async function loadTelegramConfig(env: Env, storage: StorageBackend): Promise<TelegramConfig> {
  const raw = await getTextBlob(storage, null, GLOBAL_TELEGRAM_CONFIG);
  let blob: Record<string, unknown> = {};
  if (raw) {
    try {
      blob = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      blob = {};
    }
  }

  const botToken = String(env.TELEGRAM_BOT_TOKEN ?? blob.bot_token ?? "");
  const webhookSecret = String(env.TELEGRAM_WEBHOOK_SECRET ?? blob.webhook_secret ?? "");

  return {
    bot_token: botToken,
    webhook_secret: webhookSecret,
    enabled: Boolean(blob.enabled ?? DEFAULTS.enabled) || !!botToken,
    daily_summary_enabled: Boolean(blob.daily_summary_enabled ?? DEFAULTS.daily_summary_enabled),
    daily_summary_hour: Number(blob.daily_summary_hour ?? DEFAULTS.daily_summary_hour),
    daily_summary_minute: Number(blob.daily_summary_minute ?? DEFAULTS.daily_summary_minute),
    low_quota_threshold_pct: Number(blob.low_quota_threshold_pct ?? DEFAULTS.low_quota_threshold_pct),
    poll_interval_minutes: Number(blob.poll_interval_minutes ?? DEFAULTS.poll_interval_minutes),
  };
}