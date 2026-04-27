class UserModel {
  final String id;
  final String isim;
  final int boy;
  final int kilo;
  final double vki;
  final String durum;

  UserModel({
    required this.id,
    required this.isim,
    required this.boy,
    required this.kilo,
    required this.vki,
    required this.durum,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      isim: json['isim'] ?? 'Bilinmiyor',
      boy: json['boy']?.toInt() ?? 0,
      kilo: json['kilo']?.toInt() ?? 0,
      vki: json['vki']?.toDouble() ?? 0.0,
      durum: json['durum'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'isim': isim,
      'boy': boy,
      'kilo': kilo,
      'vki': vki,
      'durum': durum,
    };
  }
}
