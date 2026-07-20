import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

class SessionTracker with WidgetsBindingObserver {
  DateTime? _startTime;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final String? userId;

  SessionTracker({this.userId});

  void startSession() {
    _startTime = DateTime.now();
    WidgetsBinding.instance.addObserver(this);
    debugPrint('🚀 Oturum başlatıldı: $_startTime');
  }

  void stopSession() {
    if (_startTime != null) {
      final endTime = DateTime.now();
      final duration = endTime.difference(_startTime!);
      _saveSession(duration.inSeconds);
      _startTime = null;
      WidgetsBinding.instance.removeObserver(this);
      debugPrint('🛑 Oturum durduruldu. Süre: ${duration.inSeconds} saniye');
    }
  }

  Future<void> _saveSession(int seconds) async {
    if (seconds < 5) return; // Çok kısa oturumları kaydetme (opsiyonel)

    try {
      await _firestore.collection('user_usage_logs').add({
        'userId': userId ?? 'anonymous',
        'durationSeconds': seconds,
        'createdAt': FieldValue.serverTimestamp(),
      });
      debugPrint('✅ Kullanım süresi kaydedildi: $seconds sn');
    } catch (e) {
      debugPrint('❌ Kullanım süresi kaydedilemedi: $e');
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) {
      stopSession();
    } else if (state == AppLifecycleState.resumed) {
      startSession();
    }
  }
}
