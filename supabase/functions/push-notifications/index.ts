import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import webPush from "https://esm.sh/web-push@3.6.6";

// Set VAPID details
// These need to be set as environment variables in Supabase
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
const vapidSubject = "mailto:admin@mindflow.com";

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn("VAPID keys not set. Push notifications will not work.");
} else {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the payload (this expects the notification data to be passed)
    const { record: notification } = await req.json();

    if (!notification) {
      return new Response(JSON.stringify({ error: "No notification payload provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Determine target audience
    const targetAudience = notification.target_audience || 'all';

    // Fetch users with matching target audience who have push enabled
    // Note: Since target audience is part of settings (which we might not have in auth.users directly),
    // we fetch all users who have push enabled and the category enabled,
    // then filter if we have audience data, or just send to all if we don't strict filter.

    const { data: preferences, error: prefError } = await supabaseClient
      .from('notification_preferences')
      .select('user_id, push_enabled, categories');

    if (prefError) throw prefError;

    const targetUserIds = preferences
      .filter((pref) => {
        if (!pref.push_enabled) return false;

        // Check if category is enabled
        const categories = pref.categories as Record<string, boolean>;
        if (categories && categories[notification.type] === false) {
           return false; // User disabled this specific category
        }

        return true;
      })
      .map((p) => p.user_id);

    if (targetUserIds.length === 0) {
      return new Response(JSON.stringify({ message: "No target users found with push enabled." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch push subscriptions for those users
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .in("user_id", targetUserIds);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No active push subscriptions found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Send push notifications
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: "/android-chrome-192x192.png", // Ensure you have this icon
      badge: "/favicon-32x32.png", // Ensure you have this badge
      data: {
        url: notification.link || "/", // Default URL if none provided
      },
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        };

        try {
          await webPush.sendNotification(pushSubscription, payload);
        } catch (error) {
          console.error("Error sending push to endpoint:", sub.endpoint, error);
          // If the subscription is no longer valid, delete it
          if (error.statusCode === 410 || error.statusCode === 404) {
             await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw error;
        }
      })
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        message: `Push notifications processed. Success: ${successCount}, Failed: ${failCount}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Internal Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
