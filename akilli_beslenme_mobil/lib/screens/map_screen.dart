import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';
import '../services/map_service.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  final Set<Marker> _markers = {};
  bool _isLoading = true;
  final MapService _mapService = MapService();
  Map<String, dynamic>? _selectedPlace;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      _checkLocationPermission();
    }
  }

  Future<void> _checkLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _showErrorDialog(
        "GPS Kapalı", 
        "Konum servisleri kapalı görünüyor. Mekanları bulabilmemiz için lütfen ayarlardan GPS'i açın.",
        true
      );
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _showErrorDialog(
          "İzin Gerekli", 
          "Uygulamayı tam işlevsel kullanabilmek için konum izni vermeniz gerekmektedir.",
          false
        );
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _showErrorDialog(
        "İzin Kalıcı Olarak Reddedildi", 
        "Konum izni kalıcı olarak reddedildi. Lütfen uygulama ayarlarından izni manuel olarak verin.",
        true
      );
      return;
    }

    _getCurrentLocation();
  }

  void _showErrorDialog(String title, String message, bool openSettings) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Kapat"),
          ),
          if (openSettings)
            ElevatedButton(
              onPressed: () {
                Geolocator.openAppSettings();
                Navigator.pop(context);
              },
              child: const Text("Ayarlara Git"),
            ),
        ],
      ),
    );
  }

  Future<void> _getCurrentLocation() async {
    try {
      setState(() => _isLoading = true);
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high)
      );
      
      setState(() {
        _currentPosition = position;
        _isLoading = false;
        _markers.add(
          Marker(
            markerId: const MarkerId('current_location'),
            position: LatLng(position.latitude, position.longitude),
            infoWindow: const InfoWindow(title: 'Buradasınız'),
            icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          ),
        );
      });

      _mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(position.latitude, position.longitude),
          15,
        ),
      );
      
      await _fetchNearbyPlaces();
    } catch (e) {
      debugPrint("KONUM ALMA HATASI: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Konum alınamadı: $e"), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _fetchNearbyPlaces() async {
    if (_currentPosition == null) return;

    try {
      final LatLng loc = LatLng(_currentPosition!.latitude, _currentPosition!.longitude);
      debugPrint("Mekanlar aranıyor: ${loc.latitude}, ${loc.longitude}");
      
      // Gyms (Spor Salonları)
      final gyms = await _mapService.getNearbyPlaces(loc, 'gym');
      debugPrint("Bulunan Spor Salonu Sayısı: ${gyms.length}");
      _addMarkers(gyms, BitmapDescriptor.hueBlue, 'gym');

      // Healthy Restaurants / Vegan Cafes (Sağlıklı Restoranlar)
      final restaurants = await _mapService.getNearbyPlaces(loc, 'restaurant');
      debugPrint("Bulunan Restoran Sayısı: ${restaurants.length}");
      _addMarkers(restaurants, BitmapDescriptor.hueGreen, 'restaurant');

      if (gyms.isEmpty && restaurants.isEmpty) {
        debugPrint("Etrafta mekan bulunamadı.");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Yakınınızda mekan bulunamadı."), duration: Duration(seconds: 2)),
          );
        }
      }
    } catch (e) {
      debugPrint("MEKAN YÜKLEME HATASI: $e");
    }
  }

  void _addMarkers(List<Map<String, dynamic>> places, double hue, String type) {
    setState(() {
      for (var place in places) {
        final lat = place['geometry']?['location']?['lat'];
        final lng = place['geometry']?['location']?['lng'];
        if (lat == null || lng == null) continue;

        final name = place['name'] ?? 'Bilinmeyen Mekan';
        final rating = (place['rating'] ?? 0.0).toDouble();
        final placeId = place['place_id'] ?? DateTime.now().toString();

        _markers.add(
          Marker(
            markerId: MarkerId(placeId),
            position: LatLng(lat, lng),
            icon: BitmapDescriptor.defaultMarkerWithHue(hue),
            onTap: () {
              setState(() {
                _selectedPlace = {
                  'name': name,
                  'rating': rating,
                  'lat': lat,
                  'lng': lng,
                  'type': type == 'gym' ? 'Spor Salonu' : 'Sağlıklı Mekan',
                  'distance': _mapService.calculateDistance(
                    _currentPosition!.latitude, 
                    _currentPosition!.longitude, 
                    lat, 
                    lng
                  ).toStringAsFixed(1),
                };
              });
            },
          ),
        );
      }
    });
  }



  Future<void> _launchNavigation(double lat, double lng) async {
    final url = 'google.navigation:q=$lat,$lng';
    final fallbackUrl = 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
    
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    } else if (await canLaunchUrl(Uri.parse(fallbackUrl))) {
      await launchUrl(Uri.parse(fallbackUrl));
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Harita uygulaması açılamadı.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (kIsWeb) {
      return Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(title: const Text("Mekanlar")),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.map_rounded, size: 80, color: Colors.grey),
              const SizedBox(height: 20),
              Text("Harita Web'de Desteklenmez", style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 10),
              const Text("Harita özelliklerini görmek için mobil cihaz kullanın.", textAlign: TextAlign.center),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          _isLoading && _currentPosition == null
              ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
              : GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: LatLng(_currentPosition?.latitude ?? 0, _currentPosition?.longitude ?? 0),
                    zoom: 14,
                  ),
                  onMapCreated: (controller) => _mapController = controller,
                  markers: _markers,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  onTap: (_) => setState(() => _selectedPlace = null),
                ),
          
          // Custom ToolBar
          Positioned(
            top: 60,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.9),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 10)),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: AppTheme.primaryColor),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "Yakındaki Sağlıklı Mekanlar",
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: const Color(0xFF1E293B)),
                    ),
                  ),
                ],
              ),
            ).animate().slideY(begin: -1, end: 0),
          ),

          // Detail Info Card
          if (_selectedPlace != null)
            Positioned(
              bottom: 100,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 30, offset: const Offset(0, 10)),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            _selectedPlace!['type'],
                            style: GoogleFonts.outfit(color: AppTheme.primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 18),
                            const SizedBox(width: 4),
                            Text(_selectedPlace!['rating'].toString(), style: const TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _selectedPlace!['name'],
                      style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Uzaklık: ${_selectedPlace!['distance']} km",
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _launchNavigation(_selectedPlace!['lat'], _selectedPlace!['lng']),
                        icon: const Icon(Icons.navigation_outlined),
                        label: const Text("Git"),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().slideY(begin: 1, end: 0),
            ),

          // Floating Action Buttons
          Positioned(
            bottom: 30,
            right: 20,
            child: Column(
              children: [
                FloatingActionButton(
                  onPressed: _getCurrentLocation,
                  backgroundColor: Colors.white,
                  child: const Icon(Icons.my_location, color: AppTheme.primaryColor),
                ),
                const SizedBox(height: 12),
                FloatingActionButton(
                  onPressed: _fetchNearbyPlaces,
                  backgroundColor: AppTheme.primaryColor,
                  child: const Icon(Icons.refresh, color: Colors.white),
                ),
              ],
            ).animate().slideX(begin: 1, end: 0),
          ),
        ],
      ),
    );
  }
}
