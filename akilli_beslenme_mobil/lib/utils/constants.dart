import '../config/api_config.dart';

class AppConstants {
  /// Dinamik sunucu adresi — [ApiConfig] ve ayarlar ekranından yönetilir.
  static String get baseUrl => ApiConfig.baseUrl;

  // API Uç Noktaları (Endpoints)
  static const String endpointUsers = '/kullanicilar';
  static const String endpointRegister = '/kayit';
  static const String endpointAnalyze = '/analiz-et';
  static const String endpointAnalyzeDetailed = '/analiz-et-detayli';
  static const String endpointMeal = '/meal';
  static const String endpointHistory = '/history'; // userId appending will be handled in repo
  static const String endpointSummary = '/summary';
  
  // Bağlantı: kısa (ANR önleme). AI analizi ayrıca repository'de 120sn timeout kullanır.
  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration receiveTimeout = Duration(seconds: 90);
  static const Duration sendTimeout = Duration(seconds: 60);
}
