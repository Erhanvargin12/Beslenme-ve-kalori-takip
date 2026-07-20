import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../services/dio_service.dart';
import '../utils/constants.dart';

class AiRepository {
  final DioService _dioService;

  AiRepository(this._dioService);

  Future<String> analyzeFood(String base64Image) async {
    final response = await _dioService.client.post(
      AppConstants.endpointAnalyze,
      data: {
        'gorselBase64': base64Image,
        'mimeType': 'image/jpeg',
      },
    );
    if (response.statusCode == 200) {
      return response.data.toString();
    }
    throw Exception('Analiz başarısız');
  }

  Future<Map<String, dynamic>> analyzeFoodDetailed(
    String base64Image, {
    String? imagePath,
  }) async {
    try {
      debugPrint('Analiz için gönderilen dosya yolu: ${imagePath ?? 'Bilinmiyor'}');
      final response = await _dioService.client
          .post(
            AppConstants.endpointAnalyzeDetailed,
            data: {
              'gorselBase64': base64Image,
              'mimeType': 'image/jpeg',
            },
          )
          .timeout(const Duration(seconds: 120));

      debugPrint('AI Servis Yanıtı: ${response.data}');

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;

        if (data is Map<String, dynamic>) {
          if (data.containsKey('error')) {
            throw Exception(data['error']);
          }
          if (!data.containsKey('yemek_adi') && !data.containsKey('tahmini_kalori')) {
            throw Exception('API yanıtı beklenen formatta değil.');
          }
          return data;
        }
        throw Exception('API geçersiz bir veri formatı döndürdü (Map bekleniyordu).');
      }
      throw Exception('Detaylı analiz başarısız. Durum kodu: ${response.statusCode}');
    } on DioException catch (e) {
      debugPrint('AiRepository Dio Hatası: ${e.type}');
      debugPrint('Durum Kodu: ${e.response?.statusCode}');
      debugPrint('Hata Verisi: ${e.response?.data}');
      rethrow;
    }
  }

  /// Backend düz metin döndürür — ResponseType.plain zorunlu (JSON parse hatası önlenir).
  Future<String> getPersonalizedAdvice(Map<String, dynamic> data) async {
    try {
      final response = await _dioService.client.post(
        '/tavsiye-al',
        data: data,
        options: Options(
          responseType: ResponseType.plain,
          receiveTimeout: const Duration(seconds: 90),
          headers: {'Accept': 'text/plain, application/json'},
        ),
      );

      if (response.statusCode == 200) {
        final text = response.data?.toString().trim() ?? '';
        if (text.isEmpty) {
          throw Exception('Boş tavsiye yanıtı');
        }
        return text;
      }

      final errBody = response.data?.toString() ?? '';
      throw Exception(errBody.isNotEmpty ? errBody : 'HTTP ${response.statusCode}');
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map && data['advice'] != null) {
        return data['advice'].toString();
      }
      if (data is String && data.trim().isNotEmpty) {
        try {
          final decoded = jsonDecode(data);
          if (decoded is Map) {
            if (decoded['advice'] != null) {
              return decoded['advice'].toString();
            } else if (decoded['error'] != null) {
              throw Exception(decoded['error'].toString());
            }
          }
        } catch (_) {}
        throw Exception(data);
      }
      rethrow;
    }
  }
}
