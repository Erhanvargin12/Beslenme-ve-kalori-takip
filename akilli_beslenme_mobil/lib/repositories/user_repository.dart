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

  Future<String> registerUser(String isim, int boy, int kilo) async {
    final response = await _dioService.client.post(
      AppConstants.endpointRegister,
      data: {'isim': isim, 'boy': boy, 'kilo': kilo},
    );
    if (response.statusCode == 200) {
      return response.data;
    }
    throw Exception('Kayıt başarısız');
  }
}
