import { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '../config/api';

export interface SystemStatus {
  firestore: 'Kontrol Ediliyor...' | 'BAĞLANTI AKTİF' | 'ERİŞİM HATASI';
  ai: 'Kontrol Ediliyor...' | 'AKTİF' | 'KOTA DOLU / BEKLEMEDE' | 'ERİŞİM HATASI';
  server: 'Kontrol Ediliyor...' | 'AKTİF' | 'BAĞLANTI KOPTU';
  memory: {
    percentage: number;
    label: string;
  };
  dbStats?: {
    users: number;
    meals: number;
    analyses: number;
    weeklyPlans: number;
    water_logs: number;
  };
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    firestore: 'Kontrol Ediliyor...',
    ai: 'Kontrol Ediliyor...',
    server: 'Kontrol Ediliyor...',
    memory: { percentage: 0, label: '0% / 0GB RAM' },
    dbStats: undefined
  });

  const apiUrlRef = useRef(getApiBaseUrl());

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${apiUrlRef.current}/system/status`);
        if (res.ok) {
          const data = await res.json();

          // firestoreStatus backend'den geliyor (Admin SDK ile kontrol edildi)
          const firestoreState: SystemStatus['firestore'] =
            data.firestoreStatus === 'BAĞLANTI AKTİF'
              ? 'BAĞLANTI AKTİF'
              : 'ERİŞİM HATASI';

          // AI durumu string olarak geliyor - doğrudan map et
          let aiState: SystemStatus['ai'] = 'AKTİF';
          if (data.ai === 'AKTİF' || data.ai === 'MAINTENANCE_MODE') {
            aiState = 'AKTİF';
          } else if (data.ai === 'KOTA DOLU / BEKLEMEDE') {
            aiState = 'KOTA DOLU / BEKLEMEDE';
          } else if (
            data.ai &&
            data.ai !== 'Kontrol Ediliyor...'
          ) {
            aiState = 'ERİŞİM HATASI';
          }

          setStatus({
            server: 'AKTİF',
            firestore: firestoreState,
            ai: aiState,
            dbStats: data.db,
            memory: {
              percentage: data.memory?.percentage ?? 0,
              label: `${data.memory?.percentage ?? 0}% / ${data.memory?.totalGB ?? '0'}GB RAM`
            }
          });
        } else {
          setStatus(prev => ({
            ...prev,
            server: 'BAĞLANTI KOPTU',
            ai: 'ERİŞİM HATASI',
            firestore: 'ERİŞİM HATASI'
          }));
        }
      } catch {
        setStatus(prev => ({
          ...prev,
          server: 'BAĞLANTI KOPTU',
          ai: 'ERİŞİM HATASI',
          firestore: 'ERİŞİM HATASI'
        }));
      }
    };

    // İlk kontrol
    checkBackend();

    // 30 saniyede bir güncelle
    const interval = setInterval(checkBackend, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []); // Boş dependency array - sadece mount/unmount'ta çalışır

  return status;
}
