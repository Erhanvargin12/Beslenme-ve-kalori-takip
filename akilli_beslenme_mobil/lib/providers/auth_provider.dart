import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _user;
  bool _isLoading = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    // Uygulama açıldığında oturum durumunu dinle
    _auth.authStateChanges().listen((User? user) {
      _user = user;
      notifyListeners();
    });
  }

  // Kayıt Ol
  Future<String?> register(String email, String password, String name) async {
    _isLoading = true;
    notifyListeners();
    try {
      UserCredential result = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      await result.user?.updateDisplayName(name);
      _isLoading = false;
      notifyListeners();
      return null; // Başarılı
    } on FirebaseAuthException catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.message; // Hata mesajı
    }
  }

  // Giriş Yap
  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      _isLoading = false;
      notifyListeners();
      return null; // Başarılı
    } on FirebaseAuthException catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.message;
    }
  }

  // Çıkış Yap
  Future<void> logout() async {
    await _auth.signOut();
  }
}
