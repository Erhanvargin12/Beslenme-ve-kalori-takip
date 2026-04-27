import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/professional_card.dart';
import '../widgets/shimmer_loader.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    // İlk açılışta verileri çek
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DataProvider>().fetchUsers();
    });
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
    final users = dataProvider.users.reversed.toList();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            backgroundColor: Colors.transparent,
            floating: true,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: false,
              title: Text(
                '💾 Kayıt Geçmişi',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B),
                  fontSize: 20,
                ),
              ),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 20),
            ),
          ),
          SliverFillRemaining(
            child: RefreshIndicator(
              onRefresh: () => dataProvider.fetchUsers(),
              child: dataProvider.isLoading && users.isEmpty
                ? const HistoryShimmer()
                : users.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.history_rounded, size: 64, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text("Henüz kayıt bulunmuyor.", style: GoogleFonts.outfit(color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                      itemCount: users.length,
                      itemBuilder: (context, index) {
                        final user = users[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: ProfessionalCard(
                            padding: const EdgeInsets.all(20),
                            child: ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  gradient: AppTheme.primaryGradient.withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    user.isim.isNotEmpty ? user.isim[0].toUpperCase() : '?', 
                                    style: const TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 22),
                                  ),
                                ),
                              ),
                              title: Text(user.isim, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 17)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 6),
                                  Text("Boy: ${user.boy}cm  Kilo: ${user.kilo}kg", style: GoogleFonts.outfit(color: Colors.blueGrey, fontSize: 14)),
                                  const SizedBox(height: 10),
                                  Row(
                                    children: [
                                      Text("VKİ: ", style: GoogleFonts.outfit(color: Colors.grey[600], fontSize: 14)),
                                      Text("${user.vki}", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.primaryColor)),
                                    ],
                                  ),
                                ],
                              ),
                              trailing: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: _getBadgeColor(user.durum).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Text(
                                  user.durum, 
                                  style: TextStyle(color: _getBadgeColor(user.durum), fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),
                            ),
                          ).animate().fadeIn(delay: Duration(milliseconds: index * 50)).slideX(begin: 0.1, end: 0, curve: Curves.easeOut),
                        );
                      },
                    ),
            ),
          ),
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
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: const ShimmerLoader(width: double.infinity, height: 100, borderRadius: 16),
      ),
    );
  }
}
