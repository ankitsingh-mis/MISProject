import { Card } from './ui/card';
import { ProductionParams, SKUData, MasterDataItem } from '../App';
import { Package, Droplet, Factory, Calendar, PackageOpen, Box, Soup } from 'lucide-react';

interface ResultsDisplayProps {
  params: ProductionParams;
  distribution: SKUData[];
  masterData: MasterDataItem[];
}

export function ResultsDisplay({ params, distribution, masterData }: ResultsDisplayProps) {
  // Calculate total production (base chips without seasoning)
  const totalProduction = params.numberOfDays * params.standardProductionPerDay;

  // Calculate SKU breakdown with seasoning
  const skuBreakdown = distribution.map((item) => {
    const productionKg = totalProduction * (item.percentage / 100);
    const pmData = masterData.find((pm) => pm.sku === item.sku);
    
    let packagingMaterial = 0;
    let numberOfUnits = 0;
    let boxType = '';
    let packetsPerBox = 0;
    let numberOfBoxes = 0;
    let seasoningRequired = 0;
    let potatoRequiredForSKU = 0;
    let effectivePotatoRatio = params.potatoRatio;
    
    if (pmData) {
      numberOfUnits = productionKg / pmData.productWeight;
      packagingMaterial = numberOfUnits * pmData.pmWeight;
      boxType = pmData.boxType;
      
      // Use selected packets per box or default to first option
      packetsPerBox = item.selectedPacketsPerBox || pmData.packetsPerBox[0];
      numberOfBoxes = numberOfUnits / packetsPerBox;

      // Calculate seasoning if selected
      if (item.selectedSeasoning && item.customSeasoningRatio) {
        seasoningRequired = productionKg * item.customSeasoningRatio;
      }

      // Use custom potato ratio if seasoning is selected, otherwise use standard
      if (item.selectedSeasoning && item.customPotatoRatio) {
        effectivePotatoRatio = item.customPotatoRatio;
      }

      potatoRequiredForSKU = productionKg * effectivePotatoRatio;
    }

    return {
      sku: item.sku,
      percentage: item.percentage,
      productionKg,
      numberOfUnits,
      packagingMaterial,
      boxType,
      packetsPerBox,
      numberOfBoxes,
      seasoningRequired,
      seasoningName: item.selectedSeasoning,
      potatoRequiredForSKU,
      effectivePotatoRatio,
    };
  });

  // Calculate total potato required considering individual SKU ratios
  const totalPotatoRequired = skuBreakdown.reduce(
    (sum, item) => sum + item.potatoRequiredForSKU,
    0
  );

  // Calculate oil consumption
  const oilConsumption = totalProduction * (params.oilPickup / 100);

  const totalPackagingMaterial = skuBreakdown.reduce(
    (sum, item) => sum + item.packagingMaterial,
    0
  );

  // Add 1% wastage to PM
  const pmWithWastage = totalPackagingMaterial * 1.01;

  // Calculate total seasoning by type
  const seasoningByType = skuBreakdown.reduce((acc, item) => {
    if (item.seasoningName && item.seasoningRequired > 0) {
      if (!acc[item.seasoningName]) {
        acc[item.seasoningName] = 0;
      }
      acc[item.seasoningName] += item.seasoningRequired;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalSeasoningRequired = Object.values(seasoningByType).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Factory className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Production</p>
              <p className="font-semibold text-blue-900">
                {totalProduction.toLocaleString()} kg
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Calendar className="size-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Production Days</p>
              <p className="font-semibold text-green-900">
                {params.numberOfDays} days
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Raw Materials */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Raw Materials Required</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="bg-amber-600 p-2 rounded-lg">
                <Package className="size-5 text-white" />
              </div>
              <span className="text-slate-700">Potato</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">
                {totalPotatoRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
              </p>
              <p className="text-xs text-slate-600">
                Varied ratios by seasoning
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600 p-2 rounded-lg">
                <Droplet className="size-5 text-white" />
              </div>
              <span className="text-slate-700">Oil</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">
                {oilConsumption.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
              </p>
              <p className="text-xs text-slate-600">
                Pickup: {params.oilPickup}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <PackageOpen className="size-5 text-white" />
              </div>
              <span className="text-slate-700">Packaging Material</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">
                {pmWithWastage.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
              </p>
              <p className="text-xs text-slate-600">
                (Including 1% wastage)
              </p>
            </div>
          </div>

          {totalSeasoningRequired > 0 && (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Soup className="size-5 text-white" />
                </div>
                <span className="text-slate-700">Total Seasoning</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {totalSeasoningRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                </p>
                <p className="text-xs text-slate-600">
                  All types combined
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Seasoning Breakdown by Type */}
        {Object.keys(seasoningByType).length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Seasoning Breakdown</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(seasoningByType).map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">{name}</span>
                  <span className="text-sm font-medium text-slate-900">
                    {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* SKU Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">SKU Production Breakdown</h3>
        
        <div className="space-y-3">
          {skuBreakdown.map((item, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{item.sku || 'Unspecified'}</span>
                  {item.seasoningName && (
                    <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                      {item.seasoningName}
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600">{item.percentage}%</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-slate-600 text-xs">Production</p>
                  <p className="font-medium text-slate-900">
                    {item.productionKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                  </p>
                </div>
                
                <div>
                  <p className="text-slate-600 text-xs">Packets</p>
                  <p className="font-medium text-slate-900">
                    {item.numberOfUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                
                <div>
                  <p className="text-slate-600 text-xs">PM Required</p>
                  <p className="font-medium text-slate-900">
                    {item.packagingMaterial.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 text-xs">Box Type</p>
                  <p className="font-medium text-slate-900">
                    {item.boxType || 'N/A'}
                  </p>
                </div>

                {item.seasoningRequired > 0 && (
                  <>
                    <div>
                      <p className="text-slate-600 text-xs">Seasoning</p>
                      <p className="font-medium text-slate-900">
                        {item.seasoningRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-600 text-xs">Potato (Custom Ratio: {item.effectivePotatoRatio})</p>
                      <p className="font-medium text-slate-900">
                        {item.potatoRequiredForSKU.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                      </p>
                    </div>
                  </>
                )}

                {!item.seasoningRequired && (
                  <div>
                    <p className="text-slate-600 text-xs">Potato (Std Ratio: {item.effectivePotatoRatio})</p>
                    <p className="font-medium text-slate-900">
                      {item.potatoRequiredForSKU.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                <Box className="size-4 text-slate-600" />
                <div className="flex items-center justify-between flex-1">
                  <span className="text-xs text-slate-600">Boxes Required ({item.packetsPerBox} pkts/box):</span>
                  <span className="font-semibold text-slate-900">
                    {item.numberOfBoxes.toLocaleString(undefined, { maximumFractionDigits: 0 })} boxes
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-purple-900">Total Packaging Material (with 1% wastage)</span>
            <span className="font-semibold text-purple-900">
              {pmWithWastage.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}