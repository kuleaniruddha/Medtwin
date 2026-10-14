import { useHospital } from '../context/HospitalContext';

export const useHospitalData = () => {
  return useHospital();
};
