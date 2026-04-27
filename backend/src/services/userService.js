const userRepository = require('../repositories/userRepository');

class UserService {
  calculateBMI(height, weight) {
    const heightInMeters = height / 100;
    const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
    
    let status = "Obez";
    if (bmi < 18.5) status = "Zayıf";
    else if (bmi < 25) status = "Normal";
    else if (bmi < 30) status = "Fazla Kilolu";
    
    return { bmi, status };
  }

  async registerUser(userData) {
    const { isim, boy, kilo } = userData;
    const { bmi, status } = this.calculateBMI(Number(boy), Number(kilo));
    
    const newUser = { 
      isim, 
      boy: Number(boy), 
      kilo: Number(kilo), 
      vki: bmi, 
      durum: status,
      createdAt: new Date().toISOString()
    };
    
    return await userRepository.add(newUser);
  }

  async getAllUsers() {
    return await userRepository.getAll();
  }
}

module.exports = new UserService();
