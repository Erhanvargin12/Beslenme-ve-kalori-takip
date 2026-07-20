import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/professional_card.dart';
import '../widgets/shimmer_loader.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final dataProvider = context.read<DataProvider>();
      final authProvider = context.read<AuthProvider>();
      final userId = authProvider.userId ?? "web_mock_user";
      dataProvider.fetchUsers(userId);
      dataProvider.fetchMealHistory(userId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _getBadgeColor(String durum) {
    if (durum == "Normal") return Colors.green;
    if (durum == "Zayıf") return Colors.orange;
    if (durum == "Fazla Kilolu") return Colors.deepOrange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    final dataProvider = context.watch<DataProvider>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Geçmiş Veriler',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryColor,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppTheme.primaryColor,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: "Vücut Analizi", icon: Icon(Icons.accessibility_new_rounded)),
            Tab(text: "Yemek Günlüğü", icon: Icon(Icons.restaurant_menu_rounded)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildUserHistory(dataProvider),
          _buildMealHistory(dataProvider),
        ],
      ),
    );
  }

  Widget _buildUserHistory(DataProvider dataProvider) {
    final users = dataProvider.users.reversed.toList();
    if (dataProvider.isLoading && users.isEmpty) return const HistoryShimmer();
    
    return RefreshIndicator(
      onRefresh: () async {
         final userId = context.read<AuthProvider>().userId ?? "web_mock_user";
         await dataProvider.fetchUsers(userId);
      },
      child: users.isEmpty 
        ? _buildEmptyState("Henüz bir analiziniz bulunmuyor, ilk analizinizi yaparak başlayın!")
        : ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: users.length,
            itemBuilder: (context, index) {
              final user = users[index];
              return _buildUserCard(user, index);
            },
          ),
    );
  }

  Widget _buildMealHistory(DataProvider dataProvider) {
    final meals = dataProvider.mealHistory;
    if (dataProvider.isLoading && meals.isEmpty) return const HistoryShimmer();

    return RefreshIndicator(
      onRefresh: () async {
         final userId = context.read<AuthProvider>().userId ?? "web_mock_user";
         await dataProvider.fetchMealHistory(userId);
      },
      child: meals.isEmpty
        ? _buildEmptyState("Henüz bir analiziniz bulunmuyor, ilk analizinizi yaparak başlayın!")
        : ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: meals.length,
            itemBuilder: (context, index) {
              final meal = meals[index];
              return _buildMealCard(meal, index);
            },
          ),
    );
  }

  Widget _buildUserCard(dynamic user, int index) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: ProfessionalCard(
        padding: const EdgeInsets.all(20),
        child: ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Container(
            width: 50, height: 50,
            decoration: BoxDecoration(color: AppTheme.primaryColor.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Center(child: Text(user.isim[0].toUpperCase(), style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.w600))),
          ),
          title: Text(user.isim, style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
          subtitle: Text("Kilo: ${user.kilo}kg - VKI: ${user.vki}"),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: _getBadgeColor(user.durum).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: Text(user.durum, style: TextStyle(color: _getBadgeColor(user.durum), fontSize: 11, fontWeight: FontWeight.w600)),
          ),
        ),
      ).animate().fadeIn(delay: Duration(milliseconds: index * 50)).slideX(begin: 0.1, end: 0),
    );
  }

  Widget _buildMealCard(dynamic meal, int index) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: ProfessionalCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.restaurant_menu_rounded, color: Colors.orange),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(meal['foodName'] ?? "Bilinmeyen Yemek", style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text("${meal['calories']} kcal | P: ${meal['protein']}g K: ${meal['carbs']}g", style: GoogleFonts.outfit(color: Colors.grey, fontSize: 13)),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.grey),
          ],
        ),
      ).animate().fadeIn(delay: Duration(milliseconds: index * 50)).slideX(begin: 0.1, end: 0),
    );
  }

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history_rounded, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(message, style: GoogleFonts.outfit(color: Colors.grey)),
        ],
      ),
    );
  }
}

class HistoryShimmer extends StatelessWidget {
  const HistoryShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: 5,
      itemBuilder: (context, index) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: ShimmerLoader(width: double.infinity, height: 80, borderRadius: 16),
      ),
    );
  }
}
