import { db, isLiveConfigured, simulator } from './firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';

const API_BASE = 'http://127.0.0.1:8000';

export const fetchMumbaiIncidents = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/mumbai/incidents`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return data.incidents || [];
    }
  } catch (err) {
    console.warn("Backend API unavailable, using simulated Hugging Face fallback data:", err.message);
  }

  // Fallback realistic triaged scenarios with Hugging Face model tags
  return [
    {
      id: "mum-fb-01",
      title: "2 women dead as fire breaks out in 14-storey Imperial Heritage building in Nalasopara, over 25 rescued - The Times of India",
      source: "The Times of India",
      published: "Live Feed",
      location: "Nalasopara, Western Suburbs",
      category: "FIRE_BURNS",
      severity: "CRITICAL",
      hfModelScore: 0.94,
      hfModelName: "distilbert-base-uncased-finetuned-sst-2",
      casualtyEstimate: "25 - 40 smoke/burn cases",
      bedsToReserve: { icu: 4, emergency: 8, burns: 6, total: 18 },
      oxygenSurge: {
        additionalBurnRateLmin: 28.5,
        extraLitersRequired: 2500,
        recommendedTankBufferHours: 24,
        reserveCylindersNeeded: 6
      },
      criticalMedicines: [
        { name: "Silver Sulfadiazine Burn Dressing Kits", requiredUnits: 25, urgency: "IMMEDIATE" },
        { name: "Ringer's Lactate IV Resuscitation (500ml)", requiredUnits: 40, urgency: "IMMEDIATE" },
        { name: "Injectable Morphine / Analgesia", requiredUnits: 20, urgency: "HIGH" },
        { name: "Nebulized Bronchodilators (Salbutamol)", requiredUnits: 30, urgency: "HIGH" }
      ],
      bloodBankReserves: { oNegative: 6, aPositive: 8, plasmaUnits: 12 },
      actionableRecommendation: "Activate Code Red. Clear Step-Down unit to receive stable ICU patients; reserve 8 Trauma & 6 Burn beds for incoming burn casualties."
    },
    {
      id: "mum-fb-02",
      title: "Suburban local train coach derailment near Kurla junction during peak evening hours, multiple commuters injured",
      source: "Central Railway Civic Cell",
      published: "1 hour ago",
      location: "Kurla Central, Harbor-Main Corridor",
      category: "TRANSIT_CRASH",
      severity: "CRITICAL",
      hfModelScore: 0.91,
      hfModelName: "distilbert-base-uncased-finetuned-sst-2",
      casualtyEstimate: "35 - 55 blunt trauma casualties",
      bedsToReserve: { icu: 6, emergency: 12, burns: 0, total: 18 },
      oxygenSurge: {
        additionalBurnRateLmin: 34.0,
        extraLitersRequired: 3200,
        recommendedTankBufferHours: 24,
        reserveCylindersNeeded: 8
      },
      criticalMedicines: [
        { name: "Whole Blood / Packed Red Cells (O-)", requiredUnits: 8, urgency: "IMMEDIATE" },
        { name: "Normal Saline 0.9% IV (1000ml)", requiredUnits: 50, urgency: "IMMEDIATE" },
        { name: "Tranexamic Acid (TXA) Hemostatic Ampoules", requiredUnits: 25, urgency: "IMMEDIATE" }
      ],
      bloodBankReserves: { oNegative: 8, bPositive: 10, plasmaUnits: 16 },
      actionableRecommendation: "Code Black Mass Casualty. Open triage zone in ER bay; reserve 12 emergency trauma beds and 6 surgical ICU beds."
    },
    {
      id: "mum-fb-03",
      title: "Old 4-storey residential building collapse in Dongri following heavy rainfall, search & rescue underway",
      source: "BMC Disaster Cell",
      published: "2 hours ago",
      location: "Dongri, South Central Mumbai",
      category: "COLLAPSE_TRAUMA",
      severity: "HIGH",
      hfModelScore: 0.88,
      hfModelName: "distilbert-base-uncased-finetuned-sst-2",
      casualtyEstimate: "15 - 25 crush injury patients",
      bedsToReserve: { icu: 4, emergency: 8, burns: 0, total: 12 },
      oxygenSurge: {
        additionalBurnRateLmin: 22.0,
        extraLitersRequired: 1800,
        recommendedTankBufferHours: 18,
        reserveCylindersNeeded: 5
      },
      criticalMedicines: [
        { name: "Mannitol 20% (Crush Injury Syndrome)", requiredUnits: 20, urgency: "IMMEDIATE" },
        { name: "Calcium Gluconate for Hyperkalemia", requiredUnits: 15, urgency: "HIGH" },
        { name: "O-Negative Blood Units", requiredUnits: 5, urgency: "IMMEDIATE" }
      ],
      bloodBankReserves: { oNegative: 5, aPositive: 6, plasmaUnits: 8 },
      actionableRecommendation: "Code Orange Crush Trauma. Prepare nephrology dialyzer & emergency trauma beds for crush syndrome victims."
    }
  ];
};

export const applyIncidentSurge = async (incident) => {
  try {
    // 1. Notify Backend if running
    fetch(`${API_BASE}/api/mumbai/apply-surge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incidentId: incident.id,
        bedsToReserve: incident.bedsToReserve?.total || 10,
        oxygenBoostLmin: incident.oxygenSurge?.additionalBurnRateLmin || 25,
        incidentTitle: incident.title,
        location: incident.location
      })
    }).catch(() => {});

    // 2. Add high-priority Alert to Firebase Firestore (and simulator)
    const alertObj = {
      severity: "CRITICAL",
      type: "disaster_surge",
      title: `🚨 MUMBAI EMERGENCY: ${incident.location}`,
      message: `${incident.title} — AI recommends reserving ${incident.bedsToReserve?.total || 12} beds (ICU: ${incident.bedsToReserve?.icu || 4}, ER: ${incident.bedsToReserve?.emergency || 8}), boost oxygen by +${incident.oxygenSurge?.additionalBurnRateLmin || 25} L/min, and prepare emergency trauma drugs.`,
      source: "HUGGINGFACE_MUMBAI_RADAR",
      location: incident.location,
      acknowledged: false,
      acknowledgedBy: null,
      timestamp: new Date().toISOString()
    };

    simulator.addAlert(alertObj);

    // 3. Mark beds as reserved in Emergency / Trauma wards
    const beds = simulator.getData('beds');
    let reservedCount = 0;
    const targetBeds = incident.bedsToReserve?.total || 10;

    beds.forEach(bed => {
      if (reservedCount < targetBeds && (bed.wardId === 'er' || bed.wardId === 'icu') && bed.status === 'available') {
        simulator.updateBedStatus(bed.id, 'occupied', {
          name: `[RESERVED] Mumbai Emergency Triage (${incident.location.split(',')[0]})`,
          diagnosis: `Incoming ${incident.category.replace('_', ' ')} Casualty`,
          acuityScore: 4.5,
          admittedAt: new Date().toISOString()
        });
        reservedCount++;
      }
    });

    // 4. Boost Oxygen reserve buffer
    const inv = simulator.getData('inventory');
    if (inv && inv.oxygen) {
      simulator.updateInventory('oxygen', {
        burnRateLmin: Number(((inv.oxygen.burnRateLmin || 44) + (incident.oxygenSurge?.additionalBurnRateLmin || 25)).toFixed(1)),
        tankPercentage: Math.max(95, inv.oxygen.tankPercentage || 88)
      });
    }

    // 5. Store to live Firebase if connected
    if (isLiveConfigured && db) {
      try {
        addDoc(collection(db, 'alerts'), alertObj).catch(console.warn);
        addDoc(collection(db, 'mumbai_incidents'), {
          ...incident,
          activatedAt: new Date().toISOString(),
          status: "SURGE_ACTIVE"
        }).catch(console.warn);
      } catch (_) {}
    }

    return true;
  } catch (err) {
    console.error("Failed to apply incident surge:", err);
    return false;
  }
};
