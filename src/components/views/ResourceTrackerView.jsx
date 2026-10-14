import React, { useState, useMemo } from 'react';
import {
  Package,
  Wind,
  Droplet,
  Activity,
  ShoppingCart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  FileText,
  RefreshCw,
  ShieldCheck,
  Layers,
  Zap,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  Pill,
  Sparkles
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { GlassCard } from '../common/GlassCard';
import { StatBadge } from '../common/StatBadge';
import { ProgressBar } from '../common/ProgressBar';
import { ActionButton } from '../common/ActionButton';
import { Modal } from '../common/Modal';

export const ResourceTrackerView = () => {
  const {
    inventory,
    restockInventory,
    restockAllMedications,
    restockAllBlood,
    createPurchaseOrder
  } = useHospital();

  // Active section tab
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'medications', 'oxygen', 'blood', 'equipment', 'orders'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'critical', 'warning', 'healthy'

  // Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderCategory, setOrderCategory] = useState('medications');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(50);
  const [orderPriority, setOrderPriority] = useState('Urgent');
  const [supplierName, setSupplierName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Safe Fallbacks
  const o2 = inventory?.oxygen || {
    currentLevelLiters: 8850,
    tankPercentage: 88.5,
    pressurePSI: 885,
    burnRateLmin: 44.2,
    reserveCylindersHType: 48,
    portableCylindersEType: 62
  };
  const meds = inventory?.medications || [];
  const blood = inventory?.bloodBank || [];
  const equip = inventory?.equipment || [];
  const consumables = inventory?.consumables || [];
  const orders = inventory?.orders || [];

  // Show a momentary confirmation toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // KPI Calculations
  const criticalMedsCount = meds.filter(m => m.status === 'CRITICAL_LOW' || m.currentStock <= m.minThreshold).length;
  const warningMedsCount = meds.filter(m => m.status === 'LOW_WARNING' && m.currentStock > m.minThreshold).length;
  const totalBloodUnits = blood.reduce((acc, curr) => acc + (curr.units || 0), 0);
  const criticalBloodCount = blood.filter(b => b.status === 'CRITICAL' || b.units <= b.minRequired).length;
  const o2HoursRemaining = ((o2.currentLevelLiters || 8850) / ((o2.burnRateLmin || 44.2) * 60)).toFixed(1);

  // Open Universal Modal with pre-selected item
  const openOrderModal = (category = 'medications', itemId = '') => {
    setOrderCategory(category);
    if (itemId) {
      setSelectedItemId(itemId);
    } else {
      if (category === 'medications') setSelectedItemId(meds[0]?.id || 'med-01');
      else if (category === 'bloodBank') setSelectedItemId(blood[0]?.group || 'O-');
      else if (category === 'consumables') setSelectedItemId(consumables[0]?.id || 'con-01');
      else if (category === 'equipment') setSelectedItemId(equip[0]?.id || 'eq-01');
      else if (category === 'oxygen') setSelectedItemId('liquid_o2_5000');
    }
    setOrderQuantity(category === 'oxygen' ? 5000 : category === 'bloodBank' ? 10 : 50);
    setOrderPriority('Urgent');
    setIsOrderModalOpen(true);
  };

  // Direct 1-Click Quick Reorder for a specific medication
  const handleQuickReorderMed = async (med, amount = 50) => {
    await restockInventory('medications', {
      id: med.id,
      addedStock: amount
    });
    if (createPurchaseOrder) {
      await createPurchaseOrder({
        category: 'Pharmaceuticals',
        itemName: `${med.name} (+${amount} ${med.unit})`,
        quantity: amount,
        unit: med.unit,
        supplier: med.supplier || 'Primary Medical Logistics',
        priority: 'Urgent',
        eta: '45 mins'
      });
    }
    showToast(`Ordered +${amount} ${med.unit} of ${med.name}. Inventory replenished!`);
  };

  // Direct 1-Click Quick Reorder for a blood group
  const handleQuickReorderBlood = async (bItem, amount = 10) => {
    await restockInventory('bloodBank', {
      group: bItem.group,
      addedUnits: amount
    });
    if (createPurchaseOrder) {
      await createPurchaseOrder({
        category: 'Blood Bank',
        itemName: `${bItem.group} Blood Units (+${amount})`,
        quantity: amount,
        unit: 'Units',
        supplier: 'Red Cross Blood Center Mumbai',
        priority: bItem.group === 'O-' ? 'STAT Emergency' : 'Urgent',
        eta: '30 mins'
      });
    }
    showToast(`Requisitioned +${amount} Units of ${bItem.group} Blood from Red Cross.`);
  };

  // Direct 1-Click Refill for Oxygen
  const handleRefillOxygen = async (liters = 5000) => {
    const newLiters = Math.min(10000, (o2.currentLevelLiters || 8850) + liters);
    const newPercentage = Number(((newLiters / 10000) * 100).toFixed(1));
    await restockInventory('oxygen', {
      currentLevelLiters: newLiters,
      tankPercentage: newPercentage,
      pressurePSI: Math.min(950, Math.round(newPercentage * 9.8))
    });
    if (createPurchaseOrder) {
      await createPurchaseOrder({
        category: 'Oxygen Reserves',
        itemName: `Liquid Cryogenic Oxygen Refill (+${liters} L)`,
        quantity: liters,
        unit: 'Liters',
        supplier: 'Praxair Cryogenics India',
        priority: 'STAT Emergency',
        eta: '60 mins'
      });
    }
    showToast(`Bulk Cryogenic Tanker dispatched: +${liters} Liters added to main O2 storage!`);
  };

  // Direct 1-Click Restock for Oxygen Cylinders
  const handleRestockCylinders = async (type = 'HType', count = 20) => {
    const key = type === 'HType' ? 'reserveCylindersHType' : 'portableCylindersEType';
    const current = o2[key] || 40;
    await restockInventory('oxygen', {
      [key]: current + count
    });
    if (createPurchaseOrder) {
      await createPurchaseOrder({
        category: 'Oxygen Cylinders',
        itemName: `${type === 'HType' ? 'H-Type Manifold' : 'E-Type Ambulatory'} O2 Cylinders (+${count})`,
        quantity: count,
        unit: 'Cylinders',
        supplier: 'Mumbai Industrial Gases',
        priority: 'Standard',
        eta: '2 hours'
      });
    }
    showToast(`Added +${count} ${type === 'HType' ? 'H-Type' : 'E-Type'} Oxygen Cylinders to reserve manifold.`);
  };

  // Direct 1-Click Quick Reorder for Consumables
  const handleQuickReorderConsumable = async (con, amount = 25) => {
    await restockInventory('consumables', {
      id: con.id,
      addedUnits: amount
    });
    if (createPurchaseOrder) {
      await createPurchaseOrder({
        category: 'Consumables',
        itemName: `${con.name} (+${amount} ${con.unit})`,
        quantity: amount,
        unit: con.unit,
        supplier: con.supplier || 'Hospital Supplies Corp',
        priority: 'Standard',
        eta: '1 hour'
      });
    }
    showToast(`Ordered +${amount} ${con.unit} of ${con.name}.`);
  };

  // Equipment Fleet Action: Add extra unit
  const handleProcureEquipment = async (item, units = 2) => {
    await restockInventory('equipment', {
      id: item.id,
      addedUnits: units
    });
    if (createPurchaseOrder) {
      await createPurchaseOrder({
        category: 'Clinical Equipment',
        itemName: `${item.type} (+${units} Units)`,
        quantity: units,
        unit: 'Units',
        supplier: item.supplier || 'MedTech Solutions',
        priority: 'Urgent',
        eta: '3 hours'
      });
    }
    showToast(`Procured +${units} ${item.type} units for emergency readiness.`);
  };

  // Submit Universal Modal Order
  const handleExecuteUniversalOrder = async () => {
    setIsSubmitting(true);
    try {
      let itemName = '';
      let unit = 'Units';
      let supplier = supplierName;

      if (orderCategory === 'medications') {
        const med = meds.find(m => m.id === selectedItemId);
        if (med) {
          itemName = med.name;
          unit = med.unit;
          supplier = supplier || med.supplier || 'Primary Pharma Distribution';
          await restockInventory('medications', {
            id: med.id,
            addedStock: Number(orderQuantity)
          });
        }
      } else if (orderCategory === 'bloodBank') {
        const b = blood.find(item => item.group === selectedItemId);
        if (b) {
          itemName = `${b.group} Whole Blood / PRBC`;
          unit = 'Units';
          supplier = supplier || 'Red Cross Blood Center Mumbai';
          await restockInventory('bloodBank', {
            group: b.group,
            addedUnits: Number(orderQuantity)
          });
        }
      } else if (orderCategory === 'oxygen') {
        if (selectedItemId === 'liquid_o2_5000' || selectedItemId === 'liquid_o2_2500') {
          const ltr = selectedItemId === 'liquid_o2_5000' ? 5000 : 2500;
          itemName = `Liquid Medical Oxygen Bulk Tanker (${ltr} L)`;
          unit = 'Liters';
          supplier = supplier || 'Praxair Cryogenics India';
          await handleRefillOxygen(ltr);
        } else {
          const isH = selectedItemId === 'cyl_h_type';
          itemName = `${isH ? 'H-Type High-Pressure' : 'E-Type Portable'} Oxygen Cylinders`;
          unit = 'Cylinders';
          supplier = supplier || 'Mumbai Industrial Gases';
          await handleRestockCylinders(isH ? 'HType' : 'EType', Number(orderQuantity));
        }
      } else if (orderCategory === 'consumables') {
        const con = consumables.find(c => c.id === selectedItemId);
        if (con) {
          itemName = con.name;
          unit = con.unit;
          supplier = supplier || con.supplier || 'Hospital Surgical Logistics';
          await restockInventory('consumables', {
            id: con.id,
            addedUnits: Number(orderQuantity)
          });
        }
      } else if (orderCategory === 'equipment') {
        const eq = equip.find(e => e.id === selectedItemId);
        if (eq) {
          itemName = eq.type;
          unit = 'Units';
          supplier = supplier || eq.supplier || 'MedEquip Global';
          await restockInventory('equipment', {
            id: eq.id,
            addedUnits: Number(orderQuantity)
          });
        }
      }

      if (createPurchaseOrder && itemName) {
        await createPurchaseOrder({
          category: orderCategory.toUpperCase(),
          itemName: `${itemName} (+${orderQuantity} ${unit})`,
          quantity: Number(orderQuantity),
          unit,
          supplier: supplier || 'Approved Medical Vendor',
          priority: orderPriority,
          eta: orderPriority === 'STAT Emergency' ? '25 mins' : orderPriority === 'Urgent' ? '1-2 hrs' : '24 hrs'
        });
      }

      showToast(`Purchase order generated for ${orderQuantity} ${unit} of ${itemName}!`);
      setIsOrderModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Medications
  const filteredMeds = useMemo(() => {
    return meds.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            m.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'critical') return m.status === 'CRITICAL_LOW' || m.currentStock <= m.minThreshold;
      if (statusFilter === 'warning') return m.status === 'LOW_WARNING';
      if (statusFilter === 'healthy') return m.status === 'NORMAL';
      return true;
    });
  }, [meds, searchQuery, statusFilter]);

  // Filtered Consumables
  const filteredConsumables = useMemo(() => {
    return consumables.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === 'critical') return c.status === 'CRITICAL_LOW';
      if (statusFilter === 'warning') return c.status === 'LOW_WARNING';
      if (statusFilter === 'healthy') return c.status === 'NORMAL';
      return true;
    });
  }, [consumables, searchQuery, statusFilter]);

  return (
    <div className="space-y-8 lg:space-y-10 w-full pb-16">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl shadow-emerald-950/20 text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header & Quick Action Bar */}
      <GlassCard className="border-emerald-500/20 bg-gradient-to-r from-emerald-50/50 via-white to-cyan-50/50 p-7 sm:p-8 rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3.5">
              <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading flex items-center gap-2.5">
                  Hospital Supply & Procurement Hub
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Telemetry
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Order, restock, and monitor medical gases, emergency pharmaceuticals, blood reserves, and equipment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                restockAllMedications();
                showToast('All low & critical medications restocked to maximum capacity!');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Restock All Meds
            </button>

            <button
              onClick={() => {
                restockAllBlood();
                showToast('All blood bank groups replenished to safe reserve levels!');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
            >
              <Droplet className="w-4 h-4 text-rose-600" />
              Replenish Blood Bank
            </button>

            <ActionButton
              icon={ShoppingCart}
              onClick={() => openOrderModal('medications')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-700/20 px-5 py-2.5 text-sm font-bold rounded-xl"
            >
              + Place Supply Order
            </ActionButton>
          </div>
        </div>

        {/* High-Level Telemetry KPI Ribbon (Spacious & Large) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-5 border-t border-slate-100">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-1">
              <span className="font-semibold">O2 Cryo Reserves</span>
              <Wind className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">{o2.tankPercentage || 88.5}%</span>
              <span className="text-xs text-cyan-700 font-bold">{o2HoursRemaining}h run time</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">{o2.currentLevelLiters?.toLocaleString() || '8,850'} / 10,000 L</span>
              <button
                onClick={() => handleRefillOxygen(5000)}
                className="text-xs font-bold text-cyan-600 hover:text-cyan-800 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                + Refill <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-1">
              <span className="font-semibold">Pharmacy Stock</span>
              <Pill className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">{meds.length} SKUs</span>
              {criticalMedsCount > 0 ? (
                <span className="text-xs text-rose-600 font-bold">{criticalMedsCount} Critical</span>
              ) : (
                <span className="text-xs text-emerald-600 font-bold">Safe</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">{warningMedsCount} warning zone</span>
              <button
                onClick={() => openOrderModal('medications')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                + Order <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-1">
              <span className="font-semibold">Blood Bank</span>
              <Droplet className="w-4 h-4 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">{totalBloodUnits} Units</span>
              {criticalBloodCount > 0 ? (
                <span className="text-xs text-rose-600 font-bold">{criticalBloodCount} Shortage</span>
              ) : (
                <span className="text-xs text-emerald-600 font-bold">Adequate</span>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">8 Blood Types Monitored</span>
              <button
                onClick={() => openOrderModal('bloodBank', 'O-')}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                + Dispatch <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500 mb-1">
              <span className="font-semibold">Critical Equipment</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                {equip.reduce((a, c) => a + (c.available || 0), 0)} Free
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {equip.reduce((a, c) => a + (c.inUse || 0), 0)} In-Use
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">Ventilators & Monitors</span>
              <button
                onClick={() => openOrderModal('equipment')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                + Procure <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </GlassCard>
      {/* Navigation Tabs and Quick Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Supplies', count: meds.length + blood.length + consumables.length },
            { id: 'medications', label: '💊 Pharmaceuticals', count: meds.length },
            { id: 'oxygen', label: '💨 Oxygen & Gases', count: null },
            { id: 'blood', label: '🩸 Blood Bank', count: blood.length },
            { id: 'equipment', label: '🩺 Equipment & Consumables', count: equip.length + consumables.length },
            { id: 'orders', label: '📋 Orders Log', count: orders.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200/80 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter items or drugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="critical">Critical Low</option>
            <option value="warning">Low Warning</option>
            <option value="healthy">Normal / Safe</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: OXYGEN & CRYOGENIC RESERVES */}
      {(activeTab === 'all' || activeTab === 'oxygen') && (
        <GlassCard
          title="Medical Oxygen & Cryogenic Reserves"
          subtitle="Real-time telemetry of bulk liquid cryo-tanks, line pressure, burn rates, and cylinder banks"
          className="border-cyan-500/20 bg-gradient-to-br from-cyan-50/20 via-white to-slate-50/40"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-3">
            {/* Main Cryo Tank Status */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-100 text-cyan-800">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Main Vacuum-Insulated Evaporator (VIE Tank)</h3>
                    <p className="text-xs text-slate-500">Liquid Oxygen 10,000 L Cryogenic Reservoir</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatBadge type="success" label="Active Main Supply" />
                  <span className="text-xs font-mono font-bold text-slate-700">99.5% Medical Grade O2</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium">Tank Volume Level</span>
                  <p className="text-2xl font-black font-mono text-slate-900">
                    {(o2.currentLevelLiters || 8850).toLocaleString()} <span className="text-sm font-normal text-slate-500">Liters</span>
                  </p>
                  <ProgressBar value={o2.tankPercentage || 88.5} size="sm" />
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
                    <span>{o2.tankPercentage || 88.5}% Capacity</span>
                    <span>10,000 L Max</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium">Piped Line Pressure</span>
                  <p className="text-2xl font-black font-mono text-emerald-700">
                    {o2.pressurePSI || 885} <span className="text-sm font-normal text-slate-500">PSI</span>
                  </p>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-emerald-800">Regulator Stable (850-920 PSI)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Feeds ICU, ER, Surgical & General Wards</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <span className="text-xs text-slate-500 font-medium">Hospital Burn Rate</span>
                  <p className="text-2xl font-black font-mono text-amber-700">
                    {o2.burnRateLmin || 44.2} <span className="text-sm font-normal text-slate-500">L/min</span>
                  </p>
                  <div className="text-xs text-slate-600 pt-1">
                    <span>Active Vent Circuits: <strong>15</strong></span>
                    <br />
                    <span>High-Flow Cannulas: <strong>22</strong></span>
                  </div>
                </div>
              </div>

              {/* Delivery Actions */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cyan-50/60 p-3.5 rounded-xl border border-cyan-100">
                <div className="text-xs text-cyan-900">
                  <span className="font-semibold">Buffer Duration: </span>
                  <strong className="font-mono font-bold text-slate-900 text-sm">{o2HoursRemaining} Hours</strong>
                  <span className="text-slate-500 ml-1">continuous operation at current burn rate.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRefillOxygen(2500)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-cyan-200 text-cyan-900 hover:bg-cyan-50 shadow-sm transition"
                  >
                    + 2,500 L Delivery
                  </button>
                  <button
                    onClick={() => handleRefillOxygen(5000)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" /> Order Tanker (+5,000 L)
                  </button>
                </div>
              </div>
            </div>

            {/* Cylinder Banks */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>High-Pressure Cylinder Bank</span>
                  <StatBadge type="info" label="Secondary Backup" />
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Automatic failover manifold and patient transport</p>

                <div className="space-y-4 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">H-Type Manifold Cylinders</span>
                      <span className="font-mono font-bold text-slate-900">{o2.reserveCylindersHType || 48} / 60</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={((o2.reserveCylindersHType || 48) / 60) * 100} size="sm" showValue={false} />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[11px]">
                      <span className="text-slate-500">6,900 L per cylinder</span>
                      <button
                        onClick={() => handleRestockCylinders('HType', 20)}
                        className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        + Reorder 20
                      </button>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">E-Type Portable / Ambulatory</span>
                      <span className="font-mono font-bold text-slate-900">{o2.portableCylindersEType || 62} / 80</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={((o2.portableCylindersEType || 62) / 80) * 100} size="sm" showValue={false} />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[11px]">
                      <span className="text-slate-500">680 L for patient transfers</span>
                      <button
                        onClick={() => handleRestockCylinders('EType', 20)}
                        className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        + Reorder 20
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => openOrderModal('oxygen')}
                  className="w-full py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Order Custom Gas Requisition
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* SECTION 2: PHARMACEUTICALS & EMERGENCY MEDICATIONS */}
      {(activeTab === 'all' || activeTab === 'medications') && (
        <GlassCard
          title="Emergency & ICU Pharmaceuticals"
          subtitle="Inventory threshold tracking, vendor pipelines, and instant one-click restocking"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  restockAllMedications();
                  showToast('Replenished all medications to maximum stock levels.');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
              >
                Restock All SKUs
              </button>
              <button
                onClick={() => openOrderModal('medications')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Reorder Drug Batch
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80 font-semibold">
                  <th className="py-3 px-3.5 rounded-l-lg">Medication & Dosage</th>
                  <th className="py-3 px-3">Therapeutic Category</th>
                  <th className="py-3 px-3 text-center">Current Stock</th>
                  <th className="py-3 px-3 text-center">Min. Threshold</th>
                  <th className="py-3 px-3">Stock Meter</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3 text-right rounded-r-lg">Quick Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeds.map((med) => {
                  const capacity = med.maxCapacity || 150;
                  const percent = Math.min(100, Math.round((med.currentStock / capacity) * 100));
                  const isCrit = med.status === 'CRITICAL_LOW' || med.currentStock <= med.minThreshold;
                  const isWarn = med.status === 'LOW_WARNING';

                  return (
                    <tr
                      key={med.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCrit ? 'bg-rose-50/30' : isWarn ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {med.id}</span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                          {med.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className={`text-sm font-bold ${
                          isCrit ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {med.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">{med.unit}</span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                        {med.minThreshold} {med.unit}
                      </td>

                      <td className="py-3.5 px-3 w-36">
                        <div className="space-y-1">
                          <ProgressBar
                            value={percent}
                            size="sm"
                            showValue={false}
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                            <span>{percent}%</span>
                            <span>Max: {capacity}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <StatBadge
                          type={isCrit ? 'critical' : isWarn ? 'warning' : 'success'}
                          label={isCrit ? 'CRITICAL LOW' : isWarn ? 'LOW STOCK' : 'HEALTHY'}
                        />
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                        {med.supplier || 'Cipla Critical Care'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleQuickReorderMed(med, 25)}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 transition"
                            title="Quick order +25 vials"
                          >
                            +25
                          </button>
                          <button
                            onClick={() => handleQuickReorderMed(med, 50)}
                            className="px-2 py-1 text-[11px] font-bold rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 transition"
                            title="Quick order +50 vials"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => openOrderModal('medications', med.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-0.5"
                          >
                            Order <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* SECTION 3: BLOOD BANK & PLASMA RESERVES */}
      {(activeTab === 'all' || activeTab === 'blood') && (
        <GlassCard
          title="Blood Bank & Plasma Reserves"
          subtitle="Real-time unit tracking for all 8 blood groups with direct Red Cross dispatch integration"
          className="border-rose-500/20"
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  restockAllBlood();
                  showToast('Replenished all blood bank groups to safe operational reserves!');
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 transition shadow-sm"
              >
                Replenish All Groups
              </button>
              <button
                onClick={() => openOrderModal('bloodBank', 'O-')}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-1"
              >
                <Droplet className="w-3.5 h-3.5" /> Emergency O- Dispatch
              </button>
            </div>
          }
        >
          {/* Temperature & Storage Protocol Notice */}
          <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Blood Refrigerator Chambers: <strong>3.8°C (Nominal: 2°C - 6°C)</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Universal Donor: <strong className="text-rose-700">O Negative</strong></span>
              <span>Universal Recipient: <strong className="text-slate-900">AB Positive</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {blood.map((b) => {
              const isCrit = b.status === 'CRITICAL' || b.units <= b.minRequired;
              const isLow = b.status === 'LOW';

              return (
                <div
                  key={b.group}
                  className={`p-4 rounded-2xl border text-center space-y-2 transition-all relative overflow-hidden ${
                    isCrit
                      ? 'bg-rose-50/80 border-rose-300 text-rose-950 shadow-sm'
                      : isLow
                      ? 'bg-amber-50/60 border-amber-300 text-amber-950 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {b.group === 'O-' && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-600 text-white">
                      Universal
                    </span>
                  )}

                  <div className="flex items-center justify-center gap-1.5 pt-1">
                    <Droplet className={`w-4 h-4 ${isCrit ? 'text-rose-600 fill-rose-600' : 'text-rose-500'}`} />
                    <span className="font-black text-lg font-heading">{b.group}</span>
                  </div>

                  <div>
                    <p className="text-3xl font-black font-mono tracking-tight">{b.units}</p>
                    <p className="text-[11px] opacity-75 font-medium mt-0.5">
                      Min Req: <strong className="font-mono">{b.minRequired}</strong> Units
                    </p>
                  </div>

                  <div className="pt-1">
                    <StatBadge
                      type={isCrit ? 'critical' : isLow ? 'warning' : 'success'}
                      label={isCrit ? 'CRITICAL SHORTAGE' : isLow ? 'LOW RESERVE' : 'ADEQUATE'}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleQuickReorderBlood(b, 5)}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                      title="Quick request 5 units"
                    >
                      +5 Units
                    </button>
                    <button
                      onClick={() => handleQuickReorderBlood(b, 10)}
                      className="px-2 py-1 text-[10px] font-bold rounded bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                      title="Quick request 10 units"
                    >
                      +10 Units
                    </button>
                    <button
                      onClick={() => openOrderModal('bloodBank', b.group)}
                      className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition"
                      title="Custom Red Cross requisition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* SECTION 4: CLINICAL CONSUMABLES & MEDICAL EQUIPMENT */}
      {(activeTab === 'all' || activeTab === 'equipment') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medical Equipment Readiness */}
          <GlassCard
            title="Biomedical Equipment Readiness"
            subtitle="Operational ventilators, patient monitors, infusion pumps, and defibrillators"
            action={
              <button
                onClick={() => openOrderModal('equipment')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Procure Units
              </button>
            }
          >
            <div className="space-y-3 mt-3">
              {equip.map((item) => {
                const utilRate = Number(((item.inUse / item.total) * 100).toFixed(0));
                return (
                  <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{item.type}</span>
                        <p className="text-[10px] text-slate-400">{item.supplier || 'Medical Systems'}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-cyan-700 text-sm">{item.inUse}</span>
                        <span className="text-slate-400"> / {item.total} in use</span>
                      </div>
                    </div>

                    <ProgressBar value={utilRate} size="sm" showValue={false} />

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-3">
                        <span>Available: <strong className="text-emerald-700 font-mono">{item.available} units</strong></span>
                        {item.maintenance > 0 && (
                          <span className="text-amber-700 font-medium">Maint: <strong>{item.maintenance}</strong></span>
                        )}
                        <span className="text-slate-400">Util: <strong>{utilRate}%</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleProcureEquipment(item, 1)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                        >
                          +1 Unit
                        </button>
                        <button
                          onClick={() => handleProcureEquipment(item, 2)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition"
                        >
                          +2 Units
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Clinical Consumables & Surgical Trauma Supplies */}
          <GlassCard
            title="Clinical Consumables & Trauma Packs"
            subtitle="Sterile burn packs, IV access cannulas, endotracheal kits, and PPE"
            action={
              <button
                onClick={() => openOrderModal('consumables')}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Order Supplies
              </button>
            }
          >
            <div className="space-y-3 mt-3">
              {filteredConsumables.map((con) => {
                const percent = Math.min(100, Math.round((con.currentStock / (con.maxCapacity || 300)) * 100));
                const isCrit = con.status === 'CRITICAL_LOW' || con.currentStock <= con.minThreshold;
                const isWarn = con.status === 'LOW_WARNING';

                return (
                  <div key={con.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{con.name}</div>
                        <span className="text-[10px] text-slate-400">{con.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">{con.currentStock}</span>
                        <span className="text-[10px] text-slate-400 ml-1">{con.unit}</span>
                      </div>
                    </div>

                    <ProgressBar value={percent} size="sm" showValue={false} />

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="flex items-center gap-2">
                        <StatBadge
                          type={isCrit ? 'critical' : isWarn ? 'warning' : 'success'}
                          label={isCrit ? 'CRITICAL' : isWarn ? 'LOW' : 'STOCKED'}
                        />
                        <span className="text-slate-400">Min: {con.minThreshold} {con.unit}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickReorderConsumable(con, 25)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                        >
                          +25
                        </button>
                        <button
                          onClick={() => handleQuickReorderConsumable(con, 50)}
                          className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          +50
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      )}

      {/* SECTION 5: PURCHASE ORDERS & PROCUREMENT TRACKING LOG */}
      {(activeTab === 'all' || activeTab === 'orders') && (
        <GlassCard
          title="Procurement & Requisition Order History"
          subtitle="Real-time purchase order dispatch ledger, ETA status, and vendor tracking"
          action={
            <ActionButton icon={FileText} onClick={() => openOrderModal('medications')}>
              Generate New PO
            </ActionButton>
          }
        >
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 font-semibold">
                  <th className="py-2.5 px-3 rounded-l-lg">PO Number</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3">Supplier / Vendor</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">ETA / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => (
                  <tr key={po.id || po.poNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {po.poNumber}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {po.itemName}
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">
                        {po.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {po.quantity} {po.unit}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {po.supplier}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        po.priority === 'STAT Emergency'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : po.priority === 'Urgent'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {po.priority}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <StatBadge
                        type={po.status === 'DELIVERED' ? 'success' : po.status === 'IN_TRANSIT' ? 'info' : 'warning'}
                        label={po.status}
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-500 text-[11px]">
                      {po.eta || '30 mins'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* UNIVERSAL MULTI-CATEGORY ORDER MODAL */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Hospital Supply Order & Requisition"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleExecuteUniversalOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting PO...' : 'Confirm & Generate PO'}
            </ActionButton>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Category Tabs inside Modal */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Supply Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'medications', label: '💊 Pharmaceuticals' },
                { id: 'oxygen', label: '💨 Medical O2' },
                { id: 'bloodBank', label: '🩸 Blood Bank' },
                { id: 'consumables', label: '🩹 Consumables' },
                { id: 'equipment', label: '🩺 Equipment' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setOrderCategory(cat.id);
                    if (cat.id === 'medications') {
                      setSelectedItemId(meds[0]?.id || 'med-01');
                      setOrderQuantity(50);
                    } else if (cat.id === 'bloodBank') {
                      setSelectedItemId(blood[0]?.group || 'O-');
                      setOrderQuantity(10);
                    } else if (cat.id === 'oxygen') {
                      setSelectedItemId('liquid_o2_5000');
                      setOrderQuantity(5000);
                    } else if (cat.id === 'consumables') {
                      setSelectedItemId(consumables[0]?.id || 'con-01');
                      setOrderQuantity(25);
                    } else if (cat.id === 'equipment') {
                      setSelectedItemId(equip[0]?.id || 'eq-01');
                      setOrderQuantity(2);
                    }
                  }}
                  className={`py-2 px-1 text-center rounded-lg border font-semibold text-[11px] transition ${
                    orderCategory === cat.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Item Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Select Item / Resource
            </label>

            {orderCategory === 'medications' && (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full input-glass bg-white"
              >
                {meds.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — Current: {m.currentStock} {m.unit} (Min: {m.minThreshold})
                  </option>
                ))}
              </select>
            )}

            {orderCategory === 'bloodBank' && (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full input-glass bg-white"
              >
                {blood.map((b) => (
                  <option key={b.group} value={b.group}>
                    Blood Group {b.group} — Current: {b.units} Units (Min: {b.minRequired})
                  </option>
                ))}
              </select>
            )}

            {orderCategory === 'oxygen' && (
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  if (e.target.value === 'liquid_o2_5000') setOrderQuantity(5000);
                  else if (e.target.value === 'liquid_o2_2500') setOrderQuantity(2500);
                  else setOrderQuantity(20);
                }}
                className="w-full input-glass bg-white"
              >
                <option value="liquid_o2_5000">Liquid Cryogenic Oxygen Bulk Refill (5,000 Liters)</option>
                <option value="liquid_o2_2500">Liquid Cryogenic Oxygen Half Refill (2,500 Liters)</option>
                <option value="cyl_h_type">H-Type High-Pressure Manifold Cylinders (Bank of 20)</option>
                <option value="cyl_e_type">E-Type Portable Patient Transport Cylinders (Bank of 20)</option>
              </select>
            )}

            {orderCategory === 'consumables' && (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full input-glass bg-white"
              >
                {consumables.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — Current: {c.currentStock} {c.unit} (Min: {c.minThreshold})
                  </option>
                ))}
              </select>
            )}

            {orderCategory === 'equipment' && (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full input-glass bg-white"
              >
                {equip.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.type} — Fleet: {eq.total} units ({eq.available} free, {eq.inUse} in use)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity Input with Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">Order Quantity / Units</label>
              <div className="flex items-center gap-1">
                {[10, 25, 50, 100].map(qty => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setOrderQuantity(qty)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-mono text-slate-700"
                  >
                    +{qty}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full input-glass font-mono bg-white"
              min={1}
            />
          </div>

          {/* Urgency / Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dispatch Priority</label>
              <select
                value={orderPriority}
                onChange={(e) => setOrderPriority(e.target.value)}
                className="w-full input-glass bg-white"
              >
                <option value="STAT Emergency">STAT Emergency (30 mins)</option>
                <option value="Urgent">Urgent (1 - 2 hours)</option>
                <option value="Standard">Standard Routine (24 hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned Vendor / Depo</label>
              <input
                type="text"
                placeholder="Auto-assigned medical vendor"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full input-glass bg-white"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-slate-600">
            <div className="flex justify-between font-medium">
              <span>Estimated Delivery Window:</span>
              <strong className="text-slate-900">
                {orderPriority === 'STAT Emergency' ? '25 - 40 Minutes' : orderPriority === 'Urgent' ? '1 - 2 Hours' : 'Next Morning'}
              </strong>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Procurement Protocol:</span>
              <span>Hospital Credit Line (PO will be logged immediately)</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
