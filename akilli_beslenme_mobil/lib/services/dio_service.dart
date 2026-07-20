import 'package:dio/dio.dart';
import 'dart:developer';

import '../config/api_config.dart';
import '../utils/constants.dart';

class DioService {
  late Dio _dio;

  DioService() {
    _dio = _buildDio(ApiConfig.baseUrl);
  }

  Dio _buildDio(String baseUrl) {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: AppConstants.connectTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        sendTimeout: AppConstants.sendTimeout,
        contentType: 'application/json',
        headers: {'Accept': 'application/json'},
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          log('--- İSTEK --- ${options.method} ${options.uri}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          log('--- YANIT --- ${response.statusCode}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          log('--- DIO HATA --- ${e.type} ${e.message}');

          final friendly = _mapDioError(e);
          return handler.next(
            DioException(
              requestOptions: e.requestOptions,
              response: e.response,
              error: friendly,
              message: friendly,
              type: e.type,
            ),
          );
        },
      ),
    );

    return dio;
  }

  String _mapDioError(DioException e) {
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.unknown && e.error.toString().contains('SocketException')) {
      return ApiConfig.connectionHelpMessage();
    }
    if (e.type == DioExceptionType.connectionTimeout) {
      return 'Sunucuya bağlanılamadı (zaman aşımı). IP adresini ve Wi‑Fi bağlantısını kontrol edin.';
    }
    if (e.type == DioExceptionType.receiveTimeout || e.type == DioExceptionType.sendTimeout) {
      return 'Sunucu yanıt vermedi. Analiz uzun sürebilir; tekrar deneyin.';
    }
    if (e.type == DioExceptionType.badResponse) {
      final data = e.response?.data;
      if (data is Map && data['error'] != null) {
        return data['error'].toString();
      }
      return 'Sunucu hatası: HTTP ${e.response?.statusCode}';
    }
    return e.message ?? 'Bir sorun oluştu. Lütfen tekrar deneyin.';
  }

  void updateBaseUrl(String baseUrl) {
    _dio.options.baseUrl = baseUrl;
    log('[DioService] baseUrl güncellendi: $baseUrl');
  }

  /// Backend erişim testi
  Future<bool> ping() async {
    try {
      final response = await _dio.get(
        '/system/status',
        options: Options(
          receiveTimeout: const Duration(seconds: 8),
          sendTimeout: const Duration(seconds: 8),
        ),
      );
      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Dio get client => _dio;
}
