import { P2HFormRecord, VehicleUnit, MaintenanceLog } from '../types/p2h';

export const INITIAL_VEHICLES: VehicleUnit[] = [
  {
    id: 'veh_1',
    unitNumber: 'LV-EV-01',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8142 JQ',
    vin: 'LJ13A9B26P0019283',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 12480,
    currentSoc: 82,
    cumulativeKwh: 2860,
    lastServiceKwh: 1500,
    nextServiceKwh: 3000,
    status: 'operating',
    assignedDriver: 'Budi Santoso',
    location: 'Pit Utara - Mining Sector A',
    skoExpiry: '2026-12-15'
  },
  {
    id: 'veh_2',
    unitNumber: 'LV-EV-02',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8143 JQ',
    vin: 'LJ13A9B26P0019284',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 5120,
    currentSoc: 94,
    cumulativeKwh: 1180,
    lastServiceKwh: 0,
    nextServiceKwh: 1500,
    status: 'ready',
    assignedDriver: 'Ahmad Fauzi',
    location: 'Central Workshop - Main Yard',
    skoExpiry: '2027-02-28'
  },
  {
    id: 'veh_3',
    unitNumber: 'LV-EV-03',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8145 JQ',
    vin: 'LJ13A9B26P0019287',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 26800,
    currentSoc: 76,
    cumulativeKwh: 6150,
    lastServiceKwh: 3000,
    nextServiceKwh: 6000,
    status: 'maintenance_due',
    assignedDriver: 'Rudi Hermawan',
    location: 'ROM Pad Hauling Road KM 12',
    skoExpiry: '2026-11-20'
  },
  {
    id: 'veh_4',
    unitNumber: 'LV-EV-04',
    model: 'JAC T9 EV 4x4 Double Cabin',
    plateNumber: 'KT 8148 JQ',
    vin: 'LJ13A9B26P0019290',
    batteryCapacityKwh: 88.02,
    currentOdoKm: 8950,
    currentSoc: 88,
    cumulativeKwh: 2040,
    lastServiceKwh: 1500,
    nextServiceKwh: 3000,
    status: 'ready',
    assignedDriver: 'Dedi Kurniawan',
    location: 'Port Terminal Jetty 2',
    skoExpiry: '2027-01-10'
  }
];

export const INITIAL_P2H_RECORDS: P2HFormRecord[] = [
  {
    id: 'p2h-2026-001',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-25T07:15:00.000Z',
    updatedAt: '2026-10-25T07:15:00.000Z',
    operatorName: 'Budi Santoso',
    operatorNik: 'OP-7821',
    date: '2026-10-25',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Pit Utara Area Hauling 01',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-01',
    skoExpiryDate: '2026-12-15',
    
    startKm: 12360,
    endKm: 12480,
    startSoc: 98,
    endSoc: 64,
    batteryCapacityKwh: 88.02,
    
    totalKm: 120,
    batteryUsedPercent: 34,
    energyConsumedKwh: 29.93,
    consumptionRateKwhPerKm: 0.249,
    costSavingsIdr: 166800,
    co2ReductionKg: 28.5,
    charging: {
      percentCharged: 60,
      energyAddedKwh: 52.8,
      estimatedRangeKm: 198,
      chargingLocation: 'SPKLU Pit Utara Station 01'
    },

    driverCondition: {
      idCardExpiry: '2027-08-14',
      simperExpiry: '2027-05-20',
      items: {
        drv_1: 'ya',
        drv_2: 'ya',
        drv_3a: 'ya',
        drv_3b: 'ya',
        drv_3c: 'ya',
        drv_3d: 'ya',
        drv_4: 'ya',
        drv_5: 'ya'
      },
      notes: {}
    },

    inspections: {
      crit_1: { status: 'normal', notes: 'SOC awal 98% terisi penuh semalam' },
      crit_2: { status: 'normal', notes: 'Skid plate bersih dan baut pelindung utuh' },
      crit_3: { status: 'normal', notes: 'Level coolant di garis MAX' },
      crit_4: { status: 'normal', notes: 'Lampu READY hijau, tegangan 348V' },
      crit_5: { status: 'normal', notes: 'Cluster meter digital responsif' },
      crit_6: { status: 'normal', notes: 'Tekanan ban depan 36 PSI, belakang 38 PSI' },
      crit_7: { status: 'normal', notes: 'Rem regeneratif level High berfungsi baik' },
      crit_8: { status: 'normal' },
      crit_9: { status: 'normal' },
      crit_10: { status: 'normal' },
      crit_11: { status: 'normal' },
      crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' },
      crit_13_2: { status: 'normal' },
      crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal', notes: 'Rotary amber menyala terang' },
      crit_15: { status: 'normal', notes: 'Buggy whip 3 meter lampu ujung aktif' },
      crit_16: { status: 'normal' },
      crit_17: { status: 'normal', notes: 'Channel 16 Safety Pit jernih' },
      crit_18: { status: 'normal', notes: 'APAR 2kg jarum di zona hijau' },
      crit_19: { status: 'normal', notes: 'Seal soket CCS2 kedap dan kering' },
      crit_20: { status: 'normal' },
      crit_21_1: { status: 'normal' },
      crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' },
      crit_22: { status: 'normal', notes: '2 unit cone tersedia di bak' },
      crit_23: { status: 'normal', notes: '2 unit wheel chocks tersedia' },
      non_1: { status: 'normal' },
      non_2: { status: 'normal' },
      non_3: { status: 'normal', notes: 'Segel kotak P3K utuh' },
      non_4: { status: 'normal', notes: 'Semua panah wheel nut simetris' }
    },

    overallStatus: 'pending_approval',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,

    mechanicRecommendation: {
      status: 'pending',
      reason: 'Semua item periksa kritis dalam kondisi baik dan laik operasi.',
      mechanicName: '',
      mechanicNik: ''
    },

    foremanApproval: {
      status: 'pending',
      notes: '',
      foremanName: '',
      foremanNik: ''
    },

    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,50 Q40,10 80,40 T150,30 T190,60" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-25 07:15 WITA'
    }
  },
  {
    id: 'p2h-2026-002',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-24T06:50:00.000Z',
    updatedAt: '2026-10-24T07:20:00.000Z',
    operatorName: 'Ahmad Fauzi',
    operatorNik: 'OP-6190',
    date: '2026-10-24',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Main Hauling Road KM 0-25',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-02',
    skoExpiryDate: '2027-02-28',
    
    startKm: 5010,
    endKm: 5120,
    startSoc: 96,
    endSoc: 68,
    batteryCapacityKwh: 88.02,
    
    totalKm: 110,
    batteryUsedPercent: 28,
    energyConsumedKwh: 24.65,
    consumptionRateKwhPerKm: 0.224,
    costSavingsIdr: 157300,
    co2ReductionKg: 24.2,
    charging: {
      percentCharged: 75,
      energyAddedKwh: 66.0,
      estimatedRangeKm: 247,
      chargingLocation: 'SPKLU Central Workshop'
    },

    driverCondition: {
      idCardExpiry: '2028-01-10',
      simperExpiry: '2027-09-15',
      items: {
        drv_1: 'ya',
        drv_2: 'ya',
        drv_3a: 'ya',
        drv_3b: 'ya',
        drv_3c: 'ya',
        drv_3d: 'ya',
        drv_4: 'ya',
        drv_5: 'ya'
      },
      notes: {}
    },

    inspections: {
      crit_1: { status: 'normal' },
      crit_2: { status: 'normal' },
      crit_3: { status: 'normal' },
      crit_4: { status: 'normal' },
      crit_5: { status: 'normal' },
      crit_6: { status: 'normal' },
      crit_7: { status: 'normal' },
      crit_8: { status: 'normal' },
      crit_9: { status: 'normal' },
      crit_10: { status: 'normal' },
      crit_11: { status: 'normal' },
      crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' },
      crit_13_2: { status: 'normal' },
      crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' },
      crit_15: { status: 'normal' },
      crit_16: { status: 'normal' },
      crit_17: { status: 'normal' },
      crit_18: { status: 'normal' },
      crit_19: { status: 'normal' },
      crit_20: { status: 'normal' },
      crit_21_1: { status: 'normal' },
      crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' },
      crit_22: { status: 'normal' },
      crit_23: { status: 'normal' },
      non_1: { status: 'abnormal', notes: 'Karet wiper sebelah kiri sedikit robek di ujung, air washer lancar' },
      non_2: { status: 'normal' },
      non_3: { status: 'normal' },
      non_4: { status: 'normal' }
    },

    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: true,

    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Wiper kiri agak robek namun sapuan kaca masih jelas. Spare part wiper sudah diorder, unit diizinkan tetap beroperasi (perbaikan terjadwal dalam 1x24 jam).',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20,60 C50,20 80,70 120,30 S170,50 190,40" fill="none" stroke="%2316a34a" stroke-width="3"/></svg>',
      recommendedAt: '2026-10-24 07:10 WITA'
    },

    foremanApproval: {
      status: 'approved',
      notes: 'Disetujui beroperasi sesuai rekomendasi mekanik. Mohon ganti karet wiper saat pergantian shift sore.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M15,45 Q60,15 95,50 T160,25 T195,55" fill="none" stroke="%230f172a" stroke-width="3"/></svg>',
      approvedAt: '2026-10-24 07:20 WITA'
    },

    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M25,50 Q60,30 90,60 T145,20 T180,45" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-24 06:55 WITA'
    }
  },
  {
    id: 'p2h-2026-003',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-23T18:40:00.000Z',
    updatedAt: '2026-10-23T19:15:00.000Z',
    operatorName: 'Rudi Hermawan',
    operatorNik: 'OP-5520',
    date: '2026-10-23',
    shift: 'Shift 2 (Malam)',
    workLocation: 'Pit Barat & Hauling Road',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-03',
    skoExpiryDate: '2026-11-20',
    
    startKm: 26650,
    endKm: 26800,
    startSoc: 92,
    endSoc: 50,
    batteryCapacityKwh: 88.02,
    
    totalKm: 150,
    batteryUsedPercent: 42,
    energyConsumedKwh: 36.97,
    consumptionRateKwhPerKm: 0.246,
    costSavingsIdr: 215400,
    co2ReductionKg: 35.1,
    charging: {
      percentCharged: 50,
      energyAddedKwh: 44.0,
      estimatedRangeKm: 165,
      chargingLocation: 'SPKLU Hauling Sector B'
    },

    driverCondition: {
      idCardExpiry: '2027-11-30',
      simperExpiry: '2027-04-18',
      items: {
        drv_1: 'ya',
        drv_2: 'ya',
        drv_3a: 'ya',
        drv_3b: 'ya',
        drv_3c: 'ya',
        drv_3d: 'ya',
        drv_4: 'ya',
        drv_5: 'ya'
      },
      notes: {}
    },

    inspections: {
      crit_1: { status: 'normal' },
      crit_2: { status: 'normal' },
      crit_3: { status: 'normal' },
      crit_4: { status: 'normal' },
      crit_5: { status: 'normal' },
      crit_6: { status: 'normal' },
      crit_7: { status: 'normal' },
      crit_8: { status: 'normal' },
      crit_9: { status: 'normal' },
      crit_10: { status: 'normal' },
      crit_11: { status: 'normal' },
      crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' },
      crit_13_2: { status: 'normal' },
      crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' },
      crit_15: { status: 'normal' },
      crit_16: { status: 'normal' },
      crit_17: { status: 'normal' },
      crit_18: { status: 'normal' },
      crit_19: { status: 'normal' },
      crit_20: { status: 'normal' },
      crit_21_1: { status: 'normal' },
      crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' },
      crit_22: { status: 'normal' },
      crit_23: { status: 'normal' },
      non_1: { status: 'normal' },
      non_2: { status: 'normal' },
      non_3: { status: 'normal' },
      non_4: { status: 'normal' }
    },

    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,

    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Unit dalam kondisi prima untuk shift malam.',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109',
      recommendedAt: '2026-10-23 19:00 WITA'
    },

    foremanApproval: {
      status: 'approved',
      notes: 'P2H disetujui, jaga jarak aman konvoi hauling malam hari.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045',
      approvedAt: '2026-10-23 19:15 WITA'
    },

    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,40 Q50,70 110,20 T170,40" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-23 18:45 WITA'
    }
  },
  {
    id: 'p2h-2026-004',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-01T07:00:00.000Z',
    updatedAt: '2026-10-01T07:30:00.000Z',
    operatorName: 'Dedi Kurniawan',
    operatorNik: 'OP-4491',
    date: '2026-10-01',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Port Terminal Jetty 2',
    jobSite: 'Muliabara Mining Project',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-04',
    skoExpiryDate: '2027-01-10',
    startKm: 3400,
    endKm: 3510,
    startSoc: 95,
    endSoc: 65,
    batteryCapacityKwh: 88.02,
    totalKm: 110,
    batteryUsedPercent: 30,
    energyConsumedKwh: 26.4,
    consumptionRateKwhPerKm: 0.24,
    costSavingsIdr: 154000,
    co2ReductionKg: 25.0,
    charging: {
      percentCharged: 85,
      energyAddedKwh: 74.8,
      estimatedRangeKm: 280,
      chargingLocation: 'SPKLU Port Jetty Fast Charger'
    },
    driverCondition: {
      idCardExpiry: '2027-10-15',
      simperExpiry: '2027-08-20',
      items: { drv_1: 'ya', drv_2: 'ya', drv_3a: 'ya', drv_3b: 'ya', drv_3c: 'ya', drv_3d: 'ya', drv_4: 'ya', drv_5: 'ya' },
      notes: {}
    },
    inspections: {
      crit_1: { status: 'normal' },
      crit_2: { status: 'normal' },
      crit_3: { status: 'normal' },
      crit_4: { status: 'normal' },
      crit_5: { status: 'normal' },
      crit_6: { status: 'normal' },
      crit_7: { status: 'normal' },
      crit_8: { status: 'normal' },
      crit_9: { status: 'normal' },
      crit_10: { status: 'normal' },
      crit_11: { status: 'normal' },
      crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' },
      crit_13_2: { status: 'normal' },
      crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' },
      crit_15: { status: 'normal' },
      crit_16: { status: 'normal' },
      crit_17: { status: 'normal' },
      crit_18: { status: 'normal' },
      crit_19: { status: 'normal' },
      crit_20: { status: 'normal' },
      crit_21_1: { status: 'normal' },
      crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' },
      crit_22: { status: 'normal' },
      crit_23: { status: 'normal' },
      non_1: { status: 'normal' },
      non_2: { status: 'normal' },
      non_3: { status: 'normal' },
      non_4: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Baterai dan sistem kelistrikan beroperasi normal.',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'Disetujui beroperasi.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045'
    },
    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,40 Q50,70 110,20 T170,40" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-01 07:05 WITA'
    }
  },
  {
    id: 'p2h-2026-005',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-26T07:10:00.000Z',
    updatedAt: '2026-10-26T07:35:00.000Z',
    operatorName: 'Ir. Bambang Wijaya',
    operatorNik: 'MNG-001',
    date: '2026-10-26',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Pit Central Hauling Route',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-01',
    skoExpiryDate: '2026-12-15',
    startKm: 12480,
    endKm: 12610,
    startSoc: 96,
    endSoc: 60,
    batteryCapacityKwh: 88.02,
    totalKm: 130,
    batteryUsedPercent: 36,
    energyConsumedKwh: 31.68,
    consumptionRateKwhPerKm: 0.244,
    costSavingsIdr: 184500,
    co2ReductionKg: 30.2,
    charging: {
      percentCharged: 66,
      energyAddedKwh: 58.0,
      estimatedRangeKm: 215,
      chargingLocation: 'SPKLU Pit Utara Station 01'
    },
    driverCondition: {
      idCardExpiry: '2028-04-12',
      simperExpiry: '2027-11-20',
      items: { drv_1: 'ya', drv_2: 'ya', drv_3a: 'ya', drv_3b: 'ya', drv_3c: 'ya', drv_3d: 'ya', drv_4: 'ya', drv_5: 'ya' },
      notes: {}
    },
    inspections: {
      crit_1: { status: 'normal' }, crit_2: { status: 'normal' }, crit_3: { status: 'normal' },
      crit_4: { status: 'normal' }, crit_5: { status: 'normal' }, crit_6: { status: 'normal' },
      crit_7: { status: 'normal' }, crit_8: { status: 'normal' }, crit_9: { status: 'normal' },
      crit_10: { status: 'normal' }, crit_11: { status: 'normal' }, crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' }, crit_13_2: { status: 'normal' }, crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' }, crit_15: { status: 'normal' }, crit_16: { status: 'normal' },
      crit_17: { status: 'normal' }, crit_18: { status: 'normal' }, crit_19: { status: 'normal' },
      crit_20: { status: 'normal' }, crit_21_1: { status: 'normal' }, crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' }, crit_22: { status: 'normal' }, crit_23: { status: 'normal' },
      non_1: { status: 'normal' }, non_2: { status: 'normal' }, non_3: { status: 'normal' }, non_4: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Sistem High Voltage dan pendingin baterai bekerja optimal.',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'P2H disetujui untuk operasional pengawasan tambang.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045'
    },
    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,50 Q40,10 80,40 T150,30 T190,60" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-26 07:15 WITA'
    }
  },
  {
    id: 'p2h-2026-006',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-27T06:45:00.000Z',
    updatedAt: '2026-10-27T07:15:00.000Z',
    operatorName: 'Ahmad Fauzi',
    operatorNik: 'OP-6190',
    date: '2026-10-27',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Main Hauling Road KM 10',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-02',
    skoExpiryDate: '2027-02-28',
    startKm: 5120,
    endKm: 5235,
    startSoc: 98,
    endSoc: 68,
    batteryCapacityKwh: 88.02,
    totalKm: 115,
    batteryUsedPercent: 30,
    energyConsumedKwh: 26.4,
    consumptionRateKwhPerKm: 0.229,
    costSavingsIdr: 161000,
    co2ReductionKg: 25.1,
    charging: {
      percentCharged: 70,
      energyAddedKwh: 61.6,
      estimatedRangeKm: 230,
      chargingLocation: 'SPKLU Central Workshop'
    },
    driverCondition: {
      idCardExpiry: '2028-01-10',
      simperExpiry: '2027-09-15',
      items: { drv_1: 'ya', drv_2: 'ya', drv_3a: 'ya', drv_3b: 'ya', drv_3c: 'ya', drv_3d: 'ya', drv_4: 'ya', drv_5: 'ya' },
      notes: {}
    },
    inspections: {
      crit_1: { status: 'normal' }, crit_2: { status: 'normal' }, crit_3: { status: 'normal' },
      crit_4: { status: 'normal' }, crit_5: { status: 'normal' }, crit_6: { status: 'normal' },
      crit_7: { status: 'normal' }, crit_8: { status: 'normal' }, crit_9: { status: 'normal' },
      crit_10: { status: 'normal' }, crit_11: { status: 'normal' }, crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' }, crit_13_2: { status: 'normal' }, crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' }, crit_15: { status: 'normal' }, crit_16: { status: 'normal' },
      crit_17: { status: 'normal' }, crit_18: { status: 'normal' }, crit_19: { status: 'normal' },
      crit_20: { status: 'normal' }, crit_21_1: { status: 'normal' }, crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' }, crit_22: { status: 'normal' }, crit_23: { status: 'normal' },
      non_1: { status: 'normal' }, non_2: { status: 'normal' }, non_3: { status: 'normal' }, non_4: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Wiper baru terpasang sempurna, siap operasi pit.',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'Disetujui beroperasi.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045'
    },
    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M25,50 Q60,30 90,60 T145,20 T180,45" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-27 06:50 WITA'
    }
  },
  {
    id: 'p2h-2026-007',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-28T06:30:00.000Z',
    updatedAt: '2026-10-28T07:05:00.000Z',
    operatorName: 'Ir. Bambang Wijaya',
    operatorNik: 'MNG-001',
    date: '2026-10-28',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Pit Barat & Hauling Road KM 18',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-03',
    skoExpiryDate: '2026-11-20',
    startKm: 26800,
    endKm: 26945,
    startSoc: 95,
    endSoc: 55,
    batteryCapacityKwh: 88.02,
    totalKm: 145,
    batteryUsedPercent: 40,
    energyConsumedKwh: 35.2,
    consumptionRateKwhPerKm: 0.242,
    costSavingsIdr: 205000,
    co2ReductionKg: 33.4,
    charging: {
      percentCharged: 62,
      energyAddedKwh: 54.5,
      estimatedRangeKm: 205,
      chargingLocation: 'SPKLU Hauling Sector B'
    },
    driverCondition: {
      idCardExpiry: '2027-11-30',
      simperExpiry: '2027-04-18',
      items: { drv_1: 'ya', drv_2: 'ya', drv_3a: 'ya', drv_3b: 'ya', drv_3c: 'ya', drv_3d: 'ya', drv_4: 'ya', drv_5: 'ya' },
      notes: {}
    },
    inspections: {
      crit_1: { status: 'normal' }, crit_2: { status: 'normal' }, crit_3: { status: 'normal' },
      crit_4: { status: 'normal' }, crit_5: { status: 'normal' }, crit_6: { status: 'normal' },
      crit_7: { status: 'normal' }, crit_8: { status: 'normal' }, crit_9: { status: 'normal' },
      crit_10: { status: 'normal' }, crit_11: { status: 'normal' }, crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' }, crit_13_2: { status: 'normal' }, crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' }, crit_15: { status: 'normal' }, crit_16: { status: 'normal' },
      crit_17: { status: 'normal' }, crit_18: { status: 'normal' }, crit_19: { status: 'normal' },
      crit_20: { status: 'normal' }, crit_21_1: { status: 'normal' }, crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' }, crit_22: { status: 'normal' }, crit_23: { status: 'normal' },
      non_1: { status: 'normal' }, non_2: { status: 'normal' }, non_3: { status: 'normal' }, non_4: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Suhu baterai CATL stabil di 29 derajat celcius.',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'Disetujui beroperasi.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045'
    },
    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,40 Q50,70 110,20 T170,40" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-28 06:35 WITA'
    }
  },
  {
    id: 'p2h-2026-008',
    docNumber: 'F-QHSE-OPS-MOB-09',
    createdAt: '2026-10-28T07:20:00.000Z',
    updatedAt: '2026-10-28T07:45:00.000Z',
    operatorName: 'Dedi Kurniawan',
    operatorNik: 'OP-4491',
    date: '2026-10-28',
    shift: 'Shift 1 (Siang)',
    workLocation: 'Port Terminal Jetty 2 & Stockpile',
    jobSite: 'Sun Mining Project Kutai',
    equipmentType: 'Light Vehicle (EV)',
    unitModel: 'JAC T9 EV 4x4',
    unitNumber: 'LV-EV-04',
    skoExpiryDate: '2027-01-10',
    startKm: 8950,
    endKm: 9075,
    startSoc: 96,
    endSoc: 64,
    batteryCapacityKwh: 88.02,
    totalKm: 125,
    batteryUsedPercent: 32,
    energyConsumedKwh: 28.16,
    consumptionRateKwhPerKm: 0.225,
    costSavingsIdr: 172000,
    co2ReductionKg: 26.8,
    charging: {
      percentCharged: 80,
      energyAddedKwh: 70.4,
      estimatedRangeKm: 260,
      chargingLocation: 'SPKLU Port Jetty Fast Charger'
    },
    driverCondition: {
      idCardExpiry: '2027-10-15',
      simperExpiry: '2027-08-20',
      items: { drv_1: 'ya', drv_2: 'ya', drv_3a: 'ya', drv_3b: 'ya', drv_3c: 'ya', drv_3d: 'ya', drv_4: 'ya', drv_5: 'ya' },
      notes: {}
    },
    inspections: {
      crit_1: { status: 'normal' }, crit_2: { status: 'normal' }, crit_3: { status: 'normal' },
      crit_4: { status: 'normal' }, crit_5: { status: 'normal' }, crit_6: { status: 'normal' },
      crit_7: { status: 'normal' }, crit_8: { status: 'normal' }, crit_9: { status: 'normal' },
      crit_10: { status: 'normal' }, crit_11: { status: 'normal' }, crit_12: { status: 'normal' },
      crit_13_1: { status: 'normal' }, crit_13_2: { status: 'normal' }, crit_13_3: { status: 'normal' },
      crit_14: { status: 'normal' }, crit_15: { status: 'normal' }, crit_16: { status: 'normal' },
      crit_17: { status: 'normal' }, crit_18: { status: 'normal' }, crit_19: { status: 'normal' },
      crit_20: { status: 'normal' }, crit_21_1: { status: 'normal' }, crit_21_2: { status: 'normal' },
      crit_21_3: { status: 'normal' }, crit_22: { status: 'normal' }, crit_23: { status: 'normal' },
      non_1: { status: 'normal' }, non_2: { status: 'normal' }, non_3: { status: 'normal' }, non_4: { status: 'normal' }
    },
    overallStatus: 'approved',
    hasAbnormalCritical: false,
    hasAbnormalNonCritical: false,
    mechanicRecommendation: {
      status: 'continue_operation',
      reason: 'Semua sistem keselamatan dan penggerak 4x4 beroperasi prima.',
      mechanicName: 'Hendra Gunawan',
      mechanicNik: 'MEK-4109'
    },
    foremanApproval: {
      status: 'approved',
      notes: 'Disetujui beroperasi.',
      foremanName: 'Suryadi Pratama',
      foremanNik: 'FRM-2045'
    },
    operatorSignature: {
      agreed: true,
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,40 Q50,70 110,20 T170,40" fill="none" stroke="%230284c7" stroke-width="3"/></svg>',
      submittedAt: '2026-10-28 07:25 WITA'
    }
  }
];

export const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [
  {
    id: 'mlog-101',
    unitNumber: 'LV-EV-01',
    serviceDate: '2026-08-10',
    serviceTier: 'PM-1 (1.500 kWh)',
    kwhAtService: 1500,
    kmAtService: 6200,
    workOrderNumber: 'WO-EV-2026-0812',
    mechanicName: 'Hendra Gunawan',
    mechanicNik: 'MEK-4109',
    notes: 'Inspeksi awal 1.500 kWh selesai. Kalibrasi sel baterai CATL normal (Delta V = 8 mV). Torsi baut roda 140 Nm.',
    replacedParts: ['Filter Debu Sirkulasi Kabin HEPA'],
    batteryHealthSoH: 99.2
  },
  {
    id: 'mlog-102',
    unitNumber: 'LV-EV-03',
    serviceDate: '2026-07-05',
    serviceTier: 'PM-2 (3.000 kWh)',
    kwhAtService: 3000,
    kmAtService: 13200,
    workOrderNumber: 'WO-EV-2026-0740',
    mechanicName: 'Agus Salim',
    mechanicNik: 'MEK-3814',
    notes: 'Penggantian oli reducer drivetrain (GL-5 75W-90). Pembersihan kaliper rem cakram dari debu lumpur pit.',
    replacedParts: ['Oli Reducer Drivetrain (2.2 Liter)', 'Brake Cleaner Aerosol', 'Seal Gasket Plug'],
    batteryHealthSoH: 98.4
  }
];
