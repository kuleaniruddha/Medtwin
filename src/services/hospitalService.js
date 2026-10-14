import { db, isLiveConfigured, simulator } from './firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

export const subscribeMetrics = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(doc(db, 'hospitals', 'metrics'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  }
  return simulator.subscribe('metrics', callback);
};

export const subscribeWards = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(collection(db, 'wards'), (querySnap) => {
      const wards = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(wards);
    });
  }
  return simulator.subscribe('wards', callback);
};

export const subscribeBeds = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(collection(db, 'beds'), (querySnap) => {
      const beds = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(beds);
    });
  }
  return simulator.subscribe('beds', callback);
};

export const updateBedStatus = async (bedId, newStatus, patientDetails = null) => {
  if (isLiveConfigured && db) {
    const bedRef = doc(db, 'beds', bedId);
    await updateDoc(bedRef, {
      status: newStatus,
      patient: patientDetails,
      lastUpdated: new Date().toISOString()
    });
    return;
  }
  simulator.updateBedStatus(bedId, newStatus, patientDetails);
};

export const subscribeInventory = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(doc(db, 'inventory', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  }
  return simulator.subscribe('inventory', callback);
};

export const restockInventory = async (category, updateData) => {
  if (isLiveConfigured && db) {
    const invRef = doc(db, 'inventory', 'main');
    await updateDoc(invRef, {
      [category]: updateData,
      lastUpdated: new Date().toISOString()
    });
    return;
  }
  simulator.updateInventory(category, updateData);
};

export const subscribeAlerts = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(collection(db, 'alerts'), (querySnap) => {
      const alerts = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(alerts);
    });
  }
  return simulator.subscribe('alerts', callback);
};

export const acknowledgeAlert = async (alertId, userName) => {
  if (isLiveConfigured && db) {
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, {
      acknowledged: true,
      acknowledgedBy: userName
    });
    return;
  }
  simulator.acknowledgeAlert(alertId, userName);
};

export const resolveAlert = async (alertId) => {
  if (isLiveConfigured && db) {
    await deleteDoc(doc(db, 'alerts', alertId));
    return;
  }
  simulator.resolveAlert(alertId);
};

export const createAlert = async (alertData) => {
  if (isLiveConfigured && db) {
    await addDoc(collection(db, 'alerts'), {
      ...alertData,
      timestamp: new Date().toISOString(),
      acknowledged: false
    });
    return;
  }
  simulator.addAlert(alertData);
};

export const subscribeForecasts = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(collection(db, 'forecasts'), (querySnap) => {
      const forecasts = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(forecasts);
    });
  }
  return simulator.subscribe('forecasts', callback);
};

export const triggerSurgeSimulation = (surgePercentage) => {
  simulator.applySurgeSimulation(surgePercentage);
};

export const subscribeChat = (callback) => {
  if (isLiveConfigured && db) {
    return onSnapshot(collection(db, 'chat_messages'), (querySnap) => {
      const msgs = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(msgs);
    });
  }
  return simulator.subscribe('chat_messages', callback);
};

export const sendChatMessage = async (msg) => {
  if (isLiveConfigured && db) {
    await addDoc(collection(db, 'chat_messages'), {
      ...msg,
      timestamp: new Date().toISOString()
    });
    return;
  }
  simulator.addChatMessage(msg);
};

export const subscribeFlowNodes = (callback) => {
  return simulator.subscribe('flow_nodes', callback);
};
