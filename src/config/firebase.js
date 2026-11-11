// Firebase Configuration with Real Project Keys
// Project: madhav-enterprises-541a1
export const firebaseConfig = {
  apiKey: "AIzaSyCJ32N2Oe1OaVXus6JD8EUKy4Lh9_uz0e8",
  authDomain: "madhav-enterprises-541a1.firebaseapp.com",
  projectId: "madhav-enterprises-541a1",
  storageBucket: "madhav-enterprises-541a1.firebasestorage.app",
  messagingSenderId: "240604778910",
  appId: "1:240604778910:web:45a6ce64bd17f102cbc68f",
  measurementId: "G-E3725NGMCB"
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
