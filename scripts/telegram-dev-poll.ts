/**
 * Local development bot runner. Long-polls Telegram getUpdates and feeds each
 * update to the same handleUpdate() the production webhook uses, so button taps
 * and /start work on localhost without a public URL.
 *
 * Run: npm run bot:dev   (stop with Ctrl+C)
 * Not for production — deploy uses the webhook route instead.
 */
import "dotenv/config";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN not set in .env");
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;

async function main() {
  const { handleUpdate } = await import("../src/features/telegram/handle-update");

  // getUpdates and a webhook are mutually exclusive — drop any webhook first.
  await fetch(`${API}/deleteWebhook`, { method: "POST" });
  console.log("Polling for updates... (Ctrl+C to stop)");

  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
      const data = await res.json();
      if (!data.ok) {
        console.error("getUpdates error:", data.description);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      for (const update of data.result as { update_id: number }[]) {
        offset = update.update_id + 1;
        console.log("update:", JSON.stringify(update).slice(0, 200));
        try {
          await handleUpdate(update as Parameters<typeof handleUpdate>[0]);
        } catch (err) {
          console.error("handleUpdate error:", err);
        }
      }
    } catch (err) {
      console.error("poll loop error:", err);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main();
