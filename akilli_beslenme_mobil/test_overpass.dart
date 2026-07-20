import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  String type = 'gym';
  double lat = 41.0082;
  double lng = 28.9784;

  String query = '''
    [out:json];
    (
      node["leisure"="fitness_centre"](around:5000, $lat, $lng);
      way["leisure"="fitness_centre"](around:5000, $lat, $lng);
    );
    out center;
  ''';

  final String url = 'https://overpass-api.de/api/interpreter';

  try {
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'AkilliBeslenmeApp/1.0',
        'Accept': '*/*'
      },
      body: 'data=${Uri.encodeComponent(query)}',
    );
    
    print("Status: ${response.statusCode}");
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List elements = data['elements'] ?? [];
      print("Elements count: ${elements.length}");
    } else {
      print("Body: ${response.body}");
    }
  } catch(e) {
    print("Error: $e");
  }
}
