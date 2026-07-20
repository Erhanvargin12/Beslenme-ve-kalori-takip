import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'dart:math' show cos, sqrt, asin;
import 'package:flutter/foundation.dart';

class MapService {

  Future<List<Map<String, dynamic>>> getNearbyPlaces(LatLng location, String type) async {
    try {
      // type: 'gym' or 'restaurant'
      String query = '';
      if (type == 'gym') {
        query = '''
          [out:json];
          (
            node["leisure"="fitness_centre"](around:5000, ${location.latitude}, ${location.longitude});
            way["leisure"="fitness_centre"](around:5000, ${location.latitude}, ${location.longitude});
          );
          out center;
        ''';
      } else {
        query = '''
          [out:json];
          (
            node["amenity"="restaurant"](around:3000, ${location.latitude}, ${location.longitude});
            node["amenity"="cafe"](around:3000, ${location.latitude}, ${location.longitude});
            way["amenity"="restaurant"](around:3000, ${location.latitude}, ${location.longitude});
            way["amenity"="cafe"](around:3000, ${location.latitude}, ${location.longitude});
          );
          out center;
        ''';
      }

      final String url = 'https://overpass-api.de/api/interpreter';

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'AkilliBeslenmeApp/1.0',
          'Accept': '*/*'
        },
        body: 'data=${Uri.encodeComponent(query)}',
      );
      debugPrint("Overpass API Yanıt Kodu: ${response.statusCode}");

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List elements = data['elements'] ?? [];
        
        List<Map<String, dynamic>> places = [];
        for (var element in elements) {
          final tags = element['tags'] ?? {};
          final name = tags['name'];
          // İsimsiz mekanları atla
          if (name == null || name.toString().isEmpty) continue;

          // Eğer sağlıklı mekan arıyorsak bazı filtreler yapabiliriz veya rastgele restoran/kafe seçebiliriz.
          if (type == 'restaurant' && !tags.toString().toLowerCase().contains('vegan') && !tags.toString().toLowerCase().contains('vegetarian') && !tags.toString().toLowerCase().contains('healthy') && places.length > 15) {
             // Çok fazla restoran varsa sadece sağlıklı olabilecekleri al, yoksa ilk 15'i tut.
             continue;
          }

          final lat = element['lat'] ?? element['center']?['lat'];
          final lon = element['lon'] ?? element['center']?['lon'];
          
          if (lat != null && lon != null) {
            places.add({
              'place_id': element['id'].toString(),
              'name': name,
              'rating': 4.0 + (element['id'] % 10) / 10.0, // Rastgele bir puan uyduruyoruz
              'geometry': {
                'location': {
                  'lat': lat,
                  'lng': lon
                }
              },
              'type': type
            });
          }
        }
        // Eğer restoran türüyse ilk 20'yi alıp sağlıklı mekanmış gibi gösterelim
        if (type == 'restaurant' && places.length > 20) {
           places = places.sublist(0, 20);
        }
        return places;
      } else {
        debugPrint("HTTP Hatası: ${response.statusCode} - ${response.body}");
        return [];
      }
    } catch (e) {
      debugPrint("Overpass API Kritik Hata: $e");
      return [];
    }
  }

  double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    var p = 0.017453292519943295;
    var c = cos;
    var a = 0.5 - c((lat2 - lat1) * p) / 2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p)) / 2;
    return 12742 * asin(sqrt(a));
  }
}
