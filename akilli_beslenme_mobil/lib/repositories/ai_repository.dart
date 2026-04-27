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
        'mimeType': 'image/jpeg'
      },
    );
    if (response.statusCode == 200) {
      return response.data;
    }
    throw Exception('Analiz başarısız');
  }
}
