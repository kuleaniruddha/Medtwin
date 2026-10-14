// MedTwin operational mock data seed
export const initialMetrics = {
  hospitalName: "Metro General Hospital",
  totalBeds: 90,
  occupiedBeds: 76,
  availableBeds: 14,
  occupancyRate: 84.4,
  icuCapacity: 93.3,
  erWaitTimeMinutes: 18,
  oxygenTankLevelPercent: 88.5,
  oxygenTankPSI: 885,
  oxygenBurnRateLmin: 44.2,
  oxygenHoursRemaining: 34.5,
  staffToPatientRatio: "1:3.2",
  activeCriticalAlerts: 2,
  activeWarningAlerts: 3,
  systemStatus: "OPTIMAL_SIMULATION",
  lastUpdated: new Date().toISOString()
};

export const initialWards = [
  { id: "icu", name: "Intensive Care Unit (ICU)", code: "ICU-01", total: 15, occupied: 14, available: 1, cleaning: 0, maintenance: 0, criticalStaffRatio: "1:1", manager: "Dr. A. Vance" },
  { id: "er", name: "Emergency Department", code: "ER-01", total: 15, occupied: 12, available: 2, cleaning: 1, maintenance: 0, criticalStaffRatio: "1:2", manager: "Dr. R. Sterling" },
  { id: "surgical", name: "Surgical Recovery Ward", code: "SURG-02", total: 15, occupied: 11, available: 4, cleaning: 0, maintenance: 0, criticalStaffRatio: "1:4", manager: "Dr. K. Thorne" },
  { id: "gen_male", name: "Male General Ward", code: "GEN-M", total: 15, occupied: 13, available: 2, cleaning: 0, maintenance: 0, criticalStaffRatio: "1:6", manager: "Nurse Lead S. Zhao" },
  { id: "gen_female", name: "Female General Ward", code: "GEN-F", total: 15, occupied: 14, available: 1, cleaning: 0, maintenance: 0, criticalStaffRatio: "1:6", manager: "Nurse Lead E. Ross" },
  { id: "isolation", name: "Negative Pressure Isolation", code: "ISOL-03", total: 15, occupied: 12, available: 2, cleaning: 1, maintenance: 0, criticalStaffRatio: "1:2", manager: "Dr. M. Chen" }
];

export const generateInitialBeds = () => {
  const beds = [];
  const names = [
    "Marcus Vance", "Elena Rostova", "Jameson Cole", "Sarah Jenkins", "David Kim",
    "Amara Okafor", "Robert Chen", "Linda Martinez", "William Wright", "Sophia Patel",
    "Alexander Hayes", "Olivia Taylor", "Gabriel Morales", "Emma Watson", "Lucas Scott"
  ];
  
  initialWards.forEach((ward) => {
    for (let i = 1; i <= ward.total; i++) {
      let status = "occupied";
      if (i > ward.occupied) {
        status = (i === ward.occupied + 1) ? "available" : (i === ward.occupied + 2 ? "cleaning" : "maintenance");
      }
      
      const bedId = `${ward.id}-${i < 10 ? '0' + i : i}`;
      const patientName = status === "occupied" ? names[(i + ward.name.length) % names.length] : null;
      
      beds.push({
        id: bedId,
        wardId: ward.id,
        bedNumber: `${ward.code}-B${i < 10 ? '0' + i : i}`,
        status, // 'available' | 'occupied' | 'cleaning' | 'maintenance'
        patient: status === "occupied" ? {
          name: patientName,
          age: 34 + (i * 7) % 45,
          gender: ward.id === 'gen_male' ? 'Male' : (ward.id === 'gen_female' ? 'Female' : (i % 2 === 0 ? 'Female' : 'Male')),
          diagnosis: ward.id === 'icu' ? 'Acute Respiratory Distress' : (ward.id === 'er' ? 'Trauma Observation' : 'Post-Op Observation'),
          admittedAt: new Date(Date.now() - (i * 3600000 * 8)).toISOString(),
          targetDischarge: new Date(Date.now() + (i * 3600000 * 14)).toISOString(),
          acuityScore: ward.id === 'icu' ? 4.8 : 2.4,
          oxygenSupportReqLmin: ward.id === 'icu' ? 12 : (ward.id === 'er' ? 5 : 0)
        } : null,
        equipment: ward.id === 'icu' ? ["Ventilator V-400", "Multi-Para Monitor", "Infusion Syringe Pump"] : ["Pulse Oximeter", "Wall Oxygen"],
        lastCleaned: new Date(Date.now() - 7200000).toISOString()
      });
    }
  });
  return beds;
};

export const initialBeds = generateInitialBeds();

export const initialInventory = {
  oxygen: {
    mainTankCapacityLiters: 10000,
    currentLevelLiters: 8850,
    tankPercentage: 88.5,
    pressurePSI: 885,
    burnRateLmin: 44.2,
    reserveCylindersHType: 48,
    portableCylindersEType: 62,
    ventilatorConnectionsActive: 15,
    highFlowCannulasActive: 22
  },
  medications: [
    { id: "med-01", name: "Norepinephrine 4mg/4mL", category: "ICU Emergency", currentStock: 85, minThreshold: 30, maxCapacity: 150, unit: "Vials", status: "NORMAL", supplier: "Cipla Critical Care" },
    { id: "med-02", name: "Propofol 10mg/mL (20mL)", category: "Sedative / Anesthetic", currentStock: 24, minThreshold: 40, maxCapacity: 100, unit: "Vials", status: "LOW_WARNING", supplier: "Neon Laboratories" },
    { id: "med-03", name: "Remdesivir 100mg", category: "Antiviral", currentStock: 120, minThreshold: 50, maxCapacity: 200, unit: "Vials", status: "NORMAL", supplier: "Hetero Healthcare" },
    { id: "med-04", name: "Meropenem 1g", category: "Broad-Spectrum Antibiotic", currentStock: 65, minThreshold: 35, maxCapacity: 120, unit: "Vials", status: "NORMAL", supplier: "Alkem Pharma" },
    { id: "med-05", name: "Heparin Sodium 5000U/mL", category: "Anticoagulant", currentStock: 18, minThreshold: 30, maxCapacity: 80, unit: "Vials", status: "CRITICAL_LOW", supplier: "Gland Pharma" },
    { id: "med-06", name: "Atropine Sulfate 0.6mg/mL", category: "Emergency Resuscitation", currentStock: 92, minThreshold: 40, maxCapacity: 150, unit: "Ampoules", status: "NORMAL", supplier: "Samarth Life Sciences" },
    { id: "med-07", name: "Fentanyl Citrate 50mcg/mL (2mL)", category: "Critical Analgesic", currentStock: 32, minThreshold: 30, maxCapacity: 90, unit: "Ampoules", status: "NORMAL", supplier: "Troikaa Pharmaceuticals" },
    { id: "med-08", name: "Normal Saline 0.9% IV (500mL)", category: "IV Fluid Hydration", currentStock: 210, minThreshold: 100, maxCapacity: 400, unit: "Bags", status: "NORMAL", supplier: "Baxter India" }
  ],
  bloodBank: [
    { group: "A+", units: 18, minRequired: 15, status: "STABLE" },
    { group: "A-", units: 4, minRequired: 8, status: "LOW" },
    { group: "B+", units: 22, minRequired: 15, status: "STABLE" },
    { group: "B-", units: 6, minRequired: 8, status: "LOW" },
    { group: "O+", units: 30, minRequired: 20, status: "STABLE" },
    { group: "O-", units: 2, minRequired: 10, status: "CRITICAL" },
    { group: "AB+", units: 12, minRequired: 8, status: "STABLE" },
    { group: "AB-", units: 5, minRequired: 6, status: "LOW" }
  ],
  equipment: [
    { id: "eq-01", type: "Mechanical Ventilator (High-End)", total: 18, inUse: 15, available: 3, maintenance: 0, supplier: "Hamilton Medical", power: "Operational" },
    { id: "eq-02", type: "Patient Monitor (Multi-Para)", total: 90, inUse: 76, available: 14, maintenance: 0, supplier: "Philips Healthcare", power: "Operational" },
    { id: "eq-03", type: "Infusion Syringe Pump", total: 120, inUse: 98, available: 20, maintenance: 2, supplier: "B. Braun India", power: "Operational" },
    { id: "eq-04", type: "Defibrillator Unit (Biphasic)", total: 12, inUse: 8, available: 4, maintenance: 0, supplier: "Zoll Medical", power: "Operational" }
  ],
  consumables: [
    { id: "con-01", name: "Sterile Trauma Burn Dressing Pack", category: "Trauma & Burn Surgery", currentStock: 14, minThreshold: 20, maxCapacity: 60, unit: "Packs", status: "LOW_WARNING", supplier: "Smith & Nephew" },
    { id: "con-02", name: "Level 3 PPE Coveralls & N95", category: "Infection Control", currentStock: 180, minThreshold: 80, maxCapacity: 300, unit: "Kits", status: "NORMAL", supplier: "3M Healthcare" },
    { id: "con-03", name: "IV Infusion Cannula (18G / 20G)", category: "Emergency Access", currentStock: 340, minThreshold: 150, maxCapacity: 500, unit: "Units", status: "NORMAL", supplier: "BD Medical" },
    { id: "con-04", name: "Endotracheal Tubes (7.5mm Cuffed)", category: "Airway Management", currentStock: 22, minThreshold: 25, maxCapacity: 80, unit: "Packs", status: "LOW_WARNING", supplier: "Teleflex Medical" },
    { id: "con-05", name: "Triple Lumen Central Venous Catheter", category: "ICU Resuscitation", currentStock: 16, minThreshold: 15, maxCapacity: 40, unit: "Sets", status: "NORMAL", supplier: "Arrow International" }
  ],
  orders: [
    { id: "po-101", poNumber: "PO-2026-9041", category: "Blood Bank", itemName: "O- Negative Red Blood Cells", quantity: 8, unit: "Units", supplier: "Red Cross Blood Center Mumbai", priority: "STAT Emergency", status: "IN_TRANSIT", timestamp: new Date(Date.now() - 12 * 60000).toISOString(), eta: "18 mins" },
    { id: "po-102", poNumber: "PO-2026-9039", category: "Oxygen", itemName: "Liquid Cryogenic O2 Bulk Delivery", quantity: 5000, unit: "Liters", supplier: "Praxair Cryogenics India", priority: "Urgent", status: "PROCESSING", timestamp: new Date(Date.now() - 48 * 60000).toISOString(), eta: "1 hr 10 mins" },
    { id: "po-103", poNumber: "PO-2026-9022", category: "Pharmaceuticals", itemName: "Propofol 10mg/mL (20mL)", quantity: 50, unit: "Vials", supplier: "Neon Laboratories", priority: "Standard", status: "DELIVERED", timestamp: new Date(Date.now() - 180 * 60000).toISOString(), eta: "Delivered" },
    { id: "po-104", poNumber: "PO-2026-9011", category: "Consumables", itemName: "Sterile Trauma Burn Dressing Pack", quantity: 25, unit: "Packs", supplier: "Smith & Nephew", priority: "Standard", status: "DELIVERED", timestamp: new Date(Date.now() - 1440 * 60000).toISOString(), eta: "Delivered" }
  ]
};

export const initialAlerts = [
  {
    id: "alt-101",
    title: "O- Blood Supply Critically Low",
    description: "Universal donor O- negative supply has dropped to 2 units (Threshold: 10 units). Immediate blood bank dispatch required.",
    severity: "CRITICAL",
    category: "SUPPLY_CHAIN",
    wardId: "er",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    acknowledged: false,
    acknowledgedBy: null,
    recommendedAction: "Request urgent O- units from the regional blood center."
  },
  {
    id: "alt-102",
    title: "ICU Bed Occupancy Threshold Exceeded",
    description: "Intensive Care Unit capacity reached 93.3% (14 / 15 beds occupied). Only 1 bed remains available for emergency intake.",
    severity: "CRITICAL",
    category: "BED_CAPACITY",
    wardId: "icu",
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    acknowledged: false,
    acknowledgedBy: null,
    recommendedAction: "Initiate step-down evaluation for ICU-04 & ICU-09 to Surgical Ward."
  },
  {
    id: "alt-103",
    title: "Propofol Stock Running Low",
    description: "Current stock of Propofol is 24 vials (Minimum safe reserve limit is 40 vials).",
    severity: "WARNING",
    category: "MEDICATION",
    wardId: "surgical",
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    acknowledged: true,
    acknowledgedBy: "Logistics Manager",
    recommendedAction: "Reorder 50 vials from primary pharmaceutical vendor."
  },
  {
    id: "alt-104",
    title: "ER Queue Expected to Increase",
    description: "Forecasting predicts a +35% increase in trauma admissions over the next 4 hours.",
    severity: "URGENT",
    category: "AI_PREDICTION",
    wardId: "er",
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    acknowledged: false,
    acknowledgedBy: null,
    recommendedAction: "Prep ER Triage overflow bays 3 and 4; call in secondary nursing shift."
  }
];

export const initialForecasts = [
  { hour: "Now", actualOccupancy: 84.4, projectedOccupancy: 84.4, lowerBound: 82.0, upperBound: 86.8, oxygenBurnLmin: 44.2 },
  { hour: "+4h", actualOccupancy: null, projectedOccupancy: 87.2, lowerBound: 83.5, upperBound: 91.0, oxygenBurnLmin: 47.8 },
  { hour: "+8h", actualOccupancy: null, projectedOccupancy: 91.5, lowerBound: 86.0, upperBound: 95.2, oxygenBurnLmin: 52.1 },
  { hour: "+12h", actualOccupancy: null, projectedOccupancy: 94.0, lowerBound: 88.2, upperBound: 98.5, oxygenBurnLmin: 55.0 },
  { hour: "+16h", actualOccupancy: null, projectedOccupancy: 92.1, lowerBound: 85.0, upperBound: 96.0, oxygenBurnLmin: 51.4 },
  { hour: "+24h", actualOccupancy: null, projectedOccupancy: 88.0, lowerBound: 80.5, upperBound: 93.2, oxygenBurnLmin: 46.0 },
  { hour: "+36h", actualOccupancy: null, projectedOccupancy: 82.5, lowerBound: 75.0, upperBound: 89.0, oxygenBurnLmin: 41.5 },
  { hour: "+48h", actualOccupancy: null, projectedOccupancy: 79.0, lowerBound: 71.0, upperBound: 85.0, oxygenBurnLmin: 39.0 },
  { hour: "+72h", actualOccupancy: null, projectedOccupancy: 76.2, lowerBound: 68.0, upperBound: 82.0, oxygenBurnLmin: 37.5 }
];

export const initialChatMessages = [
  {
    id: "msg-1",
    sender: "bot",
    text: "Hello. I can help review bed capacity, oxygen supply, stock levels, alerts, and demand forecasts. What would you like to check first?",
    timestamp: new Date(Date.now() - 300000).toISOString()
  }
];

export const initialFlowNodes = [
  { id: "node-1", stage: "Ambulance / Walk-In", label: "Patient Admission Intake", throughputPerHour: 14, status: "NORMAL", activeQueue: 4 },
  { id: "node-2", stage: "Triage Assessment", label: "ESI Severity Classification", throughputPerHour: 12, status: "ELEVATED", activeQueue: 8 },
  { id: "node-3", stage: "Emergency Department", label: "ER Resuscitation & Care", throughputPerHour: 10, status: "BOTTLENECK", activeQueue: 12 },
  { id: "node-4", stage: "Intensive Care Unit", label: "ICU Ventilator Care", throughputPerHour: 2, status: "CRITICAL_BOTTLENECK", activeQueue: 3 },
  { id: "node-5", stage: "Inpatient Ward / Recovery", label: "General & Surgical Recovery", throughputPerHour: 8, status: "NORMAL", activeQueue: 2 },
  { id: "node-6", stage: "Discharge & Outpatient", label: "Patient Discharge Processing", throughputPerHour: 9, status: "CLEAR", activeQueue: 1 }
];
