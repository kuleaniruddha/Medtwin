import React, { createContext, useContext, useState, useEffect } from 'react';
import * as hospitalService from '../services/hospitalService';
import { generateCopilotResponse } from '../services/chatEngine';
import { simulator } from '../services/firebase';

const HospitalContext = createContext();

export const HospitalProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState(null);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [flowNodes, setFlowNodes] = useState([]);
  
  const [surgePercent, setSurgePercent] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSimulationActive, setIsLiveSimulationActive] = useState(true);
  const [lastLivePulse, setLastLivePulse] = useState(new Date());

  useEffect(() => {
    const unsubMetrics = hospitalService.subscribeMetrics((data) => setMetrics(data));
    const unsubWards = hospitalService.subscribeWards((data) => setWards(data));
    const unsubBeds = hospitalService.subscribeBeds((data) => setBeds(data));
    const unsubInventory = hospitalService.subscribeInventory((data) => setInventory(data));
    const unsubAlerts = hospitalService.subscribeAlerts((data) => setAlerts(data));
    const unsubForecasts = hospitalService.subscribeForecasts((data) => setForecasts(data));
    const unsubChat = hospitalService.subscribeChat((data) => setChatMessages(data));
    const unsubNodes = hospitalService.subscribeFlowNodes((data) => setFlowNodes(data));

    setIsLoading(false);

    return () => {
      if (typeof unsubMetrics === 'function') unsubMetrics();
      if (typeof unsubWards === 'function') unsubWards();
      if (typeof unsubBeds === 'function') unsubBeds();
      if (typeof unsubInventory === 'function') unsubInventory();
      if (typeof unsubAlerts === 'function') unsubAlerts();
      if (typeof unsubForecasts === 'function') unsubForecasts();
      if (typeof unsubChat === 'function') unsubChat();
      if (typeof unsubNodes === 'function') unsubNodes();
    };
  }, []);

  // ── Live Real-Time Hospital Telemetry Heartbeat ──
  useEffect(() => {
    if (!isLiveSimulationActive) return;

    const interval = setInterval(() => {
      // 1. Oxygen telemetry: subtle realistic consumption fluctuation
      const inv = simulator.getData('inventory');
      if (inv && inv.oxygen) {
        const currentPSI = inv.oxygen.pressurePSI || 885;
        const currentBurn = inv.oxygen.burnRateLmin || 44.2;
        
        // Slight fluctuation (-0.2 PSI average drop with small noise)
        const jitter = Number((Math.random() * 0.4 - 0.25).toFixed(1));
        const newPSI = Math.max(500, Math.min(1000, Number((currentPSI + jitter).toFixed(1))));
        const newPercent = Number(((newPSI / 1000) * 100).toFixed(1));
        const newHours = Number(((newPercent / 100) * 12500 / (currentBurn * 60)).toFixed(1));

        simulator.updateInventory('oxygen', {
          pressurePSI: newPSI,
          tankPercentage: newPercent
        });

        simulator.updateMetrics({
          oxygenTankPSI: newPSI,
          oxygenTankLevelPercent: newPercent,
          oxygenHoursRemaining: newHours,
          lastUpdated: new Date().toISOString()
        });
      }

      // 2. ER wait time micro-drift (diurnal inflow)
      const currentER = simulator.getData('metrics')?.erWaitTimeMinutes || 18;
      const erDrift = Math.random() > 0.65 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const nextER = Math.max(12, Math.min(32, currentER + erDrift));
      simulator.updateMetrics({ erWaitTimeMinutes: nextER });

      // 3. Occasional bed turnaround: cleaning bed becomes ready
      const allBeds = simulator.getData('beds');
      const cleaningBed = allBeds.find(b => b.status === 'cleaning');
      if (cleaningBed && Math.random() > 0.75) {
        simulator.updateBedStatus(cleaningBed.id, 'available');
      }

      setLastLivePulse(new Date());
    }, 7000); // Heartbeat pulse every 7 seconds

    return () => clearInterval(interval);
  }, [isLiveSimulationActive]);

  const handleUpdateBedStatus = async (bedId, newStatus, patientDetails) => {
    await hospitalService.updateBedStatus(bedId, newStatus, patientDetails);
  };

  const handleRestockInventory = async (category, updateData) => {
    await hospitalService.restockInventory(category, updateData);
  };

  const handleAcknowledgeAlert = async (alertId, userName) => {
    await hospitalService.acknowledgeAlert(alertId, userName);
  };

  const handleResolveAlert = async (alertId) => {
    await hospitalService.resolveAlert(alertId);
  };

  const handleCreateAlert = async (alertData) => {
    await hospitalService.createAlert(alertData);
  };

  const handleApplySurge = (percent) => {
    setSurgePercent(percent);
    hospitalService.triggerSurgeSimulation(percent);
  };

  // Quick Action: Admit a test emergency patient to first available bed
  const handleQuickAdmit = async (wardId = 'er') => {
    const targetBed = beds.find(b => b.wardId === wardId && b.status === 'available') || beds.find(b => b.status === 'available');
    if (!targetBed) return false;

    const patientNames = ["Rohan Deshmukh", "Pooja Mehta", "Kunal Shinde", "Anjali Nair", "Sunil Kulkarni", "Neha Verma"];
    const randomName = patientNames[Math.floor(Math.random() * patientNames.length)];
    
    await hospitalService.updateBedStatus(targetBed.id, 'occupied', {
      name: randomName,
      age: 25 + Math.floor(Math.random() * 50),
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      diagnosis: wardId === 'er' ? 'Acute Emergency Triage' : 'General Inpatient Observation',
      admittedAt: new Date().toISOString(),
      targetDischarge: new Date(Date.now() + 36 * 3600000).toISOString(),
      acuityScore: 3.2,
      oxygenSupportReqLmin: 4
    });
    return true;
  };

  // Quick Action: Discharge an occupied patient from a bed to free it
  const handleQuickDischarge = async (wardId = null) => {
    const targetBed = beds.find(b => (!wardId || b.wardId === wardId) && b.status === 'occupied');
    if (!targetBed) return false;
    await hospitalService.updateBedStatus(targetBed.id, 'cleaning');
    setTimeout(() => {
      hospitalService.updateBedStatus(targetBed.id, 'available');
    }, 3500);
    return true;
  };

  // Quick Action: Restock all low medications
  const handleRestockAllMedications = async () => {
    const inv = simulator.getData('inventory');
    if (inv && inv.medications) {
      const updated = inv.medications.map(m => ({
        ...m,
        currentStock: m.maxCapacity,
        status: 'NORMAL'
      }));
      simulator.updateInventory('medications_all', updated);
      // Update individual items
      updated.forEach(m => {
        simulator.updateInventory('medications', { id: m.id, newStock: m.maxCapacity });
      });
    }
  };

  const handleSendUserChatMessage = async (userText) => {
    await hospitalService.sendChatMessage({
      sender: 'user',
      text: userText
    });

    setTimeout(async () => {
      const aiReply = generateCopilotResponse(userText, metrics, beds, inventory, alerts);
      await hospitalService.sendChatMessage({
        sender: 'bot',
        text: aiReply
      });
    }, 600);
  };

  const value = {
    activeTab,
    setActiveTab,
    metrics,
    wards,
    beds,
    inventory,
    alerts,
    forecasts,
    chatMessages,
    flowNodes,
    surgePercent,
    isLoading,
    isLiveSimulationActive,
    setIsLiveSimulationActive,
    toggleLiveSimulation: () => setIsLiveSimulationActive(prev => !prev),
    lastLivePulse,
    updateBedStatus: handleUpdateBedStatus,
    restockInventory: handleRestockInventory,
    acknowledgeAlert: handleAcknowledgeAlert,
    resolveAlert: handleResolveAlert,
    createAlert: handleCreateAlert,
    applySurge: handleApplySurge,
    sendChatMessage: handleSendUserChatMessage,
    quickAdmit: handleQuickAdmit,
    quickDischarge: handleQuickDischarge,
    restockAllMedications: handleRestockAllMedications,
    refreshData: () => setMetrics(simulator.getData('metrics'))
  };

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => useContext(HospitalContext);
