import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class AuthProvider extends ChangeNotifier {
  FirebaseAuth? _auth;
  User? _user;
  bool _isLoading = false;

  User? get user => _user;
  String? get userId => _user?.uid;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null || _isMockedWeb();

  // Web'de Firebase ayarlanmamışsa, tasarımı test edebilmek için her zaman "Giriş yapıldı" say.
  bool _isMockedWeb() {
    if (kIsWeb && _auth == null) return true;
    return false;
  }

  AuthProvider() {
    _initializeAuth();
  }

  void _initializeAuth() {
    try {
      _auth = FirebaseAuth.instance;
      _auth?.authStateChanges().listen((User? user) {
        _user = user;
        notifyListeners();
      });
    } catch (e) {
      debugPrint("Auth başlatılamadı (Web yapılandırması eksik olabilir): $e");
    }
  }

  Future<String?> register(String email, String password, String name) async {
    if (_auth == null) return "Servis şu an kullanılamıyor (Web Test Modu)";
    _isLoading = true;
    notifyListeners();
    try {
      UserCredential result = await _auth!.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      await result.user?.updateDisplayName(name);
      _isLoading = false;
      notifyListeners();
      return null;
    } on FirebaseAuthException catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.message;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.toString();
    }
  }

  Future<String?> login(String email, String password) async {
    if (_auth == null) {
      // Web simülasyonu
      _isLoading = true;
      notifyListeners();
      await Future.delayed(const Duration(seconds: 1));
      _isLoading = false;
      notifyListeners();
      return null;
    }
    
    _isLoading = true;
    notifyListeners();
    try {
      await _auth!.signInWithEmailAndPassword(email: email, password: password);
      _isLoading = false;
      notifyListeners();
      return null;
    } on FirebaseAuthException catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.message;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.toString();
    }
  }

  Future<void> logout() async {
    if (_auth != null) {
      await _auth!.signOut();
    } else {
      _user = null;
      notifyListeners();
    }
  }
}

