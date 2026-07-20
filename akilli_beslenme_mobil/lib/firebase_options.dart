import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
///
/// Example:
/// ```dart
/// import 'firebase_options.dart';
/// // ...
/// await Firebase.initializeApp(
///   options: DefaultFirebaseOptions.currentPlatform,
/// );
/// ```
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyB7FaFLlvhuu2v2RVPnNiBQ0fKBDS1YbXs',
    appId: '1:317134399775:web:a762248d20663eaccd282a',
    messagingSenderId: '317134399775',
    projectId: 'akilli-beslenme-asistani',
    authDomain: 'akilli-beslenme-asistani.firebaseapp.com',
    storageBucket: 'akilli-beslenme-asistani.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyB7FaFLlvhuu2v2RVPnNiBQ0fKBDS1YbXs',
    appId: '1:317134399775:android:6e42b2611e42a0e7cd282a', // Örnek Android ID (Projeden kontrol edilmeli)
    messagingSenderId: '317134399775',
    projectId: 'akilli-beslenme-asistani',
    storageBucket: 'akilli-beslenme-asistani.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyB7FaFLlvhuu2v2RVPnNiBQ0fKBDS1YbXs',
    appId: '1:317134399775:ios:b9e2c2611e42a0e7cd282a', // Örnek iOS ID (Projeden kontrol edilmeli)
    messagingSenderId: '317134399775',
    projectId: 'akilli-beslenme-asistani',
    storageBucket: 'akilli-beslenme-asistani.firebasestorage.app',
    iosBundleId: 'com.example.akilliBeslenmeMobil',
  );
}
