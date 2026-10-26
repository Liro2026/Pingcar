const isAndroidApp = window.Capacitor?.getPlatform?.() === "android";

if (isAndroidApp) {
  try {
    // Use the Capacitor plugin bundle shipped with the app. This avoids making
    // notification registration depend on a third-party CDN being reachable.
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "./js/capacitor-push-notifications.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Android push plugin could not be loaded."));
      document.head.appendChild(script);
    });
    const PushNotifications = window.capacitorPushNotifications?.PushNotifications;
    if (!PushNotifications) throw new Error("Capacitor push plugin is not available.");

    await PushNotifications.createChannel({
      id: "chat_messages",
      name: "PingCar Chat",
      description: "New messages about your vehicle",
      importance: 4,
      visibility: 1,
      vibration: true,
    });

    PushNotifications.addListener("registration", ({ value }) => {
      if (value) {
        window.dispatchEvent(new CustomEvent("pingcar-android-push-token", {
          detail: { token: value },
        }));
      }
    });

    PushNotifications.addListener("registrationError", event => {
      window.dispatchEvent(new CustomEvent("pingcar-android-push-error", {
        detail: { error: event?.error || "Android push registration failed" },
      }));
    });

    PushNotifications.addListener("pushNotificationActionPerformed", event => {
      const target = event?.notification?.data?.url;
      if (typeof target !== "string") return;

      try {
        const parsed = new URL(target, "https://pingcar.ch");
        if (parsed.origin !== "https://pingcar.ch" || parsed.pathname !== "/message.html") return;
        window.location.assign(`message.html${parsed.search}${parsed.hash}`);
      } catch (error) {
        console.warn("Could not open chat from push notification:", error);
      }
    });

    window.PingCarAndroidPush = {
      checkPermissions: () => PushNotifications.checkPermissions(),
      async register() {
        let permission = await PushNotifications.checkPermissions();
        if (permission.receive !== "granted") {
          permission = await PushNotifications.requestPermissions();
        }
        if (permission.receive !== "granted") {
          throw new Error("Bitte erlaube PingCar die Benachrichtigungen in den Android-Einstellungen.");
        }
        await PushNotifications.register();
      },
    };
    window.dispatchEvent(new Event("pingcar-android-push-ready"));
  } catch (error) {
    console.error("Could not initialize native Android push:", error);
    window.dispatchEvent(new CustomEvent("pingcar-android-push-error", {
      detail: { error: error?.message || String(error) },
    }));
    window.dispatchEvent(new Event("pingcar-android-push-ready"));
  }
}
