import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/api_config.dart';
import '../services/dio_service.dart';
import '../theme/app_theme.dart';

class ServerSettingsSheet extends StatefulWidget {
  final DioService dioService;
  final VoidCallback? onSaved;

  const ServerSettingsSheet({
    super.key,
    required this.dioService,
    this.onSaved,
  });

  static Future<bool?> show(BuildContext context, DioService dioService) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      isDismissible: true,
      enableDrag: true,
      builder: (ctx) => ServerSettingsSheet(dioService: dioService),
    );
  }

  @override
  State<ServerSettingsSheet> createState() => _ServerSettingsSheetState();
}

class _ServerSettingsSheetState extends State<ServerSettingsSheet> {
  late final TextEditingController _controller;
  bool _saving = false;
  String? _testResult;

  @override
  void initState() {
    super.initState();
    String initial = '${ApiConfig.suggestedWifiIp}:${ApiConfig.defaultPort}';
    try {
      final current = ApiConfig.baseUrl;
      final host = Uri.parse(current).host;
      if (!ApiConfig.isLikelyVirtualAdapter(host) &&
          host != '127.0.0.1' &&
          host != 'localhost') {
        initial = '$host:${ApiConfig.defaultPort}';
      }
    } catch (_) {}
    _controller = TextEditingController(text: initial);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _saveAndTest() async {
    setState(() {
      _saving = true;
      _testResult = null;
    });
    try {
      final url = await ApiConfig.saveBaseUrl(_controller.text);
      widget.dioService.updateBaseUrl(url);
      final ok = await widget.dioService.ping();
      if (!mounted) return;
      setState(() {
        _testResult = ok
            ? '✓ Bağlantı başarılı: $url'
            : 'Adres kaydedildi ama sunucu yanıt vermedi.\n'
                'PC\'de `npm run dev` çalışıyor mu? Güvenlik duvarı 3000 portuna izin veriyor mu?';
      });
      if (ok) {
        widget.onSaved?.call();
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _testResult = e.toString().replaceFirst('ArgumentError: ', '').replaceFirst('Exception: ', '');
        });
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _useSuggestedIp() async {
    _controller.text = ApiConfig.baseUrlHint();
    await _saveAndTest();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottom),
      child: Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Sunucu Bağlantısı',
                      style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context, false),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.amber.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.amber.shade800, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          '172.29.x.x kullanmayın',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber.shade900,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Bu adres Hyper-V/WSL sanal ağıdır; telefon erişemez.\n'
                      'ipconfig → **Wi-Fi** satırı: ${ApiConfig.suggestedWifiIp}',
                      style: TextStyle(fontSize: 12, color: Colors.amber.shade900, height: 1.35),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _controller,
                keyboardType: TextInputType.url,
                decoration: InputDecoration(
                  labelText: 'Wi-Fi IPv4 + port',
                  hintText: ApiConfig.baseUrlHint(),
                  prefixIcon: const Icon(Icons.wifi),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _saving ? null : _useSuggestedIp,
                icon: const Icon(Icons.wifi_tethering),
                label: Text('Önerilen Wi-Fi IP: ${ApiConfig.suggestedWifiIp}'),
              ),
              if (_testResult != null) ...[
                const SizedBox(height: 12),
                Text(
                  _testResult!,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.35,
                    color: _testResult!.startsWith('✓')
                        ? Colors.green.shade700
                        : Colors.red.shade700,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saving ? null : _saveAndTest,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _saving
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Kaydet ve Bağlantıyı Test Et'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
