import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initialMetrics, initialWards, initialBeds, initialInventory, initialAlerts, initialForecasts, initialChatMessages, initialFlowNodes } from './mockData';

// Environment variable reading with live medtwin-83f0f credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDOCZA70PesBsW0NrDXjwkSz39RRcCq5gI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "medtwin-83f0f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "medtwin-83f0f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "medtwin-83f0f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "701580093651",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:701580093651:web:55d5ec2f7427f06244cc26",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FW46QMXHFK"
};

const isLiveConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("Simulated")
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

    // Auto-seed Firestore collections in the background if empty
    setTimeout(() => {
      seedFirestoreCollections(db).catch(err => {
        console.warn("Firestore seed note (check security rules if permission-denied):", err.message);
      });
    }, 500);
  } catch (err) {
    console.warn("⚠️ Live Firebase initialization failed. Falling back to In-Memory Firestore Simulator:", err);
  }
}

// -----------------------------------------------------------------
// Auto-Seeder: Creates Live Firestore Collections & Documents
// -----------------------------------------------------------------
export async function seedFirestoreCollections(firestoreInstance = db) {
  if (!firestoreInstance) return false;

  try {
    console.log("🌱 Checking live Firestore collections on medtwin-83f0f...");
    const metricsRef = doc(firestoreInstance, 'hospitals', 'metrics');
    const metricsSnap = await getDoc(metricsRef);

    if (!metricsSnap.exists()) {
      console.log("🚀 Initializing live hospital collections in Firebase Firestore...");

      // 1. Hospital Metrics
      await setDoc(metricsRef, {
        ...initialMetrics,
        lastUpdated: new Date().toISOString()
      });

      // 2. Inventory Document
      await setDoc(doc(firestoreInstance, 'inventory', 'main'), {
        ...initialInventory,
        lastUpdated: new Date().toISOString()
      });

      // 3. Wards Collection
      for (const ward of initialWards) {
        await setDoc(doc(firestoreInstance, 'wards', ward.id), ward);
      }

      // 4. Beds Collection (First 30 beds for quick seed)
      const bedsBatch = writeBatch(firestoreInstance);
      const bedsToSeed = initialBeds.slice(0, 30);
      for (const bed of bedsToSeed) {
        const bedDoc = doc(firestoreInstance, 'beds', bed.id);
        bedsBatch.set(bedDoc, bed);
      }
      await bedsBatch.commit();

      // 5. Alerts Collection
      for (const alert of initialAlerts) {
        await setDoc(doc(firestoreInstance, 'alerts', alert.id), alert);
      }

      // 6. Forecasts Collection
      for (const forecast of initialForecasts) {
        await setDoc(doc(firestoreInstance, 'forecasts', forecast.period), forecast);
      }

      // 7. Initial Users Collection
      const defaultUsers = [
        { email: "cmo.jenkins@medtwin.health", name: "Dr. Sarah Jenkins", roleId: "cmo", roleName: "Chief Medical Officer", clearance: "Level 5 — Clinical Directorate" },
        { email: "ward.manager@medtwin.health", name: "Marcus Vance, RN", roleId: "ward_mgr", roleName: "Ward Manager", clearance: "Level 3 — Operations Dispatch" },
        { email: "logistics.lead@medtwin.health", name: "Elena Rostova", roleId: "logistics", roleName: "Logistics Lead", clearance: "Level 4 — Supply Operations" },
        { email: "ai.admin@medtwin.health", name: "Dr. Aniruddha Kule", roleId: "ai_admin", roleName: "AI Systems Administrator", clearance: "Level 5 — System SuperAdmin" }
      ];

      for (const u of defaultUsers) {
        await setDoc(doc(firestoreInstance, 'users', u.email.replace(/[.@]/g, '_')), {
          ...u,
          projectId: "medtwin-83f0f",
          created: new Date().toISOString()
        });
      }

      // 8. Initial System Audit / Login Event
      await addDoc(collection(firestoreInstance, 'login_events'), {
        action: "INITIAL_DATABASE_SEED",
        timestamp: new Date().toISOString(),
        projectId: "medtwin-83f0f",
        description: "MedTwin digital twin collections populated successfully."
      });

      console.log("✅ Live Firestore Collections created successfully in Firebase Console!");
      return true;
    } else {
      console.log("ℹ️ Firestore collections already exist on medtwin-83f0f.");
      return true;
    }
  } catch (err) {
    console.warn("⚠️ Live Firestore write error (Security Rules might be locked):", err);
    return false;
  }
}

// -----------------------------------------------------------------
// In-Memory Simulated Firestore Engine for Zero-Config Out-of-the-Box Execution
// -----------------------------------------------------------------
class InMemoryFirestoreSimulator {
  constructor() {
    let savedState = null;
    try {
      const saved = localStorage.getItem('medtwin_firestore_store');
      if (saved) savedState = JSON.parse(saved);
    } catch (_) {}

    this.store = {
      metrics: savedState?.metrics || { ...initialMetrics },
      wards: savedState?.wards || [...initialWards],
      beds: savedState?.beds || [...initialBeds],
      inventory: savedState?.inventory || JSON.parse(JSON.stringify(initialInventory)),
      alerts: savedState?.alerts || [...initialAlerts],
      forecasts: savedState?.forecasts || [...initialForecasts],
      chat_messages: savedState?.chat_messages || [...initialChatMessages],
      flow_nodes: savedState?.flow_nodes || [...initialFlowNodes],
      users: savedState?.users || [],
      login_events: savedState?.login_events || []
    };
    this.listeners = new Map();
  }

  saveToStorage() {
    try {
      localStorage.setItem('medtwin_firestore_store', JSON.stringify(this.store));
    } catch (_) {}
  }

  subscribe(collectionKey, callback) {
    if (!this.listeners.has(collectionKey)) {
      this.listeners.set(collectionKey, new Set());
    }
    const listenerSet = this.listeners.get(collectionKey);
    listenerSet.add(callback);

    setTimeout(() => callback(this.getData(collectionKey)), 10);

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
    this.saveToStorage();
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
      
      const ward = this.store.wards.find((w) => w.id === bed.wardId);
      if (ward) {
        if (oldStatus === "occupied" && newStatus !== "occupied") ward.occupied = Math.max(0, ward.occupied - 1);
        if (oldStatus !== "occupied" && newStatus === "occupied") ward.occupied = Math.min(ward.total, ward.occupied + 1);
        ward.available = ward.total - ward.occupied;
      }

      const totalOccupied = this.store.beds.filter((b) => b.status === "occupied").length;
      this.store.metrics.occupiedBeds = totalOccupied;
      this.store.metrics.availableBeds = this.store.metrics.totalBeds - totalOccupied;
      this.store.metrics.occupancyRate = Number(((totalOccupied / this.store.metrics.totalBeds) * 100).toFixed(1));
      
      this.saveToStorage();
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
    this.saveToStorage();
    this.notify("inventory");
    this.notify("metrics");
  }

  acknowledgeAlert(alertId, userName = "Chief Medical Officer") {
    const alert = this.store.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userName;
      this.store.metrics.activeCriticalAlerts = this.store.alerts.filter((a) => a.severity === "CRITICAL" && !a.acknowledged).length;
      this.saveToStorage();
      this.notify("alerts");
      this.notify("metrics");
    }
  }

  resolveAlert(alertId) {
    this.store.alerts = this.store.alerts.filter((a) => a.id !== alertId);
    this.store.metrics.activeCriticalAlerts = this.store.alerts.filter((a) => a.severity === "CRITICAL" && !a.acknowledged).length;
    this.saveToStorage();
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
    this.saveToStorage();
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
    this.saveToStorage();
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
    this.saveToStorage();
    this.notify("forecasts");
  }

  recordLoginEvent(loginData) {
    const event = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      projectId: "medtwin-83f0f",
      status: "SUCCESS",
      device: typeof navigator !== 'undefined' ? navigator.userAgent : "Web Client",
      ipAddress: "192.168.1.104 (Encrypted TLS)",
      ...loginData
    };
    
    this.store.login_events = [event, ...(this.store.login_events || [])].slice(0, 50);

    const existingUserIndex = (this.store.users || []).findIndex(u => u.email === loginData.email);
    const userProfile = {
      email: loginData.email,
      name: loginData.name,
      roleId: loginData.roleId,
      roleName: loginData.roleName,
      clearance: loginData.clearance,
      lastLogin: event.timestamp,
      loginCount: existingUserIndex >= 0 ? (this.store.users[existingUserIndex].loginCount || 1) + 1 : 1,
      projectId: "medtwin-83f0f"
    };

    if (existingUserIndex >= 0) {
      this.store.users[existingUserIndex] = userProfile;
    } else {
      this.store.users = [...(this.store.users || []), userProfile];
    }

    this.saveToStorage();
    this.notify("login_events");
    this.notify("users");

    // Live write directly to Firebase Firestore
    if (isLiveConfigured && db) {
      try {
        addDoc(collection(db, 'login_events'), event).catch(console.warn);
        setDoc(doc(db, 'users', loginData.email.replace(/[.@]/g, '_')), userProfile, { merge: true }).catch(console.warn);
      } catch (err) {
        console.warn("Could not write to live firestore:", err);
      }
    }

    return event;
  }
}

export const simulator = new InMemoryFirestoreSimulator();

export const recordLoginToFirebase = (loginPayload) => {
  return simulator.recordLoginEvent(loginPayload);
};

export const getFirebaseUsers = () => {
  return simulator.getData('users');
};

export const getFirebaseLoginEvents = () => {
  return simulator.getData('login_events');
};

export { app, db, auth, isLiveConfigured, firebaseConfig };
