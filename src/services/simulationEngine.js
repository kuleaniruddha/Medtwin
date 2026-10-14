// MedTwin Mathematical Simulation Engine
// Implements M/M/c Queueing Models and Predictive Surge Risk Calculations

/**
 * Calculates Erlang-C Queue Wait Time approximation (M/M/c Model)
 * @param {number} arrivalRate - λ (patients arriving per hour)
 * @param {number} serviceRate - μ (patients serviced per bed per hour)
 * @param {number} beds - c (number of active bed units)
 */
export const calculateMMcQueue = (arrivalRate, serviceRate, beds) => {
  const trafficIntensity = arrivalRate / (serviceRate * beds);
  if (trafficIntensity >= 1) {
    return {
      systemUtilization: 99.9,
      expectedWaitMinutes: Math.round(45 + Math.random() * 30),
      riskStatus: "CRITICAL_OVERFLOW",
      queueLength: Math.round(arrivalRate * 2.5)
    };
  }

  // Simplified Erlang-C wait time formula
  const utilization = Number((trafficIntensity * 100).toFixed(1));
  const avgWaitHours = (trafficIntensity / (1 - trafficIntensity)) * (1 / (serviceRate * beds));
  const waitMinutes = Math.max(5, Math.round(avgWaitHours * 60));

  let riskStatus = "OPTIMAL";
  if (utilization > 85) riskStatus = "HIGH_RISK";
  if (utilization > 95) riskStatus = "CRITICAL_SURGE";

  return {
    systemUtilization: utilization,
    expectedWaitMinutes: waitMinutes,
    riskStatus,
    queueLength: Math.round(arrivalRate * trafficIntensity)
  };
};

/**
 * Generates 72-hour ARIMA-style occupancy trajectory under hypothetical surge %
 */
export const generateSurgeForecastCurve = (baseOccupancy, surgePercent) => {
  const points = ["Now", "+4h", "+8h", "+12h", "+16h", "+20h", "+24h", "+36h", "+48h", "+72h"];
  const multiplier = 1 + (surgePercent / 100);

  return points.map((p, idx) => {
    // Sinusoidal diurnal inflow variation + trend surge
    const diurnalFactor = Math.sin((idx / points.length) * Math.PI * 2) * 4;
    const growthTrend = Math.min(25, (idx / 4) * (surgePercent * 0.15));
    
    let projected = Number((baseOccupancy * multiplier + diurnalFactor + growthTrend).toFixed(1));
    projected = Math.min(100, Math.max(30, projected));
    
    const lower = Number(Math.max(25, projected - (3 + idx * 0.4)).toFixed(1));
    const upper = Number(Math.min(100, projected + (3 + idx * 0.5)).toFixed(1));
    
    return {
      hour: p,
      projectedOccupancy: projected,
      lowerBound: lower,
      upperBound: upper,
      oxygenBurnLmin: Number((44.2 * (projected / 84.4)).toFixed(1))
    };
  });
};

/**
 * Monte Carlo Risk Assessor for Emergency Surge Scenario Testing
 */
export const runMonteCarloStressTest = (simulationsCount = 500, surgeLevel = 25) => {
  let overflowCount = 0;
  let maxOxygenBurn = 0;

  for (let i = 0; i < simulationsCount; i++) {
    const randomSurge = surgeLevel + (Math.random() * 10 - 5);
    const simulatedBedDemand = 84.4 * (1 + randomSurge / 100);
    if (simulatedBedDemand > 95) overflowCount++;
    const burn = 44.2 * (1 + randomSurge / 100) + (Math.random() * 4);
    if (burn > maxOxygenBurn) maxOxygenBurn = burn;
  }

  const overflowProbabilityPercent = Number(((overflowCount / simulationsCount) * 100).toFixed(1));

  return {
    simulationsRun: simulationsCount,
    overflowProbabilityPercent,
    maxOxygenBurnLmin: Number(maxOxygenBurn.toFixed(1)),
    recommendation: overflowProbabilityPercent > 50 
      ? "HIGH SURGE RISK: Pre-allocate 12 elective surgical beds to emergency intake immediately." 
      : "STABLE PROJECTION: Maintain standard staffing and reserve monitor telemetry."
  };
};
