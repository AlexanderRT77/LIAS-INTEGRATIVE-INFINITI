import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";

export interface WebhookEvent {
  id: string;
  type: "analysis.completed" | "report.generated" | "error.occurred";
  timestamp: Date;
  data: Record<string, any>;
}

// In-memory webhook storage (in production, use database)
const webhooks = new Map<string, { url: string; events: string[]; active: boolean }>();

export const webhooksRouter = router({
  /**
   * Register a webhook
   */
  register: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
        events: z.array(z.enum(["analysis.completed", "report.generated", "error.occurred"])),
      })
    )
    .mutation(({ ctx, input }) => {
      const webhookId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      webhooks.set(webhookId, {
        url: input.url,
        events: input.events,
        active: true,
      });

      return {
        id: webhookId,
        url: input.url,
        events: input.events,
        active: true,
      };
    }),

  /**
   * List webhooks for user
   */
  list: protectedProcedure.query(() => {
    return Array.from(webhooks.entries()).map(([id, webhook]) => ({
      id,
      ...webhook,
    }));
  }),

  /**
   * Update webhook
   */
  update: protectedProcedure
    .input(
      z.object({
        webhookId: z.string(),
        url: z.string().url().optional(),
        events: z.array(z.enum(["analysis.completed", "report.generated", "error.occurred"])).optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ input }) => {
      const webhook = webhooks.get(input.webhookId);
      if (!webhook) throw new Error("Webhook not found");

      if (input.url) webhook.url = input.url;
      if (input.events) webhook.events = input.events;
      if (input.active !== undefined) webhook.active = input.active;

      return {
        id: input.webhookId,
        ...webhook,
      };
    }),

  /**
   * Delete webhook
   */
  delete: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(({ input }) => {
      const deleted = webhooks.delete(input.webhookId);
      return { success: deleted };
    }),

  /**
   * Test webhook
   */
  test: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .mutation(async ({ input }) => {
      const webhook = webhooks.get(input.webhookId);
      if (!webhook) throw new Error("Webhook not found");

      try {
        const testPayload = {
          event: "test",
          timestamp: new Date().toISOString(),
          data: {
            message: "This is a test webhook",
          },
        };

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testPayload),
        });

        return {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * Get webhook events (for monitoring)
   */
  getEvents: protectedProcedure
    .input(z.object({ webhookId: z.string() }))
    .query(() => {
      // TODO: Implement event history storage
      return [];
    }),
});

/**
 * Trigger webhook event
 */
export async function triggerWebhookEvent(event: WebhookEvent): Promise<void> {
  for (const [, webhook] of webhooks) {
    if (!webhook.active || !webhook.events.includes(event.type)) continue;

    try {
      await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event.type,
          "X-Webhook-Timestamp": event.timestamp.toISOString(),
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error(`Failed to trigger webhook: ${webhook.url}`, error);
    }
  }
}
