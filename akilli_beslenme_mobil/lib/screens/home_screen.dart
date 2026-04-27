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

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _isimCtrl = TextEditingController();
  final _boyCtrl = TextEditingController();
  final _kiloCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final dataProvider = context.watch<DataProvider>();

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      body: CustomScrollView(
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
                  Text(
                    "📊 Verilerinizi Güncelleyin",
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E293B),
                    ),
                  ).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 16),
                  _buildVkiForm(context, dataProvider),
                  const SizedBox(height: 32),
                  _buildQuickTips(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
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
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
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
                AppTheme.primaryColor.withOpacity(0.05),
                AppTheme.accentColor.withOpacity(0.05),
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
                  backgroundColor: AppTheme.primaryColor.withOpacity(0.03),
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
    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.primaryGradient,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Günlük Kalori Hedefi",
                  style: GoogleFonts.outfit(color: Colors.white.withOpacity(0.8), fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      "1,450",
                      style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      "/ 2,100 kcal",
                      style: GoogleFonts.outfit(fontSize: 14, color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w500),
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
            percent: 1450 / 2100,
            animation: true,
            animationDuration: 1500,
            center: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  "%70",
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: Colors.white),
                ),
                Text(
                  "Kaldı",
                  style: GoogleFonts.outfit(fontSize: 10, color: Colors.white70),
                ),
              ],
            ),
            circularStrokeCap: CircularStrokeCap.round,
            progressColor: Colors.white,
            backgroundColor: Colors.white.withOpacity(0.2),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0);
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
            backgroundColor: Colors.white.withOpacity(0.2),
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildMacroProgress(String label, double percent, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.blueGrey)),
            Text("${(percent * 100).toInt()}%", style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percent,
            minHeight: 6,
            backgroundColor: color.withOpacity(0.1),
            color: color,
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

  Widget _buildQuickTips() {
    return ProfessionalCard(
      title: "Günün Önerisi",
      actions: [
        IconButton(onPressed: () {}, icon: const Icon(Icons.refresh_rounded, size: 20, color: AppTheme.primaryColor)),
      ],
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(Icons.local_fire_department_rounded, color: Colors.green),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Text(
              "Öğle yemeğinde yüksek lifli gıdalar tercih ederek akşama kadar tokluk hissinizi artırabilirsiniz.",
              style: TextStyle(height: 1.5, color: Color(0xFF475569)),
            ),
          ),
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

    final message = await dataProvider.saveVki(
      _isimCtrl.text,
      int.tryParse(_boyCtrl.text) ?? 0,
      int.tryParse(_kiloCtrl.text) ?? 0,
    );

    if (message != null) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text("Başarılı"),
            content: Text(message),
            actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text("Tamam"))],
          ),
        );
        NotificationService.showNotification(
          title: '✅ Verileriniz Kaydedildi',
          body: 'Yeni VKİ analiziniz başarıyla buluta yüklendi.',
        );
        _isimCtrl.clear();
        _boyCtrl.clear();
        _kiloCtrl.clear();
      }
    } else if (dataProvider.error != null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(dataProvider.error!), backgroundColor: Colors.red),
        );
      }
    }
  }
}
