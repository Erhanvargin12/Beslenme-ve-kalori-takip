import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/data_provider.dart';
import '../widgets/professional_card.dart';
import '../theme/app_theme.dart';
import '../services/notification_service.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final _isimCtrl = TextEditingController();
  final _boyCtrl = TextEditingController();
  final _kiloCtrl = TextEditingController();

  int _totalUsageSeconds = 0;
  Timer? _usageTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadUsageData();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final authProvider = context.read<AuthProvider>();
    final dataProvider = context.read<DataProvider>();
    final userId = authProvider.userId ?? 'web_mock_user';

    try {
      await Future.wait([
        dataProvider.fetchUsers(userId),
        dataProvider.fetchMealHistory(userId),
        dataProvider.fetchDashboardStats(),
        dataProvider.fetchMessages(userId),
      ]).timeout(const Duration(seconds: 25));
    } catch (e) {
      debugPrint('[HomeScreen] Veri yükleme (sunucu kapalı olabilir): $e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopUsageTimer();
    _isimCtrl.dispose();
    _boyCtrl.dispose();
    _kiloCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startUsageTimer();
    } else if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _stopUsageTimer();
    }
  }

  void _startUsageTimer() {
    if (_usageTimer != null && _usageTimer!.isActive) return;
    _usageTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _totalUsageSeconds++;
        });
      }
      if (_totalUsageSeconds % 60 == 0) {
        _saveUsageData();
      }
    });
  }

  void _stopUsageTimer() {
    _usageTimer?.cancel();
    _saveUsageData();
  }

  Future<void> _loadUsageData() async {
    final prefs = await SharedPreferences.getInstance();
    final lastDate = prefs.getString('usage_date');
    final today = DateTime.now().toIso8601String().split('T')[0];

    if (lastDate != today) {
      _totalUsageSeconds = 0;
      await prefs.setString('usage_date', today);
      await prefs.setInt('usage_seconds', 0);
    } else {
      _totalUsageSeconds = prefs.getInt('usage_seconds') ?? 0;
    }
    
    if (mounted) {
      setState(() {});
    }
    
    // Uygulama açıksa sayacı başlat
    if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed || WidgetsBinding.instance.lifecycleState == null) {
      _startUsageTimer();
    }
  }

  Future<void> _saveUsageData() async {
    final prefs = await SharedPreferences.getInstance();
    final today = DateTime.now().toIso8601String().split('T')[0];
    await prefs.setString('usage_date', today);
    await prefs.setInt('usage_seconds', _totalUsageSeconds);
  }

  void _loadAdvice() {
    final authProvider = context.read<AuthProvider>();
    final dataProvider = context.read<DataProvider>();
    final userId = authProvider.userId ?? "web_mock_user";
    dataProvider.getPersonalizedAdvice(userId);
  }

  @override
  Widget build(BuildContext context) {
    final dataProvider = context.watch<DataProvider>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          slivers: [
            _buildSliverAppBar(),
            SliverToBoxAdapter(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSummarySection(context),
                    const SizedBox(height: 32),
                    _buildMessagesSection(dataProvider),
                    const SizedBox(height: 32),
                    _buildAiAdviceCard(dataProvider),
                    const SizedBox(height: 32),
                    _buildDailyStatsSection(dataProvider),
                    const SizedBox(height: 32),
                    Text(
                      "Verilerinizi Güncelleyin",
                      style: GoogleFonts.poppins(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF1E293B),
                      ),
                    ).animate().fadeIn(delay: 200.ms),
                    const SizedBox(height: 16),
                    _buildVkiForm(context, dataProvider),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesSection(DataProvider dataProvider) {
    final messages = dataProvider.messages;
    final unreadCount = messages.where((m) => !(m['isRead'] ?? false)).length;

    Future<void> refreshMessages() async {
      final authProvider = context.read<AuthProvider>();
      await dataProvider.fetchMessages(authProvider.userId ?? 'web_mock_user');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: const BoxDecoration(
            border: Border(left: BorderSide(color: Colors.green, width: 4)),
          ),
          child: messages.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, color: Colors.grey),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Henüz bir uzman tavsiyesi bulunmuyor.",
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.black54,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh_rounded, size: 20),
                        tooltip: 'Mesajları yenile',
                        onPressed: refreshMessages,
                      ),
                    ],
                  ),
                )
              : ExpansionTile(
                  tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: Border.all(color: Colors.transparent),
                  collapsedShape: Border.all(color: Colors.transparent),
                  leading: Badge(
                    isLabelVisible: unreadCount > 0,
                    backgroundColor: Colors.green,
                    smallSize: 10,
                    alignment: const Alignment(0.8, -0.8),
                    child: CircleAvatar(
                      backgroundColor: Colors.green.withValues(alpha: 0.1),
                      child: const Icon(
                        Icons.mark_email_unread_outlined,
                        color: Colors.green,
                      ),
                    ),
                  ),
                  title: Text(
                    'Uzman Tavsiyeleri Geçmişi',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                      fontSize: 16,
                    ),
                  ),
                  subtitle: Text(
                    '${messages.length} Adet Tavsiye',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.black54,
                    ),
                  ),
                  onExpansionChanged: (expanded) async {
                    if (expanded && unreadCount > 0) {
                      final authProvider = context.read<AuthProvider>();
                      for (var msg in messages) {
                        if (!(msg['isRead'] ?? false)) {
                          await dataProvider.markMessageAsRead(msg['id'], authProvider.userId ?? "web_mock_user");
                        }
                      }
                      if (mounted) setState(() {});
                    }
                  },
                  children: [
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: messages.length,
                      separatorBuilder: (context, index) => Divider(height: 1, color: Colors.grey[200]),
                      itemBuilder: (context, index) {
                        final msg = messages[index];
                        final isRead = msg['isRead'] ?? false;
                        
                        String dateStr = '';
                        if (msg['createdAt'] != null) {
                          try {
                            final dt = DateTime.parse(msg['createdAt']).toLocal();
                            dateStr = "${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";
                          } catch (e) {
                            dateStr = '';
                          }
                        }

                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  if (!isRead)
                                    Container(
                                      margin: const EdgeInsets.only(right: 8),
                                      width: 8, height: 8,
                                      decoration: const BoxDecoration(
                                        color: Colors.green,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  Expanded(
                                    child: Text(
                                      msg['title'] == 'Yönetici Notu' ? 'Uzman Tavsiyesi' : (msg['title'] ?? 'Uzman Tavsiyesi'),
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ),
                                  if (dateStr.isNotEmpty)
                                    Text(
                                      dateStr,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: Colors.grey[400],
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                msg['content'] ?? '',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w400,
                                  fontSize: 13, 
                                  color: Colors.black54,
                                  height: 1.5,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
        ),
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 160,
      backgroundColor: Colors.transparent,
      floating: true,
      pinned: true,
      elevation: 0,
      actions: [
        IconButton(
          onPressed: () => context.read<AuthProvider>().logout(),
          icon: const Icon(Icons.logout_rounded, color: Color(0xFF1E293B)),
        ).animate().fadeIn(delay: 500.ms),
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: IconButton(
              onPressed: () => NotificationService.showWaterReminder(),
              icon: const ShaderMask(
                shaderCallback: _primaryGradientShader,
                child: Icon(Icons.notifications_active_rounded, color: Colors.white),
              ),
            ),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: false,
        title: Text(
          "Akıllı Beslenme",
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
            fontSize: 22,
          ),
        ),
        titlePadding: const EdgeInsets.only(left: 20, bottom: 20),
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppTheme.primaryColor.withValues(alpha: 0.05),
                AppTheme.accentColor.withValues(alpha: 0.05),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                right: -50,
                top: -30,
                child: CircleAvatar(
                  radius: 100,
                  backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.03),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static Shader _primaryGradientShader(Rect bounds) => AppTheme.primaryGradient.createShader(bounds);

  Widget _buildSummarySection(BuildContext context) {
    final users = context.watch<DataProvider>().users;
    final currentUserKilo = users.isNotEmpty && users.first.kilo > 0 ? users.first.kilo : 70;
    final targetCalories = currentUserKilo * 30; // 30 kcal per kg (approx daily goal)

    final consumedCalories = (context.watch<DataProvider>().dailySummary['totalCalories'] as num?) ?? 0.0;
    final percent = consumedCalories / targetCalories;
    final safePercent = percent > 1.0 ? 1.0 : percent;

    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Stack(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Günlük Kalori Hedefi",
                      style: GoogleFonts.outfit(color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          "${consumedCalories.toInt()}",
                          style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          "/ $targetCalories kcal",
                          style: GoogleFonts.outfit(fontSize: 14, color: Colors.white.withValues(alpha: 0.7), fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildMacroProgressWhite("Protein", 0.7),
                    const SizedBox(height: 12),
                    _buildMacroProgressWhite("Karbo", 0.4),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              CircularPercentIndicator(
                radius: 54.0,
                lineWidth: 10.0,
                percent: safePercent.toDouble(),
                animation: true,
                animationDuration: 1500,
                center: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "${(safePercent * 100).toInt()}%",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white),
                    ),
                  ],
                ),
                circularStrokeCap: CircularStrokeCap.round,
                progressColor: Colors.white,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
              ),
            ],
          ),
          Positioned(
            top: 0,
            right: 0,
            child: IconButton(
              onPressed: () => _updateKiloDialog(context),
              icon: const Icon(Icons.edit_note_rounded, color: Colors.white70),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0);
  }

  void _updateKiloDialog(BuildContext context) {
    final authProvider = context.read<AuthProvider>();
    final kiloCtrl = TextEditingController();
    
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text("Kilo Güncelle", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: kiloCtrl,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: "Yeni Kilo (kg)", 
            prefixIcon: Icon(Icons.monitor_weight_outlined),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text("Vazgeç")),
          ElevatedButton(
            onPressed: () async {
              final text = kiloCtrl.text.trim();
              if (text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Lütfen bir kilo değeri girin!"), backgroundColor: Colors.red));
                return;
              }
              final kilo = int.tryParse(text);
              if (kilo == null || kilo <= 0 || kilo > 300) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Lütfen geçerli bir sayısal değer girin!"), backgroundColor: Colors.red));
                return;
              }

              final userId = authProvider.userId ?? "web_mock_user";
              
              // Kilo güncelleme ve BMR recalculate işlemi
              await context.read<DataProvider>().addBodyAnalysis(userId, kilo);
              
              if (!dialogContext.mounted) return;
              Navigator.pop(dialogContext); // Dialogu kapat

              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text("Kilonuz ve kalori hedefiniz başarıyla güncellendi!"),
                  backgroundColor: Colors.green,
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text("Güncelle"),
          ),
        ],
      ),
    );
  }

  Widget _buildMacroProgressWhite(String label, double percent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
            Text("${(percent * 100).toInt()}%", style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent,
            minHeight: 6,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            color: Colors.white,
          ),
        ),
      ],
    );
  }



  Widget _buildVkiForm(BuildContext context, DataProvider dataProvider) {
    return ProfessionalCard(
      title: "VKİ Hesaplayıcı",
      child: Column(
        children: [
          TextField(
            controller: _isimCtrl,
            decoration: const InputDecoration(labelText: "İsim Soyisim", prefixIcon: Icon(Icons.person_outline_rounded)),
            enabled: !dataProvider.isLoading,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _boyCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Boy (cm)", prefixIcon: Icon(Icons.height_rounded)),
                  enabled: !dataProvider.isLoading,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: TextField(
                  controller: _kiloCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: "Kilo (kg)", prefixIcon: Icon(Icons.monitor_weight_outlined)),
                  enabled: !dataProvider.isLoading,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: dataProvider.isLoading ? null : () => _vkiHesapla(context),
              child: dataProvider.isLoading
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                  : const Text("Analiz Et ve Kaydet"),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAiAdviceCard(DataProvider dataProvider) {
    return ProfessionalCard(
      title: "Kişiye Özel AI Beslenme Tavsiyesi",
      actions: [
        IconButton(
          onPressed: dataProvider.isAdviceLoading ? null : () => _loadAdvice(), 
          icon: Icon(
            Icons.auto_awesome_rounded, 
            size: 20, 
            color: dataProvider.isAdviceLoading ? Colors.grey : AppTheme.primaryColor
          )
        ),
      ],
      child: dataProvider.isAdviceLoading && dataProvider.aiAdvice == null
        ? const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Column(
                children: [
                  CircularProgressIndicator(strokeWidth: 3),
                  SizedBox(height: 12),
                  Text("Tavsiye oluşturuluyor...", style: TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
            ),
          )
        : Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.1), 
                  shape: BoxShape.circle
                ),
                child: const Icon(Icons.psychology_outlined, color: AppTheme.primaryColor),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: dataProvider.isAdviceLoading
                  ? const Text("Yeni tavsiye hazırlanıyor...", style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic))
                  : Text(
                      dataProvider.aiAdvice ?? (dataProvider.error != null && dataProvider.error!.isNotEmpty
                          ? dataProvider.error!
                          : "Analiz için verilerinizi güncelleyin ve yıldız butonuna basın."),
                      style: const TextStyle(height: 1.5, color: Color(0xFF475569)),
                    ),
              ),
            ],
          ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.1, end: 0);
  }

  Widget _buildDailyStatsSection(DataProvider dataProvider) {
    final stats = dataProvider.dashboardStats;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Günlük Kullanım Paneli",
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1E293B),
          ),
        ).animate().fadeIn(delay: 250.ms),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatBox(
                "Analiz Edilen",
                "${stats['dailyPhotoCount']}",
                "Fotoğraf",
                Icons.camera_alt_rounded,
                AppTheme.accentColor,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatBox(
                "Uygulama",
                "${_totalUsageSeconds ~/ 60} dk",
                "Kullanımı",
                Icons.timer_rounded,
                Colors.blue,
              ),
            ),
          ],
        ).animate().slideY(begin: 0.1, end: 0, delay: 300.ms).fadeIn(),
      ],
    );
  }

  Widget _buildStatBox(String title, String value, String sub, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: color.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 8)),
        ],
        border: Border.all(color: color.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.grey)),
          const SizedBox(height: 2),
          Text(sub, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[400])),
        ],
      ),
    );
  }

  Future<void> _vkiHesapla(BuildContext context) async {
    final dataProvider = context.read<DataProvider>();

    if (_isimCtrl.text.isEmpty || _boyCtrl.text.isEmpty || _kiloCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Lütfen tüm alanları doldurun.")));
      return;
    }

    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.userId ?? "web_mock_user";

    final message = await dataProvider.saveVki(
      _isimCtrl.text,
      int.tryParse(_boyCtrl.text) ?? 0,
      int.tryParse(_kiloCtrl.text) ?? 0,
      userId,
    );

    if (message != null) {
      if (!context.mounted) return;
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text("Başarılı"),
          content: Text(message),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text("Tamam"))],
        ),
      );
      NotificationService.showNotification(
          title: 'Verileriniz Kaydedildi',
          body: 'Yeni VKİ analiziniz başarıyla buluta yüklendi.',
        );
      _isimCtrl.clear();
      _boyCtrl.clear();
      _kiloCtrl.clear();
    } else if (dataProvider.error != null) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(dataProvider.error!), backgroundColor: Colors.red),
      );
    }
  }
}
