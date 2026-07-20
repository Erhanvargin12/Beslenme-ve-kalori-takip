import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../services/dio_service.dart';

class MessageRepository {
  final DioService _dioService;

  MessageRepository(this._dioService);

  Future<List<Map<String, dynamic>>> getUserMessages(String userId) async {
    try {
      final response = await _dioService.client.get(
        '/messages/$userId',
        options: Options(
          receiveTimeout: const Duration(seconds: 20),
        ),
      );

      if (response.statusCode != 200) {
        debugPrint('[Messages] HTTP ${response.statusCode}');
        return [];
      }

      final data = response.data;
      if (data is Map<String, dynamic>) {
        if (data['success'] == true && data['data'] is List) {
          return _normalizeMessages(List.from(data['data']));
        }
        if (data['data'] is List) {
          return _normalizeMessages(List.from(data['data']));
        }
      }
      if (data is List) {
        return _normalizeMessages(List.from(data));
      }

      debugPrint('[Messages] Beklenmeyen format: $data');
      return [];
    } on DioException catch (e) {
      debugPrint('[Messages] Dio: ${e.message}');
      return [];
    }
  }

  List<Map<String, dynamic>> _normalizeMessages(List<dynamic> raw) {
    return raw.map((item) {
      final map = Map<String, dynamic>.from(item as Map);
      return {
        'id': map['id']?.toString() ?? '',
        'title': map['title'] ?? 'Uzman Tavsiyesi',
        'content': map['content'] ?? map['message'] ?? '',
        'isRead': map['isRead'] ?? false,
        'createdAt': map['createdAt']?.toString() ?? '',
        'type': map['type'] ?? 'admin_message',
      };
    }).toList();
  }

  Future<void> markAsRead(String messageId) async {
    await _dioService.client.post('/messages/$messageId/read');
  }
}
