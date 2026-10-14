import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initialMetrics, initialWards, initialBeds, initialInventory, initialAlerts, initialForecasts, initialChatMessages, initialFlowNodes } from './mockData';

// Environment variable reading with fallback check
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSySimulatedKey_MedTwinLocalDemoMode",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medtwin-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medtwin-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medtwin-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

const isLiveConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID &&
  !import.meta.env.VITE_FIREBASE_API_KEY.includes("SimulatedKey")
);

let app = null;
let db = null;
let auth = null;

if (isLiveConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("🔥 Connected to Live Firebase Project:", firebaseConfig.projectId);
  } catch (err) {
    console.warn("⚠️ Live Firebase initialization failed. Falling back to In-Memory Firestore Simulator:", err);
  }
}

// -----------------------------------------------------------------
// In-Memory Simulated Firestore Engine for Zero-Config Out-of-the-Box Execution
// -----------------------------------------------------------------
class InMemoryFirestoreSimulator {
  constructor() {
    this.store = {
      metrics: { ...initialMetrics },
      wards: [...initialWards],
      beds: [...initialBeds],
      inventory: JSON.parse(JSON.stringify(initialInventory)),
      alerts: [...initialAlerts],
      forecasts: [...initialForecasts],
      chat_messages: [...initialChatMessages],
      flow_nodes: [...initialFlowNodes]
    };
    this.listeners = new Map(); // key -> Set of callbacks
  }

  subscribe(collectionKey, callback) {
    if (!this.listeners.has(collectionKey)) {
      this.listeners.set(collectionKey, new Set());
    }
    const listenerSet = this.listeners.get(collectionKey);
    listenerSet.add(callback);

    // Initial trigger
    setTimeout(() => callback(this.getData(collectionKey)), 10);

    // Return unsubscriber
    return () => {
      listenerSet.delete(callback);
    };
  }

  getData(collectionKey) {
    return JSON.parse(JSON.stringify(this.store[collectionKey] || []));
  }

  notify(collectionKey) {
    if (this.listeners.has(collectionKey)) {
      const data = this.getData(collectionKey);
      this.listeners.get(collectionKey).forEach((cb) => cb(data));
    }
  }

  updateMetrics(partial) {
    this.store.metrics = { ...this.store.metrics, ...partial, lastUpdated: new Date().toISOString() };
    this.notify("metrics");
  }

  updateBedStatus(bedId, newStatus, patientDetails = null) {
    const bed = this.store.beds.find((b) => b.id === bedId);
    if (bed) {
      const oldStatus = bed.status;
      bed.status = newStatus;
      if (patientDetails !== undefined) {
        bed.patient = patientDetails;
      } else if (newStatus === "available" || newStatus === "cleaning") {
        bed.patient = null;
      }
      
      // Update ward counters
      const ward = this.store.wards.find((w) => w.id === bed.wardId);
      if (ward) {
        if (oldStatus === "occupied" && newStatus !== "occupied") ward.occupied = Math.max(0, ward.occupied - 1);
        if (oldStatus !== "occupied" && newStatus === "occupied") ward.occupied = Math.min(ward.total, ward.occupied + 1);
        ward.available = ward.total - ward.occupied;
      }

      // Update total metrics
      const totalOccupied = this.store.beds.filter((b) => b.status === "occupied").length;
      this.store.metrics.occupiedBeds = totalOccupied;
      this.store.metrics.availableBeds = this.store.metrics.totalBeds - totalOccupied;
      this.store.metrics.occupancyRate = Number(((totalOccupied / this.store.metrics.totalBeds) * 100).toFixed(1));
      
      this.notify("beds");
      this.notify("wards");
      this.notify("metrics");
    }
  }

  updateInventory(category, updateData) {
    if (category === "oxygen") {
      this.store.inventory.oxygen = { ...this.store.inventory.oxygen, ...updateData };
      this.store.metrics.oxygenTankLevelPercent = updateData.tankPercentage || this.store.metrics.oxygenTankLevelPercent;
      this.store.metrics.oxygenTankPSI = updateData.pressurePSI || this.store.metrics.oxygenTankPSI;
    } else if (category === "medications") {
      const { id, newStock } = updateData;
      const med = this.store.inventory.medications.find((m) => m.id === id);
      if (med) {
        med.currentStock = newStock;
        med.status = newStock <= med.minThreshold ? "CRITICAL_LOW" : "NORMAL";
      }
    } else if (category === "bloodBank") {
      const { group, units } = updateData;
      const b = this.store.inventory.bloodBank.find((item) => item.group === group);
      if (b) {
        b.units = units;
        b.status = units <= b.minRequired ? "CRITICAL" : "STABLE";
      }
    }
    this.notify("inventory");
    this.notify("metrics");
  }

  acknowledgeAlert(alertId, userName = "Chief Medical Officer") {
    const alert = this.store.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userName;
      this.store.metrics.activeCriticalAlerts = this.store.alerts.filter((a) => a.severity === "CRITICAL" && !a.acknowledged).length;
      this.notify("alerts");
      this.notify("metrics");
    }
  }

  resolveAlert(alertId) {
    this.store.alerts = this.store.alerts.filter((a) => a.id !== alertId);
    this.store.metrics.activeCriticalAlerts = this.store.alerts.filter((a) => a.severity === "CRITICAL" && !a.acknowledged).length;
    this.notify("alerts");
    this.notify("metrics");
  }

  addAlert(newAlert) {
    const alertObj = {
      id: `alt-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      acknowledgedBy: null,
      ...newAlert
    };
    this.store.alerts.unshift(alertObj);
    if (newAlert.severity === "CRITICAL") {
      this.store.metrics.activeCriticalAlerts += 1;
    }
    this.notify("alerts");
    this.notify("metrics");
  }

  addChatMessage(msg) {
    const chatObj = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...msg
    };
    this.store.chat_messages.push(chatObj);
    this.notify("chat_messages");
  }

  applySurgeSimulation(surgePercent) {
    const multiplier = 1 + (surgePercent / 100);
    this.store.forecasts = initialForecasts.map((f) => ({
      ...f,
      projectedOccupancy: Math.min(100, Number((f.projectedOccupancy * multiplier).toFixed(1))),
      upperBound: Math.min(100, Number((f.upperBound * multiplier).toFixed(1))),
      oxygenBurnLmin: Number((f.oxygenBurnLmin * multiplier).toFixed(1))
    }));
    this.notify("forecasts");
  }
}

export const simulator = new InMemoryFirestoreSimulator();

export { app, db, auth, isLiveConfigured };
