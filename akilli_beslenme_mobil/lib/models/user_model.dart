class UserModel {
  final String id;
  final String? authId;
  final String isim;
  final int boy;
  final int kilo;
  final double vki;
  final String durum;
  final int yas;
  final String hedef;
  final String alerjiler;

  UserModel({
    required this.id,
    this.authId,
    required this.isim,
    required this.boy,
    required this.kilo,
    required this.vki,
    required this.durum,
    this.yas = 0,
    this.hedef = 'Kilo Vermek',
    this.alerjiler = 'Yok',
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      authId: json['authId'] as String?,
      isim: json['isim'] ?? 'Bilinmiyor',
      boy: json['boy']?.toInt() ?? 0,
      kilo: json['kilo']?.toInt() ?? 0,
      vki: json['vki']?.toDouble() ?? 0.0,
      durum: json['durum'] ?? '',
      yas: json['yas']?.toInt() ?? 0,
      hedef: json['hedef'] ?? 'Kilo Vermek',
      alerjiler: json['alerjiler'] ?? 'Yok',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'authId': authId,
      'isim': isim,
      'boy': boy,
      'kilo': kilo,
      'vki': vki,
      'durum': durum,
      'yas': yas,
      'hedef': hedef,
      'alerjiler': alerjiler,
    };
  }
}
