import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../models/user_model.dart';
import '../repositories/user_repository.dart';
import '../repositories/ai_repository.dart';

class DataProvider with ChangeNotifier {
  final UserRepository _userRepo;
  final AiRepository _aiRepo;

  DataProvider(this._userRepo, this._aiRepo);

  List<UserModel> _users = [];
  bool _isLoading = false;
  String? _error;

  List<UserModel> get users => _users;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchUsers() async {
    _setLoading(true);
    try {
      _users = await _userRepo.getAllUsers();
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<String?> saveVki(String isim, int boy, int kilo) async {
    _setLoading(true);
    try {
      final result = await _userRepo.registerUser(isim, boy, kilo);
      await fetchUsers();
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

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
