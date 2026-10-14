// MedTwin operational assistant responses

export const generateCopilotResponse = (userPrompt, currentMetrics, currentBeds, currentInventory, currentAlerts) => {
  const query = userPrompt.toLowerCase();
  
  if (query.includes("oxygen") || query.includes("o2") || query.includes("tank")) {
    const o2 = currentInventory?.oxygen || {};
    return `**Oxygen Supply Overview**
- Main oxygen level: **${o2.tankPercentage || 88.5}%** (${o2.pressurePSI || 885} PSI)
- Current usage rate: **${o2.burnRateLmin || 44.2} L/min**
- Estimated time remaining: **${currentMetrics?.oxygenHoursRemaining || 34.5} hours**
- Reserve cylinders: **${o2.reserveCylindersHType || 48} H-Type** / **${o2.portableCylindersEType || 62} E-Type**

Recommendation: oxygen levels are stable for the next 34+ hours at current use. At +30% demand, estimated remaining time drops to about 26 hours.`;
  }

  if (query.includes("bed") || query.includes("icu") || query.includes("capacity") || query.includes("occupancy")) {
    const total = currentMetrics?.totalBeds || 90;
    const occupied = currentMetrics?.occupiedBeds || 76;
    const available = currentMetrics?.availableBeds || 14;
    const icuRatio = currentMetrics?.icuCapacity || 93.3;

    return `**Hospital Capacity**
- Total beds: **${total}**
- Occupied beds: **${occupied}** (${currentMetrics?.occupancyRate || 84.4}%)
- Available beds: **${available}**
- ICU occupancy: **${icuRatio}%** (1 bed available)

Recommendation: review step-down transfers from ICU-04 and ICU-09 to Surgical Ward to free ICU capacity.`;
  }

  if (query.includes("alert") || query.includes("critical") || query.includes("warning") || query.includes("emergency")) {
    const unackCount = currentAlerts?.filter(a => !a.acknowledged).length || 0;
    return `**Active Alert Summary**
- Total alerts: **${currentAlerts?.length || 4}**
- Unacknowledged alerts: **${unackCount}**
- Critical alerts: **${currentMetrics?.activeCriticalAlerts || 2}**

Key items: **O- blood supply low** (2 units remaining) and **ICU occupancy high**. Open Alerts to acknowledge and assign follow-up.`;
  }

  if (query.includes("surge") || query.includes("forecast") || query.includes("predict") || query.includes("future")) {
    return `**Forecast Summary**
- 4-hour projection: **87.2% occupancy**
- 12-hour projection: **94.0% occupancy**
- Overflow risk: **34.2%**

Recommendation: use Forecast to test a +30% ER demand scenario and review ventilator coverage.`;
  }

  if (query.includes("blood") || query.includes("medication") || query.includes("supply")) {
    return `**Pharmacy and Blood Bank Status**
- Critical low: **O- blood units (2 remaining)**, **Heparin Sodium (18 vials)**
- Low: **Propofol (24 vials)**, **A- blood units (4 remaining)**
- Stable: **Remdesivir**, **Meropenem**, **O+ blood (30 units)**

Use Supplies to place restock orders.`;
  }

  return `**MedTwin Assistant**
I am monitoring live metrics for **${currentMetrics?.hospitalName || "Metro General Facility"}**.
Current summary:
- Occupancy: **${currentMetrics?.occupancyRate || 84.4}%** (${currentMetrics?.availableBeds || 14} beds available)
- Oxygen: **${currentMetrics?.oxygenTankLevelPercent || 88.5}%** (${currentMetrics?.oxygenHoursRemaining || 34.5}h remaining)
- ER wait time: **${currentMetrics?.erWaitTimeMinutes || 18} minutes**

Try asking:
1. *"What is our ICU bed availability?"*
2. *"Show me oxygen usage and pressure"*
3. *"List active critical alerts"*
4. *"Predict demand risk for the next 12 hours"*`;
};
