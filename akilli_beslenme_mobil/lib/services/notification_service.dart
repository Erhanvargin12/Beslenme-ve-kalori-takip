import 'package:awesome_notifications/awesome_notifications.dart';
import 'package:flutter/material.dart';

class NotificationService {
  static Future<void> initializeNotification() async {
    await AwesomeNotifications().initialize(
      null, // Default icon
      [
        NotificationChannel(
          channelKey: 'basic_channel',
          channelName: 'Basic notifications',
          channelDescription: 'Notification channel for basic tests',
          defaultColor: const Color(0xFF6366F1),
          ledColor: Colors.white,
          importance: NotificationImportance.High,
        )
      ],
      debug: true,
    );

    // İzin iste
    await AwesomeNotifications().isNotificationAllowed().then((isAllowed) {
      if (!isAllowed) {
        AwesomeNotifications().requestPermissionToSendNotifications();
      }
    });
  }

  static Future<void> showNotification({
    required String title,
    required String body,
  }) async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: 10,
        channelKey: 'basic_channel',
        title: title,
        body: body,
        notificationLayout: NotificationLayout.Default,
      ),
    );
  }

  static Future<void> showWaterReminder() async {
    await AwesomeNotifications().createNotification(
      content: NotificationContent(
        id: 11,
        channelKey: 'basic_channel',
        title: '💧 Su Vakti!',
        body: 'Vücudunun hidrasyonu için bir bardak su içmeyi unutma.',
        notificationLayout: NotificationLayout.Default,
      ),
    );
  }
}
