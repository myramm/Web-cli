import type { InlineKeyboard } from "./types";

export interface TelegramApi {
  sendMessage(chatId: number, text: string, replyMarkup?: InlineKeyboard): Promise<boolean>;
  editMessage(chatId: number, messageId: number, text: string, replyMarkup?: InlineKeyboard): Promise<boolean>;
  answerCallbackQuery(callbackQueryId: string): Promise<void>;
}

export function createTelegramApi(botToken: string, fetchFn: typeof fetch = fetch): TelegramApi {
  const base = `https://api.telegram.org/bot${botToken}`;

  async function post(method: string, body: Record<string, unknown>): Promise<Response> {
    return fetchFn(`${base}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  return {
    async sendMessage(chatId, text, replyMarkup) {
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;
      try {
        const res = await post("sendMessage", payload);
        return res.ok;
      } catch {
        return false;
      }
    },

    async editMessage(chatId, messageId, text, replyMarkup) {
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      };
      if (replyMarkup) payload.reply_markup = replyMarkup;
      try {
        const res = await post("editMessageText", payload);
        return res.ok;
      } catch {
        return false;
      }
    },

    async answerCallbackQuery(callbackQueryId) {
      try {
        await post("answerCallbackQuery", { callback_query_id: callbackQueryId });
      } catch {
        // ignore
      }
    },
  };
}