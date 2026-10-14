import React, { createContext, useContext, useState, useEffect } from 'react';
import * as hospitalService from '../services/hospitalService';
import { generateCopilotResponse } from '../services/chatEngine';

const HospitalContext = createContext();

export const HospitalProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bed-manager' | 'resources' | 'forecast' | 'digital-twin' | 'alerts' | 'chat' | 'analytics'
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

  const handleSendUserChatMessage = async (userText) => {
    // Save user message
    await hospitalService.sendChatMessage({
      sender: 'user',
      text: userText
    });

    // Generate AI copilot answer
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
    updateBedStatus: handleUpdateBedStatus,
    restockInventory: handleRestockInventory,
    acknowledgeAlert: handleAcknowledgeAlert,
    resolveAlert: handleResolveAlert,
    createAlert: handleCreateAlert,
    applySurge: handleApplySurge,
    sendChatMessage: handleSendUserChatMessage
  };

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => useContext(HospitalContext);
