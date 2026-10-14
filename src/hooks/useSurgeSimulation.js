import { useState, useMemo } from 'react';
import { calculateMMcQueue, generateSurgeForecastCurve, runMonteCarloStressTest } from '../services/simulationEngine';
import { useHospital } from '../context/HospitalContext';

export const useSurgeSimulation = () => {
  const { metrics, applySurge, surgePercent } = useHospital();
  const [surgeInput, setSurgeInput] = useState(surgePercent || 0);

  const baseOccupancy = metrics?.occupancyRate || 84.4;

  const forecastData = useMemo(() => {
    return generateSurgeForecastCurve(baseOccupancy, surgeInput);
  }, [baseOccupancy, surgeInput]);

  const queueModel = useMemo(() => {
    const arrivalRate = 12 * (1 + surgeInput / 100);
    return calculateMMcQueue(arrivalRate, 1.2, 15);
  }, [surgeInput]);

  const monteCarloResults = useMemo(() => {
    return runMonteCarloStressTest(400, surgeInput);
  }, [surgeInput]);

  const handleSimulate = (value) => {
    setSurgeInput(value);
    applySurge(value);
  };

  return {
    surgeInput,
    handleSimulate,
    forecastData,
    queueModel,
    monteCarloResults
  };
};
