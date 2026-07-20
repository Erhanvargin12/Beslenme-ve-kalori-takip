import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../repositories/user_repository.dart';
import '../repositories/ai_repository.dart';
import '../repositories/meal_repository.dart';
import '../repositories/message_repository.dart';

class DataProvider with ChangeNotifier {
  final UserRepository _userRepo;
  final AiRepository _aiRepo;
  final MealRepository _mealRepo;
  final MessageRepository _messageRepo;

  DataProvider(this._userRepo, this._aiRepo, this._mealRepo, this._messageRepo);

  List<UserModel> _users = [];
  List<dynamic> _mealHistory = [];
  Map<String, dynamic> _dailySummary = {'totalCalories': 0, 'count': 0};
  bool _isLoading = false;
  bool _isAdviceLoading = false;
  String? _error;
  String? _aiAdvice;
  List<Map<String, dynamic>> _messages = [];
  Map<String, dynamic> _dashboardStats = {
    'dailyPhotoCount': 0,
    'activeUserRate': '0 dk',
    'weeklyCalories': []
  };

  List<UserModel> get users => _users;
  List<dynamic> get mealHistory => _mealHistory;
  Map<String, dynamic> get dailySummary => _dailySummary;
  bool get isLoading => _isLoading;
  bool get isAdviceLoading => _isAdviceLoading;
  String? get error => _error;
  String? get aiAdvice => _aiAdvice;
  List<Map<String, dynamic>> get messages => _messages;
  Map<String, dynamic> get dashboardStats => _dashboardStats;

  Future<void> fetchDashboardStats() async {
    try {
      final response = await _userRepo.getDashboardStats();
      _dashboardStats = response;
      notifyListeners();
    } catch (e) {
      debugPrint("Dashboard stats error: $e");
    }
  }

  Future<void> fetchUsers(String userId) async {
    _setLoading(true);
    try {
      _users = await _userRepo.getUserHistory(userId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<UserModel> _resolveLatestProfile(String authId) async {
    if (_users.isEmpty) {
      _users = await _userRepo.getUserHistory(authId);
    }
    if (_users.isNotEmpty) {
      return _users.first;
    }
    return UserModel(
      id: authId,
      authId: authId,
      isim: 'Kullanıcı',
      boy: 175,
      kilo: 70,
      vki: 22.8,
      durum: 'Normal',
    );
  }

  Future<void> getPersonalizedAdvice(String authId) async {
    _isAdviceLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _resolveLatestProfile(authId);

      Map<String, dynamic> summary = Map<String, dynamic>.from(_dailySummary);
      if (summary.isEmpty || !summary.containsKey('totalCalories')) {
        summary = await _mealRepo.getDailySummary(authId);
        _dailySummary = summary;
      }

      final payload = {
        'profile': user.toJson(),
        'dailySummary': {
          'totalCalories': summary['totalCalories'] ?? 0,
          'protein': summary['protein'] ?? 0,
          'carbs': summary['carbs'] ?? 0,
          'fat': summary['fat'] ?? 0,
          'count': summary['count'] ?? 0,
        },
      };

      _aiAdvice = await _aiRepo.getPersonalizedAdvice(payload);
    } catch (e) {
      debugPrint('getPersonalizedAdvice: $e');
      if (e is DioException) {
        if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
          _error = 'Sunucu yanıt vermedi. Lütfen tekrar deneyin.';
        } else if (e.type == DioExceptionType.connectionError) {
          _error = 'Sunucuya bağlanılamadı. IP adresinizi kontrol edin.';
        } else {
          _error = e.message ?? 'Bir bağlantı hatası oluştu.';
        }
      } else {
        _error = e.toString().replaceFirst('Exception: ', '');
      }
      _aiAdvice = null;
    } finally {
      _isAdviceLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMealHistory(String userId) async {
    _setLoading(true);
    try {
      _mealHistory = await _mealRepo.getMealHistory(userId);
      _dailySummary = await _mealRepo.getDailySummary(userId);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateUserInfo(String userId, {int? boy, int? kilo}) async {
    _setLoading(true);
    try {
      await _userRepo.updateUserInfo(userId, boy: boy, kilo: kilo);
      await fetchUsers(userId); // Refresh users list
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> addBodyAnalysis(String userId, int newKilo) async {
    _setLoading(true);
    try {
      await _userRepo.addBodyAnalysis(userId, newKilo);
      await fetchUsers(userId); // Refresh users list
      await fetchDashboardStats(); // Refresh stats for new BMR if needed
    } catch (e) {
      _error = e.toString();
      debugPrint("Add Body Analysis error: $e");
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logMeal({
    required String userId,
    required String foodName,
    required double calories,
    required double protein,
    required double carbs,
    required double fat,
    String? imageUrl,
  }) async {
    _setLoading(true);
    try {
      await _mealRepo.saveMeal(
        userId: userId,
        foodName: foodName,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        imageUrl: imageUrl,
      );
      await fetchMealHistory(userId); // Refresh data
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<String?> saveVki(String isim, int boy, int kilo, String userId) async {
    _setLoading(true);
    try {
      final result = await _userRepo.registerUser(isim, boy, kilo, authId: userId);
      await fetchUsers(userId);
      return result;
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  Future<String?> analyzeFood(String base64Image) async {
    _setLoading(true);
    _error = null;
    try {
      return await _aiRepo.analyzeFood(base64Image);
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  Future<Map<String, dynamic>?> analyzeFoodDetailed(String base64Image, {String? imagePath}) async {
    try {
      return await _aiRepo.analyzeFoodDetailed(base64Image, imagePath: imagePath);
    } catch (e) {
      throw Exception(e.toString());
    }
  }

  Future<void> fetchMessages(String authId) async {
    try {
      _messages = await _messageRepo.getUserMessages(authId);
    } catch (e) {
      debugPrint('Mesajları çekerken hata: $e');
      _messages = [];
    }
    notifyListeners();
  }
  
  Future<void> markMessageAsRead(String messageId, String userId) async {
    try {
      await _messageRepo.markAsRead(messageId);
      await fetchMessages(userId);
    } catch (e) {
      debugPrint("Mesajı okundu işaretlerken hata: $e");
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
