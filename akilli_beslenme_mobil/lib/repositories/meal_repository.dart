import '../services/dio_service.dart';
import '../utils/constants.dart';

class MealRepository {
  final DioService _dioService;

  MealRepository(this._dioService);

  Future<void> saveMeal({
    required String userId,
    required String foodName,
    required double calories,
    required double protein,
    required double carbs,
    required double fat,
    String? imageUrl,
  }) async {
    final response = await _dioService.client.post(
      AppConstants.endpointMeal,
      data: {
        'userId': userId,
        'foodName': foodName,
        'calories': calories,
        'protein': protein,
        'carbs': carbs,
        'fat': fat,
        'imageUrl': imageUrl,
      },
    );
    
    if (response.statusCode != 201) {
      throw Exception('Yemek kaydedilemedi');
    }
  }

  Future<List<dynamic>> getMealHistory(String userId) async {
    final response = await _dioService.client.get('${AppConstants.endpointHistory}/$userId');
    if (response.statusCode == 200) {
      return response.data;
    }
    throw Exception('Geçmiş veriler alınamadı');
  }

  Future<Map<String, dynamic>> getDailySummary(String userId) async {
    final response = await _dioService.client.get('${AppConstants.endpointSummary}/$userId');
    if (response.statusCode == 200) {
      return response.data;
    }
    throw Exception('Günlük özet alınamadı');
  }
}
