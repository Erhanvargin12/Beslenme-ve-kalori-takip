import '../models/user_model.dart';
import '../services/dio_service.dart';
import '../utils/constants.dart';

class UserRepository {
  final DioService _dioService;

  UserRepository(this._dioService);

  Future<List<UserModel>> getAllUsers() async {
    final response = await _dioService.client.get(AppConstants.endpointUsers);
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data;
      return data.map((json) => UserModel.fromJson(json)).toList();
    }
    throw Exception('Kullanıcılar yüklenemedi');
  }

  Future<List<UserModel>> getUserHistory(String authId) async {
    final response = await _dioService.client.get('${AppConstants.endpointUsers}/history/$authId');
    if (response.statusCode == 200) {
      final List<dynamic> data = response.data;
      return data.map((json) => UserModel.fromJson(json)).toList();
    }
    throw Exception('Kullanıcı geçmişi yüklenemedi');
  }

  Future<String> registerUser(String isim, int boy, int kilo, {String? authId}) async {
    final response = await _dioService.client.post(
      AppConstants.endpointRegister,
      data: {'isim': isim, 'boy': boy, 'kilo': kilo, 'authId': authId},
    );
    if (response.statusCode == 200) {
      return response.data;
    }
    throw Exception('Kayıt başarısız');
  }

  Future<void> updateUserInfo(String userId, {int? boy, int? kilo}) async {
    final response = await _dioService.client.post(
      '${AppConstants.endpointUsers}/update/$userId',
      data: {
        'boy': boy,
        'kilo': kilo,
      },
    );
    if (response.statusCode != 200) {
      throw Exception('Güncelleme başarısız');
    }
  }

  Future<void> addBodyAnalysis(String authId, int kilo) async {
    final response = await _dioService.client.post(
      '/user/body-analysis',
      data: {
        'authId': authId,
        'kilo': kilo,
      },
    );
    if (response.statusCode != 200) {
      throw Exception('Vücut analizi güncellenemedi');
    }
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    final response = await _dioService.client.get('/dashboard/stats');
    if (response.statusCode == 200) {
      return response.data;
    }
    throw Exception('Dashboard verileri alınamadı');
  }
}
