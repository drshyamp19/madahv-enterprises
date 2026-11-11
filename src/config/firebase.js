// Firebase Configuration & Offline-First Persistence Architecture
// Supports Cloud Firestore, Realtime Database (for GPS), and Firebase Auth

export const firebaseConfig = {
  apiKey: "AIzaSyDemoKey-MadhavEnterprises-FreeSpark",
  authDomain: "madhav-enterprises-prod.firebaseapp.com",
  projectId: "madhav-enterprises-prod",
  storageBucket: "madhav-enterprises-prod.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Offline sync queue helper (Stored in LocalStorage / IndexedDB for offline field sales)
export class OfflineSyncQueue {
  static QUEUE_KEY = "madhav_offline_orders_queue";

  static getQueue() {
    try {
      const data = localStorage.getItem(this.QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static addToQueue(orderPayload) {
    const queue = this.getQueue();
    queue.push({
      id: `local-${Date.now()}`,
      payload: orderPayload,
      queued_at: new Date().toISOString()
    });
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    return queue.length;
  }

  static clearQueue() {
    localStorage.removeItem(this.QUEUE_KEY);
  }

  static getPendingCount() {
    return this.getQueue().length;
  }
}
