import 'package:flutter/foundation.dart';

class AppConstants {
  // Web için localhost, Android emülatör için 10.0.2.2, Fiziksel cihaz için PC IP'si
  static const String baseUrl = kIsWeb 
      ? 'http://localhost:3000' 
      : 'http://10.0.2.2:3000'; // FIXME: Fiziksel cihazda PC IP'sini buraya yazın.

  // API Uç Noktaları (Endpoints)
  static const String endpointUsers = '/kullanicilar';
  static const String endpointRegister = '/kayit';
  static const String endpointAnalyze = '/analiz-et';
  
  // Timeout Süreleri
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
