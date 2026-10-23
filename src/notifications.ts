import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Local re-engagement reminder. No backend needed — the OS schedules it.
// Leading apps use server push for this; a local daily reminder covers the
// same retention job for an offline-first prototype.

const REMINDER_ID = "daily-checkin";

export async function enableDailyReminder(hour = 19): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(
    () => {}
  );
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "Your characters miss you",
      body: "Jump back in and pick up a conversation.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(
    () => {}
  );
}
