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
    const { isim, boy, kilo, authId } = userData;
    const { bmi, status } = this.calculateBMI(Number(boy), Number(kilo));
    
    const newUser = { 
      isim, 
      boy: Number(boy), 
      kilo: Number(kilo), 
      vki: bmi, 
      durum: status,
      authId: authId || "web_mock_user",
      createdAt: new Date().toISOString()
    };
    
    return await userRepository.add(newUser);
  }

  async getAllUsers() {
    return await userRepository.getAll();
  }

  async getUserHistory(authId) {
    return await userRepository.getByAuthId(authId);
  }

  async getUserById(id) {
    return await userRepository.getById(id);
  }


  async updateUser(userId, data) {
    const existingUser = await userRepository.getById(userId);
    if (!existingUser) throw new Error('Kullanıcı bulunamadı');

    const updatedBoy = data.boy || existingUser.boy;
    const updatedKilo = data.kilo || existingUser.kilo;
    const { bmi, status } = this.calculateBMI(updatedBoy, updatedKilo);

    const updates = {
      vki: bmi,
      durum: status
    };

    if (data.boy) updates.boy = Number(data.boy);
    if (data.kilo) updates.kilo = Number(data.kilo);

    await userRepository.update(userId, updates);
    return { ...existingUser, ...updates };
  }

  async addBodyAnalysis(authId, newKilo) {
    const history = await userRepository.getByAuthId(authId);
    if (!history || history.length === 0) {
      throw new Error('Kullanıcı bulunamadı');
    }
    const latestUser = history[0];
    
    return await this.registerUser({
      isim: latestUser.isim,
      boy: latestUser.boy,
      kilo: newKilo,
      authId: authId
    });
  }

  async deactivateUser(userId) {
    return await userRepository.deactivate(userId);
  }

  async resetUserData(authId) {
    return await userRepository.resetData(authId);
  }
}

module.exports = new UserService();
