import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'ai_screen.dart';
import 'history_screen.dart';
import 'map_screen.dart';
import '../theme/app_theme.dart';
import '../services/session_tracker.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  late SessionTracker _sessionTracker;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _sessionTracker = SessionTracker(userId: auth.userId);
    _sessionTracker.startSession();
  }

  @override
  void dispose() {
    _sessionTracker.stopSession();
    super.dispose();
  }

  Widget _screenAt(int index) {
    switch (index) {
      case 0:
        return const HomeScreen();
      case 1:
        return const AIScreen();
      case 2:
        return const MapScreen();
      case 3:
        return const HistoryScreen();
      default:
        return const HomeScreen();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screenAt(_currentIndex),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black12,
              blurRadius: 10,
              offset: Offset(0, -1),
            ),
          ],
        ),
        child: NavigationBar(
          height: 70,
          elevation: 0,
          backgroundColor: Colors.white,
          selectedIndex: _currentIndex,
          onDestinationSelected: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          indicatorColor: AppTheme.primaryColor.withValues(alpha: 0.12),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.home_rounded, color: AppTheme.primaryColor),
              label: 'Ana Sayfa',
            ),
            NavigationDestination(
              icon: Icon(Icons.document_scanner_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.document_scanner_rounded, color: AppTheme.primaryColor),
              label: 'AI Analiz',
            ),
            NavigationDestination(
              icon: Icon(Icons.location_on_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.location_on_rounded, color: AppTheme.primaryColor),
              label: 'Mekanlar',
            ),
            NavigationDestination(
              icon: Icon(Icons.bar_chart_outlined, color: Color(0xFF64748B)),
              selectedIcon: Icon(Icons.bar_chart_rounded, color: AppTheme.primaryColor),
              label: 'Geçmiş',
            ),
          ],
        ),
      ),
    );
  }
}
