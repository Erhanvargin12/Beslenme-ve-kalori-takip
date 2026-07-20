import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Backend: fiziksel telefonda PC'nin **Wi-Fi** IPv4 adresi (ör. 10.95.222.75:3000).
class ApiConfig {
  static const _prefKey = 'backend_base_url';
  static const int defaultPort = 3000;

  static const String suggestedWifiIp = String.fromEnvironment(
    'DEV_WIFI_IP',
    defaultValue: '192.168.1.107',
  );

  static String? _cachedUrl;
  static bool _fromDartDefine = false;
  static bool _isEmulator = false;
  static bool needsServerSetup = false;
  static bool _userSaved = false;

  static String get baseUrl {
    if (_cachedUrl != null && _cachedUrl!.isNotEmpty) {
      return _cachedUrl!;
    }
    if (_isEmulator) {
      return _emulatorFallback();
    }
    return 'http://$suggestedWifiIp:$defaultPort';
  }

  static bool get isUserConfigured => _fromDartDefine || _userSaved;

  static bool isLikelyVirtualAdapter(String host) {
    final parts = host.split('.');
    if (parts.length != 4) return false;
    final a = int.tryParse(parts[0]) ?? 0;
    final b = int.tryParse(parts[1]) ?? 0;
    return a == 172 && b >= 16 && b <= 31;
  }

  static String? validateHostOrExplain(String host) {
    if (isLikelyVirtualAdapter(host)) {
      return 'Sanal ağ IP ($host). Wi-Fi IPv4 kullanın: $suggestedWifiIp';
    }
    if (host == '127.0.0.1' || host == 'localhost') {
      // Allowed for adb reverse
      return null;
    }
    return null;
  }

  static Future<void> init() async {
    try {
      // 1. Try UDP Auto-Discovery First
      if (!kIsWeb) {
        try {
          final socket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
          socket.broadcastEnabled = true;
          bool discovered = false;
          
          socket.listen((RawSocketEvent e) {
            if (e == RawSocketEvent.read) {
              final datagram = socket.receive();
              if (datagram != null) {
                final message = String.fromCharCodes(datagram.data);
                if (message.startsWith('AKILLI_BESLENME_SERVER:')) {
                  final port = message.split(':')[1];
                  final ip = datagram.address.address;
                  _cachedUrl = 'http://$ip:$port';
                  _userSaved = true;
                  needsServerSetup = false;
                  discovered = true;
                  debugPrint('[ApiConfig] OTOMATIK SUNUCU BULUNDU: $_cachedUrl');
                }
              }
            }
          });

          // Send broadcast
          socket.send('AKILLI_BESLENME_DISCOVER'.codeUnits, InternetAddress('255.255.255.255'), 3001);
          
          // Wait up to 800ms for reply
          await Future.delayed(const Duration(milliseconds: 800));
          socket.close();
          
          if (discovered) return;
        } catch (e) {
          debugPrint('[ApiConfig] UDP Discovery hatasi: $e');
        }
      }

      // 2. Try Firestore Auto-Discovery (En Güvenilir)
      if (!kIsWeb) {
        try {
          // Check if firebase is initialized
          if (Firebase.apps.isNotEmpty) {
            final doc = await FirebaseFirestore.instance
                .collection('system_config')
                .doc('backend_info')
                .get()
                .timeout(const Duration(seconds: 3));
            
            if (doc.exists && doc.data() != null) {
              final ip = doc.data()!['ip'];
              final port = doc.data()!['port'] ?? defaultPort;
              // Sadece son 1 saat içinde güncellenmişse güven
              final updatedAt = doc.data()!['updatedAt']?.toDate();
              if (updatedAt != null && DateTime.now().difference(updatedAt).inHours < 2) {
                _cachedUrl = 'http://$ip:$port';
                _userSaved = true;
                needsServerSetup = false;
                debugPrint('[ApiConfig] FIRESTORE ÜZERİNDEN SUNUCU BULUNDU: $_cachedUrl');
                return;
              }
            }
          }
        } catch (e) {
          debugPrint('[ApiConfig] Firestore Discovery atlandı: $e');
        }
      }

      const fromDefine = String.fromEnvironment('API_BASE_URL');
      if (fromDefine.trim().isNotEmpty) {
        _cachedUrl = _normalizeUrlUnsafe(fromDefine);
        _fromDartDefine = true;
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefKey);

      if (saved != null && saved.trim().isNotEmpty) {
        final host = _extractHost(saved);
        final hostError = host != null ? validateHostOrExplain(host) : 'Geçersiz adres';
        if (hostError != null) {
          await prefs.remove(_prefKey);
          debugPrint('[ApiConfig] Geçersiz kayıt silindi: $saved');
          needsServerSetup = true;
        } else {
          _cachedUrl = _normalizeUrlUnsafe(saved);
          _userSaved = true;
          debugPrint('[ApiConfig] kayıtlı: $_cachedUrl');
          return;
        }
      }

      if (!kIsWeb && Platform.isAndroid) {
        try {
          final android = await DeviceInfoPlugin().androidInfo
              .timeout(const Duration(seconds: 3));
          if (!android.isPhysicalDevice) {
            _isEmulator = true;
            _cachedUrl = 'http://10.0.2.2:$defaultPort';
            return;
          }
        } catch (e) {
          debugPrint('[ApiConfig] androidInfo atlandı: $e');
        }
      }

      if (!kIsWeb && Platform.isIOS) {
        try {
          final ios = await DeviceInfoPlugin().iosInfo
              .timeout(const Duration(seconds: 3));
          if (!ios.isPhysicalDevice) {
            _isEmulator = true;
            _cachedUrl = 'http://127.0.0.1:$defaultPort';
            return;
          }
        } catch (e) {
          debugPrint('[ApiConfig] iosInfo atlandı: $e');
        }
      }

      needsServerSetup = true;
      _cachedUrl = 'http://$suggestedWifiIp:$defaultPort';
    } catch (e, st) {
      debugPrint('[ApiConfig] init hatası (varsayılan kullanılıyor): $e\n$st');
      _cachedUrl = 'http://$suggestedWifiIp:$defaultPort';
      needsServerSetup = true;
    }
  }

  static String? _extractHost(String input) {
    var value = input.trim();
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'http://$value';
    }
    return Uri.tryParse(value)?.host;
  }

  static String _normalizeUrlUnsafe(String input) {
    var value = input.trim();
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'http://$value';
    }
    final uri = Uri.tryParse(value);
    if (uri == null || uri.host.isEmpty) {
      throw ArgumentError('Geçersiz sunucu adresi');
    }
    final port = uri.hasPort ? uri.port : defaultPort;
    return 'http://${uri.host}:$port';
  }

  static String normalizeUrl(String input) {
    final uri = Uri.parse(_normalizeUrlUnsafe(input));
    final hostError = validateHostOrExplain(uri.host);
    if (hostError != null) {
      throw ArgumentError(hostError);
    }
    return uri.toString();
  }

  static String _emulatorFallback() {
    if (kIsWeb) return 'http://127.0.0.1:$defaultPort';
    if (Platform.isAndroid) return 'http://10.0.2.2:$defaultPort';
    return 'http://127.0.0.1:$defaultPort';
  }

  static Future<String> saveBaseUrl(String input) async {
    final normalized = normalizeUrl(input);
    _cachedUrl = normalized;
    _userSaved = true;
    needsServerSetup = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, normalized);
    return normalized;
  }

  static String connectionHelpMessage() {
    return 'Sunucuya bağlanılamadı.\n\n'
        '1. PC\'de: npm run dev\n'
        '2. Aynı Wi‑Fi\n'
        '3. Doğru IP: $suggestedWifiIp (172.29.x.x değil)';
  }

  static String baseUrlHint() => '$suggestedWifiIp:$defaultPort';
}
