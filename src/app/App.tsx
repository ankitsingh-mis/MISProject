import { useState, useEffect } from 'react';
import { Calculator, Database, Wifi, WifiOff } from 'lucide-react';
import { ProductionInputs } from './components/production-inputs';
import { SKUDistribution } from './components/sku-distribution';
import { ResultsDisplay } from './components/results-display';
import { ExportButtons } from './components/export-buttons';
import { MasterDataDialog } from './components/master-data-dialog';
import { Toaster } from './components/ui/sonner';
import { registerServiceWorker } from './utils/service-worker-registration';

// Seasoning option structure
export interface SeasoningOption {
  name: string;
  ratio: number; // Seasoning ratio per kg production
  potatoRatio: number; // Seasoning-specific potato ratio
}

// Combined master data structure
export interface MasterDataItem {
  sku: string;
  productWeight: number;
  pmWeight: number;
  boxType: string;
  packetsPerBox: number[];
  seasoningOptions: SeasoningOption[];
}

// Default master data from the provided tables
export const DEFAULT_MASTER_DATA: MasterDataItem[] = [
  { sku: '12gm', productWeight: 0.012, pmWeight: 0.0035, boxType: 'C1', packetsPerBox: [180], seasoningOptions: [] },
  { sku: '14gm', productWeight: 0.014, pmWeight: 0.0035, boxType: 'C1', packetsPerBox: [180], seasoningOptions: [] },
  { sku: '15gm', productWeight: 0.015, pmWeight: 0.004, boxType: 'C1', packetsPerBox: [180], seasoningOptions: [
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 },
    { name: 'Tomato', ratio: 0.09, potatoRatio: 3.79 }
  ]},
  { sku: '16gm', productWeight: 0.016, pmWeight: 0.004, boxType: 'C1', packetsPerBox: [180], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 }
  ]},
  { sku: '24gm', productWeight: 0.024, pmWeight: 0.005, boxType: 'C2', packetsPerBox: [120], seasoningOptions: [] },
  { sku: '27gm', productWeight: 0.027, pmWeight: 0.005, boxType: 'C2', packetsPerBox: [192], seasoningOptions: [
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 }
  ]},
  { sku: '28gm', productWeight: 0.028, pmWeight: 0.005, boxType: 'C2', packetsPerBox: [90, 120], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 }
  ]},
  { sku: '30gm', productWeight: 0.03, pmWeight: 0.005, boxType: 'C2', packetsPerBox: [99, 90, 108], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 },
    { name: 'Tomato', ratio: 0.09, potatoRatio: 3.79 }
  ]},
  { sku: '35gm', productWeight: 0.035, pmWeight: 0.006, boxType: 'C4', packetsPerBox: [60], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Peri Peri', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 }
  ]},
  { sku: '37gm', productWeight: 0.037, pmWeight: 0.006, boxType: 'C4', packetsPerBox: [60], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Peri Peri', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 }
  ]},
  { sku: '38gm', productWeight: 0.038, pmWeight: 0.006, boxType: 'C4', packetsPerBox: [60], seasoningOptions: [] },
  { sku: '40gm', productWeight: 0.04, pmWeight: 0.0065, boxType: 'C4', packetsPerBox: [60], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Peri Peri', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 }
  ]},
  { sku: '50gm', productWeight: 0.05, pmWeight: 0.006, boxType: '500GM FAMILY PACK', packetsPerBox: [60], seasoningOptions: [] },
  { sku: '60gm', productWeight: 0.06, pmWeight: 0.007, boxType: 'GOLDEN', packetsPerBox: [48], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 }
  ]},
  { sku: '80gm', productWeight: 0.08, pmWeight: 0.0075, boxType: 'GOLDEN', packetsPerBox: [20, 48], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Peri Peri', ratio: 0.075, potatoRatio: 3.84 }
  ]},
  { sku: '90gm', productWeight: 0.09, pmWeight: 0.008, boxType: '90GM WAFER', packetsPerBox: [10, 20, 24], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Peri Peri', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 }
  ]},
  { sku: '150gm', productWeight: 0.15, pmWeight: 0.011, boxType: 'LAMBA 150GM', packetsPerBox: [24], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 }
  ]},
  { sku: '170gm', productWeight: 0.17, pmWeight: 0.011, boxType: 'LAMBA 150GM', packetsPerBox: [10, 25], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 },
    { name: 'Mast Masala', ratio: 0.075, potatoRatio: 3.84 },
    { name: 'Cream N Onion', ratio: 0.08, potatoRatio: 3.827 },
    { name: 'Tomato', ratio: 0.09, potatoRatio: 3.79 }
  ]},
  { sku: '200gm', productWeight: 0.2, pmWeight: 0.012, boxType: '200GM WAFER', packetsPerBox: [10], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 }
  ]},
  { sku: '500gm', productWeight: 0.5, pmWeight: 0.016, boxType: '500GM FAMILY PACK', packetsPerBox: [10], seasoningOptions: [
    { name: 'Salted', ratio: 0.01, potatoRatio: 4.16 }
  ]},
];

export interface ProductionParams {
  numberOfDays: number;
  potatoRatio: number;
  oilPickup: number;
  standardProductionPerDay: number;
}

export interface SKUData {
  sku: string;
  percentage: number;
  selectedPacketsPerBox?: number;
  selectedSeasoning?: string;
  customSeasoningRatio?: number;
  customPotatoRatio?: number;
}

function App() {
  // Register service worker for offline functionality
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load master data from localStorage or use default
  const [masterData, setMasterData] = useState<MasterDataItem[]>(() => {
    const saved = localStorage.getItem('masterData');
    return saved ? JSON.parse(saved) : DEFAULT_MASTER_DATA;
  });

  const [showMasterData, setShowMasterData] = useState(false);

  // Save master data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('masterData', JSON.stringify(masterData));
  }, [masterData]);

  const [productionParams, setProductionParams] = useState<ProductionParams>(() => {
    const saved = localStorage.getItem('productionParams');
    return saved ? JSON.parse(saved) : {
      numberOfDays: 30,
      potatoRatio: 2.5,
      oilPickup: 35,
      standardProductionPerDay: 10000,
    };
  });

  const [skuDistribution, setSKUDistribution] = useState<SKUData[]>(() => {
    const saved = localStorage.getItem('skuDistribution');
    return saved ? JSON.parse(saved) : [
      { sku: '12gm', percentage: 5 },
      { sku: '14gm', percentage: 5 },
      { sku: '30gm', percentage: 15 },
      { sku: '50gm', percentage: 20 },
      { sku: '80gm', percentage: 25 },
      { sku: '200gm', percentage: 30 },
    ];
  });

  // Save production params to localStorage
  useEffect(() => {
    localStorage.setItem('productionParams', JSON.stringify(productionParams));
  }, [productionParams]);

  // Save SKU distribution to localStorage
  useEffect(() => {
    localStorage.setItem('skuDistribution', JSON.stringify(skuDistribution));
  }, [skuDistribution]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <WifiOff className="size-4" />
          <span>You are currently offline. Your data is saved locally and will sync when online.</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-lg">
                <Calculator className="size-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-slate-900">Production Forecast Calculator</h1>
                <p className="text-sm text-slate-600">Potato Chips Line</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMasterData(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <Database className="size-4" />
                Master Data
              </button>
              <ExportButtons params={productionParams} distribution={skuDistribution} masterData={masterData} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            <ProductionInputs
              params={productionParams}
              onUpdate={setProductionParams}
            />
            <SKUDistribution
              distribution={skuDistribution}
              onUpdate={setSKUDistribution}
              masterData={masterData}
              standardPotatoRatio={productionParams.potatoRatio}
            />
          </div>

          {/* Right Column - Results */}
          <div>
            <ResultsDisplay
              params={productionParams}
              distribution={skuDistribution}
              masterData={masterData}
            />
          </div>
        </div>
      </main>
      
      <MasterDataDialog
        open={showMasterData}
        onOpenChange={setShowMasterData}
        masterData={masterData}
        onUpdate={setMasterData}
      />

      <Toaster />
    </div>
  );
}

export default App;