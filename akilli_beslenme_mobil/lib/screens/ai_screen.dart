import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/data_provider.dart';
import '../widgets/professional_card.dart';
import '../theme/app_theme.dart';

class AIScreen extends StatefulWidget {
  const AIScreen({super.key});

  @override
  State<AIScreen> createState() => _AIScreenState();
}

class _AIScreenState extends State<AIScreen> {
  Uint8List? _imageBytes;
  
  @override
  Widget build(BuildContext context) {
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
                '✨ AI Şef Analizi',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B),
                  fontSize: 20,
                ),
              ),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 20),
            ),
          ),
          SliverToBoxAdapter(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
              child: Column(
                children: [
                  _buildImagePicker(),
                  const SizedBox(height: 32),
                  if (_imageBytes != null) _buildActionButton(),
                  const SizedBox(height: 32),
                  _buildInfoCard(),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImagePicker() {
    return GestureDetector(
      onTap: () => _showPickerOptions(),
      child: Container(
        height: 280,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryColor.withOpacity(0.08),
              blurRadius: 40,
              offset: const Offset(0, 16),
            ),
          ],
          image: _imageBytes != null 
            ? DecorationImage(image: MemoryImage(_imageBytes!), fit: BoxFit.cover)
            : null,
          border: Border.all(color: Colors.white, width: 4),
        ),
        child: _imageBytes == null
          ? Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: AppTheme.primaryColor.withOpacity(0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.add_a_photo_outlined, size: 40, color: AppTheme.primaryColor),
                ),
                const SizedBox(height: 15),
                Text("Öğününüzün Fotoğrafını Çekin", style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                const SizedBox(height: 5),
                Text("Tek tıkla kalori analizi yapın", style: GoogleFonts.inter(color: Colors.grey, fontSize: 13)),
              ],
            )
          : Stack(
              children: [
                Positioned(
                  bottom: 15,
                  right: 15,
                  child: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: IconButton(onPressed: () => _showPickerOptions(), icon: const Icon(Icons.edit, color: AppTheme.primaryColor)),
                  ),
                ),
              ],
            ),
      ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.95, 0.95)),
    );
  }

  void _showPickerOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(25),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Fotoğraf Kaynağı", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: AppTheme.primaryColor),
              title: const Text("Kamera ile Çek"),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.camera); },
            ),
            ListTile(
              leading: const Icon(Icons.image_outlined, color: AppTheme.primaryColor),
              title: const Text("Galeriden Seç"),
              onTap: () { Navigator.pop(context); _pickImage(ImageSource.gallery); },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton() {
    return Container(
      width: double.infinity,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: AppTheme.primaryGradient,
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryColor.withOpacity(0.35),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: () => _showAnalysisResult(context),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        ),
        child: Text(
          "Yapay Zeka Analizi Başlat",
          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
        ),
      ),
    ).animate().shimmer(delay: 400.ms, duration: 1800.ms);
  }

  Widget _buildInfoCard() {
    return ProfessionalCard(
      title: "Nasıl Çalışır?",
      child: Column(
        children: [
          _buildInfoRow(Icons.camera_rounded, "Yemeğinizin fotoğrafını net bir şekilde çekin."),
          _buildInfoRow(Icons.auto_awesome_rounded, "Yapay zeka protein, yağ ve karbonhidratları tanır."),
          _buildInfoRow(Icons.bar_chart_rounded, "Kalori ve besin değerlerini anında raporlar."),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.accentColor.withOpacity(0.7), size: 24),
          const SizedBox(width: 15),
          Expanded(child: Text(text, style: const TextStyle(color: Color(0xFF475569), height: 1.4))),
        ],
      ),
    );
  }

  void _showAnalysisResult(BuildContext context) {
    if (_imageBytes == null) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AnalysisResultModal(imageBytes: _imageBytes!),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    final ImagePicker picker = ImagePicker();
    try {
      final XFile? image = await picker.pickImage(source: source, maxWidth: 800, imageQuality: 85);
      if (image != null) {
        final bytes = await image.readAsBytes();
        setState(() { _imageBytes = bytes; });
      }
    } catch (e) {
      debugPrint("Fotoğraf seçme hatası: $e");
    }
  }
}

class AnalysisResultModal extends StatefulWidget {
  final Uint8List imageBytes;
  const AnalysisResultModal({super.key, required this.imageBytes});

  @override
  State<AnalysisResultModal> createState() => _AnalysisResultModalState();
}

class _AnalysisResultModalState extends State<AnalysisResultModal> {
  String? _result;

  @override
  void initState() {
    super.initState();
    _analyze();
  }

  Future<void> _analyze() async {
    final dataProvider = context.read<DataProvider>();
    final base64Image = base64Encode(widget.imageBytes);
    
    final result = await dataProvider.analyzeFood(base64Image);
    
    if (mounted) {
      setState(() {
        _result = result;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dataProvider = context.watch<DataProvider>();
    
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
      ),
      padding: const EdgeInsets.all(32),
      child: dataProvider.isLoading || _result == null
        ? Center(child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(strokeWidth: 5, color: AppTheme.primaryColor),
              const SizedBox(height: 20),
              Text("Yapay Zeka İnceliyor...", style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(dataProvider.error ?? "Besin değerleri hesaplanıyor", style: const TextStyle(color: Colors.grey), textAlign: TextAlign.center),
            ],
          ))
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text("Analiz Raporu", style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold)),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close_rounded)),
                ],
              ),
              const SizedBox(height: 24),
              Expanded(
                child: SingleChildScrollView(
                  child: Text(
                    _result!,
                    style: const TextStyle(fontSize: 16, height: 1.6),
                  ),
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context), 
                  child: const Text("Kapat")
                ),
              ),
            ],
          ),
    );
  }
}
