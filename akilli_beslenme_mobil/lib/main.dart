import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'screens/main_navigation.dart';
import 'screens/login_screen.dart';
import 'theme/app_theme.dart';
import 'providers/data_provider.dart';
import 'providers/auth_provider.dart';
import 'services/dio_service.dart';
import 'repositories/user_repository.dart';
import 'repositories/ai_repository.dart';
import 'repositories/meal_repository.dart';
import 'repositories/message_repository.dart';
import 'services/notification_service.dart';
import 'config/api_config.dart';

import 'firebase_options.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const _BootstrapApp());
}

/// Arayüz hemen açılır; ağır init işlemleri arka planda — ANR önlenir.
class _BootstrapApp extends StatefulWidget {
  const _BootstrapApp();

  @override
  State<_BootstrapApp> createState() => _BootstrapAppState();
}

class _BootstrapAppState extends State<_BootstrapApp> {
  bool _ready = false;
  String? _error;
  DioService? _dioService;
  UserRepository? _userRepo;
  AiRepository? _aiRepo;
  MealRepository? _mealRepo;
  MessageRepository? _messageRepo;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      ).timeout(const Duration(seconds: 20));
    } catch (e) {
      debugPrint('[Bootstrap] Firebase: $e');
    }

    // Bildirimler UI'ı bloklamasın
    unawaited(
      NotificationService.initializeNotification().catchError((e) {
        debugPrint('[Bootstrap] Bildirim init: $e');
      }),
    );

    try {
      await ApiConfig.init().timeout(const Duration(seconds: 5));
    } catch (e) {
      debugPrint('[Bootstrap] ApiConfig: $e');
    }

    final dio = DioService();
    dio.updateBaseUrl(ApiConfig.baseUrl);

    if (!mounted) return;
    setState(() {
      _dioService = dio;
      _userRepo = UserRepository(dio);
      _aiRepo = AiRepository(dio);
      _mealRepo = MealRepository(dio);
      _messageRepo = MessageRepository(dio);
      _ready = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  _error ?? 'Akıllı Beslenme yükleniyor...',
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return MultiProvider(
      providers: [
        Provider<DioService>.value(value: _dioService!),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(
          create: (_) => DataProvider(_userRepo!, _aiRepo!, _mealRepo!, _messageRepo!),
        ),
      ],
      child: AkilliBeslenmeApp(dioService: _dioService!),
    );
  }
}

class AkilliBeslenmeApp extends StatelessWidget {
  final DioService dioService;

  const AkilliBeslenmeApp({super.key, required this.dioService});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Akıllı Beslenme',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.isAuthenticated) {
            return const MainNavigationScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
