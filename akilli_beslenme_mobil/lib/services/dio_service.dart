import 'package:dio/dio.dart';
import '../utils/constants.dart';
import 'dart:developer';

class DioService {
  late Dio _dio;

  DioService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.baseUrl,
        connectTimeout: AppConstants.connectTimeout,
        receiveTimeout: AppConstants.receiveTimeout,
        contentType: 'application/json',
      ),
    );

    // --- INTERCEPTOR EKLEME ---
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          log('--- İSTEK GÖNDERİLİYOR ---');
          log('URL: ${options.uri}');
          log('DATA: ${options.data}');
          // İstek gönderilmeden önce yapılacak işlemler (örn: Loading başlatma feyki)
          return handler.next(options);
        },
        onResponse: (response, handler) {
          log('--- YANIT GELDİ ---');
          log('STATUS: ${response.statusCode}');
          log('DATA: ${response.data}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          log('--- HATA OLUŞTU ---');
          log('MESAJ: ${e.message}');
          log('HATA TİPİ: ${e.type}');
          
          String genericMessage = 'Bir sorun oluştu. Lütfen tekrar deneyin.';
          
          if (e.type == DioExceptionType.connectionTimeout) {
            genericMessage = 'Sunucuya bağlanılamadı. İnternetinizi kontrol edin.';
          } else if (e.type == DioExceptionType.receiveTimeout) {
            genericMessage = 'Sunucudan yanıt alınamadı.';
          } else if (e.type == DioExceptionType.badResponse) {
            genericMessage = 'Sunucu hatası: ${e.response?.statusCode}';
          }

          // Hatayı özelleştirip fırlatabiliriz
          return handler.next(
            DioException(
              requestOptions: e.requestOptions,
              error: genericMessage,
              type: e.type,
            ),
          );
        },
      ),
    );
  }

  Dio get client => _dio;
}
