import React, { useState, useMemo } from 'react';
import { P2HFormRecord, VehicleUnit, AppSettings } from '../types/p2h';
import { 
  Zap, 
  Truck, 
  ClipboardList, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  BarChart3, 
  BatteryCharging, 
  Battery, 
  FileText, 
  Download, 
  Filter, 
  RefreshCcw, 
  Activity,
  User,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

interface DashboardViewProps {
  vehicles: VehicleUnit[];
  records: P2HFormRecord[];
  settings: AppSettings;
  onNavigate: (nav: 'dashboard' | 'p2h' | 'log' | 'charging_log' | 'units' | 'account' | 'settings') => void;
  onCreateP2H: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vehicles,
  records,
  settings,
  onNavigate,
  onCreateP2H
}) => {
  // Filters & State
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(9); // Default: Oktober (9, 0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [chartViewMode, setChartViewMode] = useState<'daily' | 'infographic3d'>('daily');

  // Available vehicle list for dropdown
  const unitList = useMemo(() => {
    const list = vehicles.map(v => v.unitNumber);
    return Array.from(new Set(list));
  }, [vehicles]);

  // Robust string-based date filtering immune to timezone shifts
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Unit filter
      if (selectedUnit !== 'all' && r.unitNumber !== selectedUnit) return false;
      
      // Clean date string YYYY-MM-DD
      const cleanDate = (r.date || '').split('T')[0].trim();
      const parts = cleanDate.split('-');
      if (parts.length < 3) return false;

      const rYear = parseInt(parts[0], 10);
      const rMonth = parseInt(parts[1], 10) - 1; // 0-indexed

      return rMonth === selectedMonth && rYear === selectedYear;
    });
  }, [records, selectedUnit, selectedMonth, selectedYear]);

  // KPI Metrics calculated strictly from filtered records
  const totalKwh = filteredRecords.reduce((acc, r) => acc + (r.energyConsumedKwh || 0), 0);
  const totalKm = filteredRecords.reduce((acc, r) => acc + (r.totalKm || 0), 0);
  const totalCo2 = filteredRecords.reduce((acc, r) => acc + (r.co2ReductionKg || 0), 0);
  const totalSavings = filteredRecords.reduce((acc, r) => acc + (r.costSavingsIdr || 0), 0);
  const approvedCount = filteredRecords.filter(r => r.overallStatus === 'approved').length;

  // 1 Calendar Month (Days 1 to DaysInMonth) Dynamic Data Grid
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  }, [selectedYear, selectedMonth]);

  const monthName = useMemo(() => {
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return names[selectedMonth] || 'Oktober';
  }, [selectedMonth]);

  // Daily aggregated metrics array for the entire calendar month (1..daysInMonth)
  const monthlyData = useMemo(() => {
    const daysArr = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const targetDateStr = `${selectedYear}-${monthStr}-${dayStr}`;

      const dayRecords = filteredRecords.filter(r => {
        const cleanDate = (r.date || '').split('T')[0].trim();
        return cleanDate === targetDateStr;
      });

      const kwh = dayRecords.reduce((acc, r) => acc + (r.energyConsumedKwh || 0), 0);
      const km = dayRecords.reduce((acc, r) => acc + (r.totalKm || 0), 0);
      const chargingKwh = dayRecords.reduce((acc, r) => acc + (r.charging?.energyAddedKwh || 0), 0);
      const savings = dayRecords.reduce((acc, r) => acc + (r.costSavingsIdr || 0), 0);

      daysArr.push({
        dayNumber: day,
        dateStr: targetDateStr,
        kwh: Number(kwh.toFixed(1)),
        km: km,
        chargingKwh: Number(chargingKwh.toFixed(1)),
        savings: savings,
        count: dayRecords.length,
        records: dayRecords
      });
    }

    return daysArr;
  }, [daysInMonth, selectedMonth, selectedYear, filteredRecords]);

  // Max scale for chart rendering
  const maxKwhInMonth = useMemo(() => {
    const maxKwh = Math.max(...monthlyData.map(d => d.kwh), 10);
    const maxChg = Math.max(...monthlyData.map(d => d.chargingKwh), 10);
    const max = Math.max(maxKwh, maxChg);
    return Math.ceil(max * 1.2);
  }, [monthlyData]);

  const maxKmInMonth = useMemo(() => {
    const max = Math.max(...monthlyData.map(d => d.km), 50);
    return Math.ceil(max * 1.25);
  }, [monthlyData]);

  // CSV Export
  const handleDownloadCsv = () => {
    const headers = ['Tanggal', 'Unit', 'Total Form P2H', 'Konsumsi Energi (kWh)', 'Jarak Tempuh (KM)', 'Pengisian Charging (kWh)'];
    const rows = monthlyData.map(d => [
      `"${d.dateStr}"`,
      `"${selectedUnit === 'all' ? 'Semua Unit' : selectedUnit}"`,
      d.count,
      d.kwh,
      d.km,
      d.chargingKwh
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grafik_P2H_JAC_T9_${selectedUnit}_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Color Spectrum Gradient Array for 3D Bars (matching image_ad2baef6.png)
  const spectrumGradients = [
    'from-rose-600 via-rose-500 to-amber-400',
    'from-orange-600 via-orange-500 to-yellow-300',
    'from-amber-600 via-yellow-500 to-emerald-300',
    'from-emerald-600 via-emerald-400 to-cyan-300',
    'from-teal-600 via-cyan-500 to-sky-300',
    'from-sky-600 via-blue-500 to-indigo-300',
    'from-indigo-600 via-purple-500 to-rose-300'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans w-full overflow-x-hidden">
      
      {/* 1. SLIM & SLEEK WELCOME BANNER FOR MULIABARA (RAMPING) */}
      <div 
        className="rounded-2xl py-3.5 px-5 sm:px-6 text-white relative overflow-hidden shadow-xl border border-white/20"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-md shadow-2xs border border-white/30">
                F-QHSE-OPS-MOB-09 · JAC T9 EV FLEET
              </span>
              <span className="text-[10px] font-semibold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                CATL 88.02 kWh
              </span>
            </div>

            <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight drop-shadow-xs">
              Dashboard Analitik Fleet {settings.companyName || 'MULIABARA'}
            </h1>
            
            <p className="text-xs text-white/90 font-medium leading-tight">
              Monitoring real-time keselamatan inspeksi P2H, telemetri baterai 88.02 kWh CATL, estimasi jarak tempuh WLTP 330 KM, serta efisiensi konsumsi energi seluruh unit armada.
            </p>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTION CARDS (DESKTOP ONLY - HIDDEN ON MOBILE AS REQUESTED) */}
      <div className="hidden sm:block space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
            Navigasi Cepat Modul Utama
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Pilih modul untuk berpindah tampilan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Card 1: Buat P2H Baru */}
          <div
            onClick={onCreateP2H}
            className="group relative bg-white/90 hover:bg-sky-50/90 backdrop-blur-xl border border-sky-200/80 hover:border-sky-400 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-slate-900 block truncate group-hover:text-sky-600 transition-colors">
                Formulir P2H Baru
              </span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                Inspeksi Pra-Operasi
              </span>
            </div>
          </div>

          {/* Card 2: Log P2H */}
          <div
            onClick={() => onNavigate('log')}
            className="group relative bg-white/90 hover:bg-purple-50/90 backdrop-blur-xl border border-purple-200/80 hover:border-purple-400 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900 block truncate group-hover:text-purple-600 transition-colors">
                  Log P2H
                </span>
                <span className="text-[9px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 rounded-full shrink-0">
                  {records.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                Riwayat & Export PDF
              </span>
            </div>
          </div>

          {/* Card 3: Log EV Charging */}
          <div
            onClick={() => onNavigate('charging_log')}
            className="group relative bg-white/90 hover:bg-emerald-50/90 backdrop-blur-xl border border-emerald-200/80 hover:border-emerald-400 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <BatteryCharging className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-slate-900 block truncate group-hover:text-emerald-600 transition-colors">
                Log EV Charging
              </span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                Pengisian Baterai CATL
              </span>
            </div>
          </div>

          {/* Card 4: Daftar Unit */}
          <div
            onClick={() => onNavigate('units')}
            className="group relative bg-white/90 hover:bg-amber-50/90 backdrop-blur-xl border border-amber-200/80 hover:border-amber-400 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900 block truncate group-hover:text-amber-600 transition-colors">
                  Daftar Unit
                </span>
                <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 rounded-full shrink-0">
                  {vehicles.length}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                Status Armada EV
              </span>
            </div>
          </div>

          {/* Card 5: Manajemen Akun */}
          <div
            onClick={() => onNavigate('account')}
            className="group relative bg-white/90 hover:bg-indigo-50/90 backdrop-blur-xl border border-indigo-200/80 hover:border-indigo-400 rounded-xl p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex items-center gap-2.5 col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                Manajemen Akun
              </span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                Hak Akses User
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KPI METRICS CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-bold block">Total Unit EV</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-slate-900">{vehicles.length}</span>
            <Truck className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold block truncate">JAC T9 4x4 Double Cabin</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-bold block">Dokumen P2H Terpilih</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-slate-900">{filteredRecords.length}</span>
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-[9px] text-sky-700 font-semibold block truncate">{approvedCount} disetujui resmi</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-bold block">Konsumsi Energi</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-sky-600">{totalKwh.toFixed(1)} <span className="text-[10px]">kWh</span></span>
            <Zap className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-[9px] text-slate-500 font-semibold block truncate">Baterai CATL 88.02 kWh</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-bold block">Jarak Tempuh</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-emerald-700">{totalKm} <span className="text-[10px]">KM</span></span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold block truncate">Akumulasi Odometer</span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-1">
          <span className="text-[10px] text-slate-500 font-bold block">Hemat Biaya vs Diesel</span>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-black font-mono text-emerald-700">Rp {totalSavings.toLocaleString('id-ID')}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[9px] text-teal-600 font-semibold block truncate">{totalCo2.toFixed(1)} kg CO₂ tereduksi</span>
        </div>
      </div>

      {/* 4. GRAFIK HARIAN 1 BULAN KALENDER & INFOGRAFIK 3D TELEMETRI */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
        
        {/* Header & Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-sky-700 bg-sky-50 px-2 sm:px-2.5 py-0.5 rounded border border-sky-200">
                F-QHSE-OPS-MOB-09 · TELEMETRY MONITORING
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                Data Aktual Telemetri Armada JAC T9 EV
              </span>
            </div>
            <h2 className="text-base sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {chartViewMode === 'daily' 
                ? `Grafik Penggunaan Energi (kWh) & Jarak Tempuh (KM) - ${monthName} ${selectedYear}`
                : `Infografik 3D Telemetri Fleet & EV Charging - ${monthName} ${selectedYear}`}
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
              {chartViewMode === 'daily'
                ? `Grafik harian selama 1 bulan kalender (Hari 1 s/d ${daysInMonth}) berdasarkan data aktual formulir P2H JAC T9 EV.`
                : 'Visualisasi pilar 3D isometrik: Konsumsi Energi (01), Jarak Tempuh (02), Pengisian Daya Charging EV (03), dan Efisiensi Biaya (04).'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setChartViewMode('daily')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] sm:text-xs ${
                  chartViewMode === 'daily'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Grafik Harian</span>
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('infographic3d')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[11px] sm:text-xs ${
                  chartViewMode === 'infographic3d'
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Infografik 3D</span>
              </button>
            </div>

            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              title="Unduh Data Grafik dalam Format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Bar: Unit Selector & Month/Year Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3.5 bg-slate-50 text-slate-800 rounded-2xl text-xs border border-slate-200">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Filter Unit */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-bold text-slate-700 hidden sm:inline">Filter Unit:</span>
              <select
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs text-xs"
              >
                <option value="all">⚡ Semua Unit ({vehicles.length})</option>
                {unitList.map(unit => (
                  <option key={unit} value={unit}>🚚 {unit}</option>
                ))}
              </select>
            </div>

            {/* Bulan & Tahun Kalender Selector */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-700 hidden sm:inline">Periode:</span>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs text-xs"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-sky-500 shadow-2xs text-xs"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500">
            Unit: <span className="text-slate-900">{selectedUnit === 'all' ? 'Seluruh Unit' : selectedUnit}</span> · Periode: <span className="text-slate-900">{monthName} {selectedYear}</span>
          </div>
        </div>

        {/* ========================================================
            VIEW MODE 1: 1-MONTH DAILY CALENDAR CHART (PRIMARY)
            ======================================================== */}
        {chartViewMode === 'daily' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Cyber Dark Canvas Container matching reference image */}
            <div className="relative bg-[#050c18] text-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-sky-950/80 shadow-2xl overflow-hidden font-sans">
              
              {/* Dual Y-Axis Indicator Top Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]"></span>
                    <span className="font-bold text-sky-300">Y1: kWh Energi (Max {maxKwhInMonth} kWh)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
                    <span className="font-bold text-emerald-400">Y2: Jarak Tempuh (Max {maxKmInMonth} KM)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
                    <span className="font-bold text-amber-300">EV Charging (kWh)</span>
                  </div>
                </div>

                <div className="text-amber-400 font-bold tracking-wider">
                  {monthName} {selectedYear} ({selectedUnit === 'all' ? 'Semua Unit' : selectedUnit})
                </div>
              </div>

              {/* Fully Responsive SVG Canvas (No horizontal scroll on Mobile, Sleek on PC) */}
              <div className="w-full py-1">
                <div className="w-full h-auto relative">
                  {(() => {
                    const svgW = 920;
                    const svgH = 250;
                    const padLeft = 25;
                    const padRight = 20;
                    const padTop = 20;
                    const padBottom = 40;
                    const graphW = svgW - padLeft - padRight;
                    const graphH = svgH - padTop - padBottom;
                    const stepX = graphW / (daysInMonth - 1 || 1);

                    // Compute points for daily curves
                    const kwhPoints: { x: number; y: number; day: number; val: number; records: any[] }[] = [];
                    const kmPoints: { x: number; y: number; day: number; val: number; records: any[] }[] = [];
                    const chgPoints: { x: number; y: number; day: number; val: number; records: any[] }[] = [];

                    monthlyData.forEach((d, idx) => {
                      const x = padLeft + idx * stepX;
                      const yKwh = padTop + graphH - (d.kwh / (maxKwhInMonth || 1)) * graphH;
                      const yKm = padTop + graphH - (d.km / (maxKmInMonth || 1)) * graphH;
                      const yChg = padTop + graphH - (d.chargingKwh / (maxKwhInMonth || 1)) * graphH;

                      kwhPoints.push({ x, y: yKwh, day: d.dayNumber, val: d.kwh, records: d.records });
                      kmPoints.push({ x, y: yKm, day: d.dayNumber, val: d.km, records: d.records });
                      chgPoints.push({ x, y: yChg, day: d.dayNumber, val: d.chargingKwh, records: d.records });
                    });

                    // Build smooth SVG paths
                    const buildSmoothPath = (pts: { x: number; y: number }[]) => {
                      if (pts.length === 0) return '';
                      let path = `M ${pts[0].x},${pts[0].y}`;
                      for (let i = 0; i < pts.length - 1; i++) {
                        const p0 = pts[i];
                        const p1 = pts[i + 1];
                        const cpX = (p0.x + p1.x) / 2;
                        path += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
                      }
                      return path;
                    };

                    const kwhLinePath = buildSmoothPath(kwhPoints);
                    const kmLinePath = buildSmoothPath(kmPoints);
                    const chgLinePath = buildSmoothPath(chgPoints);

                    const kwhAreaPath = `${kwhLinePath} L ${padLeft + (daysInMonth - 1) * stepX},${padTop + graphH} L ${padLeft},${padTop + graphH} Z`;
                    const kmAreaPath = `${kmLinePath} L ${padLeft + (daysInMonth - 1) * stepX},${padTop + graphH} L ${padLeft},${padTop + graphH} Z`;
                    const chgAreaPath = `${chgLinePath} L ${padLeft + (daysInMonth - 1) * stepX},${padTop + graphH} L ${padLeft},${padTop + graphH} Z`;

                    return (
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-auto max-h-[300px] sm:max-h-[250px] overflow-visible font-sans select-none">
                        <defs>
                          {/* Neon Glow Filters */}
                          <filter id="neon-blue-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="neon-green-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>
                          <filter id="neon-orange-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                            <feMerge>
                              <feMergeNode in="blur" />
                              <feMergeNode in="SourceGraphic" />
                            </feMerge>
                          </filter>

                          {/* Gradient fills */}
                          <linearGradient id="kwh-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="km-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="chg-area-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                          const y = padTop + graphH * ratio;
                          return (
                            <line
                              key={i}
                              x1={padLeft}
                              y1={y}
                              x2={padLeft + graphW}
                              y2={y}
                              stroke="#1e293b"
                              strokeDasharray={ratio === 1 ? undefined : "3 4"}
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Day Column Slots & Highlights */}
                        {monthlyData.map((d, i) => {
                          const x = padLeft + i * stepX;
                          const hasData = d.kwh > 0 || d.km > 0 || d.chargingKwh > 0;
                          const isHovered = hoveredDay === d.dayNumber;

                          return (
                            <g 
                              key={d.dayNumber}
                              className="cursor-pointer group"
                              onMouseEnter={() => setHoveredDay(d.dayNumber)}
                              onMouseLeave={() => setHoveredDay(null)}
                              onClick={() => setHoveredDay(d.dayNumber)}
                            >
                              {/* Background Slot Pillar */}
                              <rect
                                x={x - 8}
                                y={padTop}
                                width={16}
                                height={graphH}
                                rx="6"
                                fill={isHovered ? "rgba(56, 189, 248, 0.15)" : hasData ? "rgba(255, 255, 255, 0.04)" : "rgba(15, 23, 42, 0.3)"}
                                stroke={isHovered ? "#38bdf8" : hasData ? "rgba(56, 189, 248, 0.3)" : "rgba(255, 255, 255, 0.05)"}
                                strokeWidth="1"
                              />

                              {/* Day Label at Bottom */}
                              <text
                                x={x}
                                y={padTop + graphH + 20}
                                textAnchor="middle"
                                fill={hasData ? (isHovered ? "#38bdf8" : "#ffffff") : "#64748b"}
                                fontSize="11"
                                fontWeight={hasData ? "800" : "500"}
                                className="font-mono select-none"
                              >
                                {d.dayNumber}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Gradients Under Neon Curves */}
                        <path d={chgAreaPath} fill="url(#chg-area-grad)" />
                        <path d={kmAreaPath} fill="url(#km-area-grad)" />
                        <path d={kwhAreaPath} fill="url(#kwh-area-grad)" />

                        {/* Neon Smooth Line Curves */}
                        <path
                          d={chgLinePath}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          filter="url(#neon-orange-glow)"
                        />
                        <path
                          d={kmLinePath}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          filter="url(#neon-green-glow)"
                        />
                        <path
                          d={kwhLinePath}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          filter="url(#neon-blue-glow)"
                        />

                        {/* Data Points on Curves for Days with Telemetry */}
                        {kwhPoints.map((pt, i) => {
                          const kmPt = kmPoints[i];
                          const chgPt = chgPoints[i];
                          const hasData = pt.val > 0 || kmPt.val > 0 || chgPt.val > 0;
                          if (!hasData) return null;

                          const isHovered = hoveredDay === pt.day;

                          return (
                            <g key={pt.day} className="cursor-pointer" onClick={() => setHoveredDay(pt.day)}>
                              {/* EV Charging Point (Orange Neon Dot) */}
                              {chgPt.val > 0 && (
                                <circle
                                  cx={chgPt.x}
                                  cy={chgPt.y}
                                  r={isHovered ? "7" : "5"}
                                  fill="#d97706"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  className="transition-all drop-shadow-[0_0_6px_#fbbf24]"
                                />
                              )}

                              {/* Energy Point (Blue Neon Dot) */}
                              {pt.val > 0 && (
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isHovered ? "7" : "5"}
                                  fill="#0284c7"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  className="transition-all drop-shadow-[0_0_6px_#38bdf8]"
                                />
                              )}

                              {/* Distance Point (Green Neon Dot) */}
                              {kmPt.val > 0 && (
                                <circle
                                  cx={kmPt.x}
                                  cy={kmPt.y}
                                  r={isHovered ? "7" : "5"}
                                  fill="#059669"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  className="transition-all drop-shadow-[0_0_6px_#34d399]"
                                />
                              )}

                              {/* Floating Badge with Exact Numbers */}
                              <g transform={`translate(${pt.x}, ${Math.min(pt.y, kmPt.y, chgPt.y) - 18})`}>
                                <rect
                                  x="-48"
                                  y="-12"
                                  width="96"
                                  height="18"
                                  rx="5"
                                  fill="#0f172a"
                                  stroke={chgPt.val > 0 ? "#f59e0b" : "#38bdf8"}
                                  strokeWidth="1"
                                  opacity="0.95"
                                />
                                <text
                                  x="0"
                                  y="0"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fill={chgPt.val > 0 ? "#fbbf24" : "#38bdf8"}
                                  fontSize="9"
                                  fontWeight="800"
                                  className="font-mono select-none"
                                >
                                  {pt.val}kWh · {kmPt.val}KM{chgPt.val > 0 ? ` · ${chgPt.val}⚡` : ''}
                                </text>
                              </g>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom Telemetry Summary Bar inside Canvas */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Total Energi:</span>
                    <strong className="text-sky-400 font-extrabold text-sm">{totalKwh.toFixed(1)} kWh</strong>
                  </div>
                  <span className="text-slate-600">·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Total Jarak:</span>
                    <strong className="text-emerald-400 font-extrabold text-sm">{totalKm} KM</strong>
                  </div>
                  <span className="text-slate-600">·</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Total Charging:</span>
                    <strong className="text-amber-400 font-extrabold text-sm">
                      {monthlyData.reduce((acc, d) => acc + d.chargingKwh, 0).toFixed(1)} kWh
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">Rata-rata Efisiensi:</span>
                  <span className="text-white font-black text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {totalKm > 0 ? (totalKwh / totalKm).toFixed(3) : '0.000'} kWh/KM
                  </span>
                </div>
              </div>
            </div>

            {/* Hovered / Clicked Day Details Card */}
            {hoveredDay !== null && (() => {
              const dayData = monthlyData.find(d => d.dayNumber === hoveredDay);
              if (!dayData) return null;

              return (
                <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-sky-600 text-white rounded font-bold font-mono">
                        Tanggal: {dayData.dateStr}
                      </span>
                      <span className="font-bold text-slate-800">
                        {dayData.count > 0 ? `${dayData.count} Formulir P2H Tercatat` : 'Tidak Ada Aktivitas Beroperasi'}
                      </span>
                    </div>
                    {dayData.records && dayData.records.length > 0 ? (
                      <p className="text-slate-600">
                        Unit: <strong>{dayData.records.map((r: any) => r.unitNumber).join(', ')}</strong> · Driver:{' '}
                        <strong>{dayData.records.map((r: any) => r.operatorName).join(', ')}</strong> · Shift:{' '}
                        <strong>{dayData.records.map((r: any) => r.shift).join(', ')}</strong>
                      </p>
                    ) : (
                      <p className="text-slate-500">Unit dalam posisi standby di workshop / pool basecamp.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono">
                    <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-sans">Energi</span>
                      <span className="font-extrabold text-sky-700 text-sm">{dayData.kwh} kWh</span>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-sans">Jarak</span>
                      <span className="font-extrabold text-emerald-700 text-sm">{dayData.km} KM</span>
                    </div>
                    <div className="text-center px-3 py-1.5 bg-white rounded-xl border border-sky-100 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-sans">Charging</span>
                      <span className="font-extrabold text-amber-700 text-sm">{dayData.chargingKwh} kWh</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================
            VIEW MODE 2: 3D ISOMETRIC COLUMNS INFOGRAPHIC (IMAGE 3)
            ======================================================== */}
        {chartViewMode === 'infographic3d' && (
          <div className="relative bg-gradient-to-b from-slate-50/80 via-white to-slate-100/50 rounded-2xl p-6 border border-slate-200 shadow-inner overflow-hidden">
          
          {/* Subtle World Map / Grid Background Silhouette */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-full object-cover">
              <path d="M150,150 Q180,100 240,120 T350,160 T420,130 T500,170 T650,140 T780,160 T900,120 Q920,200 880,260 T750,300 T600,280 T480,320 T320,290 T180,270 Z" fill="#334155" />
              <path d="M200,340 Q250,320 300,350 T380,420 T260,450 T180,380 Z" fill="#334155" />
              <path d="M700,330 Q780,310 820,360 T790,430 T690,400 Z" fill="#334155" />
            </svg>
          </div>

          {/* Isometric 3D Columns Chart Component */}
          {(() => {
            // Dynamic actual calculations from active records
            const chargingKwhTotal = filteredRecords.reduce((acc, r) => acc + (r.charging?.energyAddedKwh || 0), 0);
            const chargingSessionsCount = filteredRecords.filter(r => r.charging && (r.charging.percentCharged > 0 || r.charging.energyAddedKwh > 0)).length;
            const chargingSocAvg = chargingSessionsCount > 0 
              ? Math.round(filteredRecords.reduce((acc, r) => acc + (r.charging?.percentCharged || 0), 0) / chargingSessionsCount)
              : 0;
            const chargingEstRange = filteredRecords.reduce((acc, r) => acc + (r.charging?.estimatedRangeKm || 0), 0) || Math.round(chargingKwhTotal / 0.245);
            const chargingCostPln = Math.round(chargingKwhTotal * 2475);

            // Dynamic heights for 3D pillars
            const height01 = totalKwh > 0 ? Math.max(50, Math.min(320, Math.round((totalKwh / Math.max(totalKwh, totalKm / 4, chargingKwhTotal, 1)) * 260))) : 40;
            const height02 = totalKm > 0 ? Math.max(50, Math.min(320, Math.round((totalKm / Math.max(totalKm, 1)) * 260))) : 40;
            const height03 = chargingKwhTotal > 0 ? Math.max(50, Math.min(320, Math.round((chargingKwhTotal / Math.max(chargingKwhTotal, totalKwh, 1)) * 260))) : 40;
            const height04 = totalSavings > 0 ? 300 : 40;

            // 4 Pillars Configuration
            const pillars = [
              {
                id: '01',
                number: '01',
                label: 'KONSUMSI ENERGI',
                subtitle: `${totalKwh.toFixed(1)} kWh Terpakai (CATL 88.02 kWh)`,
                percentage: `${totalKwh > 0 ? Math.min(Math.round((totalKwh / 250) * 100), 100) : 0}%`,
                value: `${totalKwh.toFixed(1)} kWh`,
                height: height01,
                cx: 140,
                colorHex: '#ef4444',
                gradientLeft: 'url(#grad-red-left)',
                gradientRight: 'url(#grad-red-right)',
                colorTop: '#fca5a5'
              },
              {
                id: '02',
                number: '02',
                label: 'JARAK TEMPUH',
                subtitle: `${totalKm} KM Akumulasi Odometer`,
                percentage: `${totalKm > 0 ? Math.min(Math.round((totalKm / 1000) * 100), 100) : 0}%`,
                value: `${totalKm} KM`,
                height: height02,
                cx: 350,
                colorHex: '#f97316',
                gradientLeft: 'url(#grad-orange-left)',
                gradientRight: 'url(#grad-orange-right)',
                colorTop: '#fdba74'
              },
              {
                id: '03',
                number: '03',
                label: 'CHARGING EV',
                subtitle: `${chargingKwhTotal.toFixed(1)} kWh Terisi (${chargingSessionsCount} Sesi SPKLU)`,
                percentage: `+${chargingSocAvg}%`,
                value: `${chargingKwhTotal.toFixed(1)} kWh`,
                height: height03,
                cx: 560,
                colorHex: '#0284c7',
                gradientLeft: 'url(#grad-blue-left)',
                gradientRight: 'url(#grad-blue-right)',
                colorTop: '#7dd3fc'
              },
              {
                id: '04',
                number: '04',
                label: 'EFISIENSI BIAYA',
                subtitle: `Rp ${totalSavings.toLocaleString('id-ID')} Hemat vs Diesel`,
                percentage: `${totalKm > 0 ? (totalKwh / totalKm).toFixed(3) : '0.000'}`,
                value: `Rp ${totalSavings.toLocaleString('id-ID')}`,
                height: height04,
                cx: 770,
                colorHex: '#9333ea',
                gradientLeft: 'url(#grad-purple-left)',
                gradientRight: 'url(#grad-purple-right)',
                colorTop: '#d8b4fe'
              }
            ];

            const baseY = 400;
            const halfW = 54;
            const dh = 20;

            return (
              <div className="w-full py-1">
                <div className="w-full h-auto relative">
                  <svg viewBox="0 0 920 480" preserveAspectRatio="xMidYMid meet" className="w-full h-auto max-h-[380px] sm:max-h-[320px] overflow-visible font-sans">
                    <defs>
                      {/* Pillar 01: Red Gradients */}
                      <linearGradient id="grad-red-left" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                      <linearGradient id="grad-red-right" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#b91c1c" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </linearGradient>

                      {/* Pillar 02: Orange Gradients */}
                      <linearGradient id="grad-orange-left" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb923c" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="grad-orange-right" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#c2410c" />
                      </linearGradient>

                      {/* Pillar 03: Blue Gradients (Charging EV) */}
                      <linearGradient id="grad-blue-left" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id="grad-blue-right" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0369a1" />
                        <stop offset="100%" stopColor="#075985" />
                      </linearGradient>

                      {/* Pillar 04: Purple Gradients */}
                      <linearGradient id="grad-purple-left" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#9333ea" />
                      </linearGradient>
                      <linearGradient id="grad-purple-right" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7e22ce" />
                        <stop offset="100%" stopColor="#6b21a8" />
                      </linearGradient>

                      {/* Soft Shadow Filter */}
                      <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
                        <feOffset dx="0" dy="8" result="offsetblur" />
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.15" />
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Ground Reference Grid Lines */}
                    <line x1="40" y1={baseY + dh + 10} x2="880" y2={baseY + dh + 10} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

                    {/* Render each 3D Isometric Pillar */}
                    {pillars.map((col, idx) => {
                      const topY = baseY - col.height;
                      const cx = col.cx;

                      return (
                        <g key={col.id} className="transition-all duration-500">
                          {/* Ground Reflection / Soft Base Shadow */}
                          <ellipse
                            cx={cx}
                            cy={baseY + 2 * dh + 5}
                            rx={halfW + 18}
                            ry={14}
                            fill="#000000"
                            opacity="0.1"
                            filter="blur(5px)"
                          />

                          {/* 3D Pillar Group with Shadow */}
                          <g filter="url(#soft-shadow)">
                            {/* Left Front Face */}
                            <polygon
                              points={`${cx - halfW},${topY + dh} ${cx},${topY + 2 * dh} ${cx},${baseY + 2 * dh} ${cx - halfW},${baseY + dh}`}
                              fill={col.gradientLeft}
                              stroke="#ffffff"
                              strokeWidth="0.5"
                            />

                            {/* Right Front Face */}
                            <polygon
                              points={`${cx},${topY + 2 * dh} ${cx + halfW},${topY + dh} ${cx + halfW},${baseY + dh} ${cx},${baseY + 2 * dh}`}
                              fill={col.gradientRight}
                              stroke="#ffffff"
                              strokeWidth="0.5"
                            />

                            {/* Top Diamond Face (Highlighted) */}
                            <polygon
                              points={`${cx},${topY} ${cx + halfW},${topY + dh} ${cx},${topY + 2 * dh} ${cx - halfW},${topY + dh}`}
                              fill={col.colorTop}
                              stroke="#ffffff"
                              strokeWidth="0.8"
                            />

                            {/* Number on Left Face (01, 02, 03, 04) */}
                            <text
                              x={cx - halfW + 14}
                              y={baseY + dh - 16}
                              fill="#ffffff"
                              fontSize="32"
                              fontWeight="900"
                              opacity="0.95"
                              transform={`rotate(-14, ${cx - halfW + 14}, ${baseY + dh - 16})`}
                              className="font-sans select-none tracking-tight"
                            >
                              {col.number}
                            </text>
                          </g>

                          {/* Center Node Dot on Top Diamond Face */}
                          <circle cx={cx} cy={topY + dh} r="5" fill="#1e293b" />
                          <circle cx={cx} cy={topY + dh} r="2.5" fill="#ffffff" />

                          {/* Diagonal Callout Pointer Line to Stat */}
                          <polyline
                            points={`${cx},${topY + dh} ${cx - 35},${topY - 30} ${cx - 75},${topY - 30}`}
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="1.5"
                          />

                          {/* Callout Indicator Node */}
                          <circle cx={cx - 75} cy={topY - 30} r="2" fill="#64748b" />

                          {/* Callout Metric & Percentage Display */}
                          <g transform={`translate(${cx - 78}, ${topY - 32})`}>
                            {/* Big Bold Metric Percentage */}
                            <text
                              x="0"
                              y="-6"
                              textAnchor="end"
                              fill={col.colorHex}
                              fontSize="32"
                              fontWeight="900"
                              className="font-sans select-none tracking-tight"
                            >
                              {col.percentage}
                            </text>

                            {/* Primary Metric Value */}
                            <text
                              x="0"
                              y="12"
                              textAnchor="end"
                              fill="#0f172a"
                              fontSize="13"
                              fontWeight="800"
                              className="font-sans select-none"
                            >
                              {col.value}
                            </text>

                            {/* Subtitle Description */}
                            <text
                              x="0"
                              y="25"
                              textAnchor="end"
                              fill="#64748b"
                              fontSize="9.5"
                              fontWeight="600"
                              className="font-sans select-none"
                            >
                              {col.label}
                            </text>
                          </g>

                          {/* Bottom Legend on Ground */}
                          <g transform={`translate(${cx}, ${baseY + 2 * dh + 30})`}>
                            <rect x="-45" y="-10" width="12" height="12" rx="2" fill={col.colorHex} />
                            <text
                              x="-26"
                              y="0"
                              fill="#0f172a"
                              fontSize="11"
                              fontWeight="800"
                              className="font-sans select-none uppercase tracking-wide"
                            >
                              {col.label}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            );
          })()}
          </div>
        )}

          {/* KETERANGAN LENGKAP CHARGING EV (DYNAMICAL ACTUAL DATA) */}
          {(() => {
            const chargingKwhTotal = filteredRecords.reduce((acc, r) => acc + (r.charging?.energyAddedKwh || 0), 0);
            const chargingSessionsCount = filteredRecords.filter(r => r.charging && (r.charging.percentCharged > 0 || r.charging.energyAddedKwh > 0)).length;
            const chargingSocAvg = chargingSessionsCount > 0 
              ? Math.round(filteredRecords.reduce((acc, r) => acc + (r.charging?.percentCharged || 0), 0) / chargingSessionsCount)
              : 0;
            const chargingEstRange = filteredRecords.reduce((acc, r) => acc + (r.charging?.estimatedRangeKm || 0), 0) || Math.round(chargingKwhTotal / 0.245);
            const chargingCostPln = Math.round(chargingKwhTotal * 2475);

            return (
              <div className="mt-4 pt-5 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></span>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <BatteryCharging className="w-4 h-4 text-sky-600" />
                      Keterangan Analitik Charging EV (Pengisian Daya SPKLU)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                    TARIF RESMI SPKLU Rp 2.475 / kWh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold">Total kWh Terisi</span>
                      <Zap className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-sky-800">
                      {chargingKwhTotal.toFixed(1)} <span className="text-xs">kWh</span>
                    </div>
                    <span className="text-[10px] text-sky-700 block">Akumulasi pengisian fast charging ({chargingSessionsCount} Sesi)</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold">Rata-rata SOC Baterai</span>
                      <Battery className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-800">
                      +{chargingSocAvg}% <span className="text-xs">SOC</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block">Baterai CATL 88.02 kWh LFP</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold">Tambahan Jarak Jelajah</span>
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-amber-800">
                      ~{chargingEstRange} <span className="text-xs">KM</span>
                    </div>
                    <span className="text-[10px] text-amber-700 block">Estimasi radius jelajah bertambah</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold">Total Biaya Listrik PLN</span>
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-xl font-black font-mono text-purple-800">
                      Rp {chargingCostPln.toLocaleString('id-ID')}
                    </div>
                    <span className="text-[10px] text-purple-700 block">Hemat hingga 68% dibanding solar</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      {/* 5. OFFICIAL JAC T9 EV SPECIFICATIONS FOOTER CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600" />
            Spesifikasi Otentik Telemetri JAC T9 EV 4x4 Double Cabin (Standard Pabrikan)
          </h3>
          <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
            JAC MOTORS GLOBAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-slate-500 font-bold block text-[11px]">Kapasitas Baterai Utama</span>
            <span className="text-sm font-black text-slate-900 font-mono">88.02 kWh</span>
            <span className="text-[10px] text-sky-700 block font-medium">CATL LFP (Lithium Iron Phosphate)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-slate-500 font-bold block text-[11px]">Jarak Tempuh WLTP</span>
            <span className="text-sm font-black text-slate-900 font-mono">330 - 340 KM</span>
            <span className="text-[10px] text-emerald-700 block font-medium">Per perikatan penuh 100% SOC</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-slate-500 font-bold block text-[11px]">Daya Fast Charging DC</span>
            <span className="text-sm font-black text-slate-900 font-mono">80 kW (CCS2)</span>
            <span className="text-[10px] text-amber-700 block font-medium">30% ke 80% dalam 35 Menit</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-slate-500 font-bold block text-[11px]">Laju Efisiensi Nominal</span>
            <span className="text-sm font-black text-slate-900 font-mono">0.245 kWh / KM</span>
            <span className="text-[10px] text-teal-700 block font-medium">Standar Medan Operasional Tambang</span>
          </div>
        </div>
      </div>

    </div>
  );
};
