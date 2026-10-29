// Keep Live Online limited to anonymous platform/session presence. Do not
// publish account IDs or email addresses on this public Realtime channel.
export async function startPingCarPresence(supabase) {
  const capacitorPlatform = window.Capacitor?.getPlatform?.();
  const platform = capacitorPlatform === "ios"
    ? "iphone"
    : capacitorPlatform === "android"
      ? "android"
      : "website";

  const channel = supabase.channel("pingcar-online", {
    config: {
      presence: {
        key: `${platform}-${crypto.randomUUID()}`
      }
    }
  });

  channel.subscribe(async status => {
    if (status !== "SUBSCRIBED") return;

    try {
      await channel.track({ platform });
      console.log(`PingCar Live Online: ${platform} connected`);
    } catch (error) {
      console.error("PingCar Live Online tracking error:", error);
    }
  });

  window.pingcarOnlineChannel = channel;
  window.addEventListener("pagehide", () => {
    void supabase.removeChannel(channel);
  }, { once: true });

  return channel;
}
