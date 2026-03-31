import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { SKUData, MasterDataItem, ProductionParams } from '../App';

interface SKUDistributionProps {
  distribution: SKUData[];
  onUpdate: (distribution: SKUData[]) => void;
  masterData: MasterDataItem[];
  standardPotatoRatio?: number;
}

export function SKUDistribution({ distribution, onUpdate, masterData, standardPotatoRatio = 2.5 }: SKUDistributionProps) {
  const handlePercentageChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newDistribution = [...distribution];
    newDistribution[index].percentage = numValue;
    onUpdate(newDistribution);
  };

  const handleSKUChange = (index: number, value: string) => {
    const newDistribution = [...distribution];
    newDistribution[index].sku = value;
    
    // Auto-select first packets per box option
    const skuMasterData = masterData.find(item => item.sku === value);
    if (skuMasterData) {
      if (skuMasterData.packetsPerBox.length > 0) {
        newDistribution[index].selectedPacketsPerBox = skuMasterData.packetsPerBox[0];
      }
      
      // Auto-select first seasoning if available
      if (skuMasterData.seasoningOptions.length > 0) {
        const firstSeasoning = skuMasterData.seasoningOptions[0];
        newDistribution[index].selectedSeasoning = firstSeasoning.name;
        newDistribution[index].customSeasoningRatio = firstSeasoning.ratio;
        newDistribution[index].customPotatoRatio = firstSeasoning.potatoRatio;
      } else {
        // Clear seasoning if no options available
        newDistribution[index].selectedSeasoning = undefined;
        newDistribution[index].customSeasoningRatio = undefined;
        newDistribution[index].customPotatoRatio = undefined;
      }
    }
    
    onUpdate(newDistribution);
  };

  const handlePacketsPerBoxChange = (index: number, value: number) => {
    const newDistribution = [...distribution];
    newDistribution[index].selectedPacketsPerBox = value;
    onUpdate(newDistribution);
  };

  const handleSeasoningChange = (index: number, seasoningName: string) => {
    const newDistribution = [...distribution];
    const skuMasterData = masterData.find(item => item.sku === newDistribution[index].sku);
    
    if (skuMasterData) {
      const seasoning = skuMasterData.seasoningOptions.find(s => s.name === seasoningName);
      if (seasoning) {
        newDistribution[index].selectedSeasoning = seasoning.name;
        newDistribution[index].customSeasoningRatio = seasoning.ratio;
        newDistribution[index].customPotatoRatio = seasoning.potatoRatio;
      }
    }
    
    onUpdate(newDistribution);
  };

  const handleSeasoningRatioChange = (index: number, value: string) => {
    const newDistribution = [...distribution];
    newDistribution[index].customSeasoningRatio = parseFloat(value) || 0;
    onUpdate(newDistribution);
  };

  const handlePotatoRatioChange = (index: number, value: string) => {
    const newDistribution = [...distribution];
    newDistribution[index].customPotatoRatio = parseFloat(value) || 0;
    onUpdate(newDistribution);
  };

  const setAllToStandardPotatoRatio = () => {
    const newDistribution = distribution.map(item => ({
      ...item,
      customPotatoRatio: standardPotatoRatio
    }));
    onUpdate(newDistribution);
  };

  const addSKU = () => {
    // When adding a new SKU, redistribute percentages equally
    const newDistribution = [...distribution, { sku: '', percentage: 0 }];
    const equalPercentage = 100 / newDistribution.length;
    const redistributed = newDistribution.map(item => ({
      ...item,
      percentage: equalPercentage
    }));
    onUpdate(redistributed);
  };

  const removeSKU = (index: number) => {
    if (distribution.length > 1) {
      const newDistribution = distribution.filter((_, i) => i !== index);
      
      // Redistribute percentages equally among remaining SKUs
      const equalPercentage = 100 / newDistribution.length;
      const redistributed = newDistribution.map(item => ({
        ...item,
        percentage: equalPercentage
      }));
      
      onUpdate(redistributed);
    } else if (distribution.length === 1) {
      // If only one SKU, ensure it's 100%
      const newDistribution = [...distribution];
      newDistribution[0].percentage = 100;
      onUpdate(newDistribution);
    }
  };

  const totalPercentage = distribution.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-slate-900">SKU Distribution</h2>
        <div className="flex items-center gap-2">
          <Button 
            onClick={setAllToStandardPotatoRatio} 
            size="sm" 
            variant="outline"
            className="text-xs"
          >
            <RefreshCw className="size-3 mr-1.5" />
            Same as Standard Potato Ratio
          </Button>
          <Button onClick={addSKU} size="sm" variant="outline">
            <Plus className="size-4 mr-1.5" />
            Add SKU
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-4">
        {distribution.map((item, index) => {
          const skuMasterData = masterData.find(md => md.sku === item.sku);
          const hasMultiplePacketOptions = skuMasterData && skuMasterData.packetsPerBox.length > 1;
          const hasSeasoningOptions = skuMasterData && skuMasterData.seasoningOptions.length > 0;
          
          return (
            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              {/* First Row: SKU, Packets/Box, Percentage, Delete */}
              <div className="flex gap-3 items-start mb-3">
                <div className="flex-1">
                  <Label htmlFor={`sku-${index}`} className="text-xs text-slate-600 mb-1.5 block">
                    SKU
                  </Label>
                  <select
                    id={`sku-${index}`}
                    value={item.sku}
                    onChange={(e) => handleSKUChange(index, e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select SKU</option>
                    {masterData.map((pm) => (
                      <option key={pm.sku} value={pm.sku}>
                        {pm.sku}
                      </option>
                    ))}
                  </select>
                </div>
                
                {hasMultiplePacketOptions && (
                  <div className="w-28">
                    <Label htmlFor={`ppb-${index}`} className="text-xs text-slate-600 mb-1.5 block">
                      Pkts/Box
                    </Label>
                    <select
                      id={`ppb-${index}`}
                      value={item.selectedPacketsPerBox || skuMasterData.packetsPerBox[0]}
                      onChange={(e) => handlePacketsPerBoxChange(index, parseInt(e.target.value))}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {skuMasterData.packetsPerBox.map((ppb) => (
                        <option key={ppb} value={ppb}>
                          {ppb}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="w-32">
                  <Label htmlFor={`percentage-${index}`} className="text-xs text-slate-600 mb-1.5 block">
                    Percentage (%)
                  </Label>
                  <Input
                    id={`percentage-${index}`}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={item.percentage}
                    onChange={(e) => handlePercentageChange(index, e.target.value)}
                    className="bg-white"
                  />
                </div>

                <Button
                  onClick={() => removeSKU(index)}
                  size="sm"
                  variant="ghost"
                  className="mt-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={distribution.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Second Row: Seasoning Options */}
              {hasSeasoningOptions && (
                <div className="flex gap-3 items-start pt-3 border-t border-slate-200">
                  <div className="flex-1">
                    <Label htmlFor={`seasoning-${index}`} className="text-xs text-slate-600 mb-1.5 block">
                      Seasoning
                    </Label>
                    <select
                      id={`seasoning-${index}`}
                      value={item.selectedSeasoning || ''}
                      onChange={(e) => handleSeasoningChange(index, e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select Seasoning</option>
                      {skuMasterData.seasoningOptions.map((seasoning) => (
                        <option key={seasoning.name} value={seasoning.name}>
                          {seasoning.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-40">
                    <Label htmlFor={`seasoning-ratio-${index}`} className="text-xs text-slate-600 mb-1.5 block">
                      Seasoning Ratio (kg/kg)
                    </Label>
                    <Input
                      id={`seasoning-ratio-${index}`}
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.customSeasoningRatio || 0}
                      onChange={(e) => handleSeasoningRatioChange(index, e.target.value)}
                      className="bg-white"
                      disabled={!item.selectedSeasoning}
                    />
                  </div>

                  <div className="w-40">
                    <Label htmlFor={`potato-ratio-${index}`} className="text-xs text-slate-600 mb-1.5 block">
                      Potato Ratio
                    </Label>
                    <Input
                      id={`potato-ratio-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.customPotatoRatio || 0}
                      onChange={(e) => handlePotatoRatioChange(index, e.target.value)}
                      className="bg-white"
                      disabled={!item.selectedSeasoning}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`text-sm mt-4 p-3 rounded-md ${
        Math.abs(totalPercentage - 100) < 0.01 
          ? 'bg-green-50 text-green-700 border border-green-200' 
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-medium">Total: {totalPercentage.toFixed(1)}%</span>
          {Math.abs(totalPercentage - 100) >= 0.01 && (
            <span className="text-xs">
              {totalPercentage > 100 
                ? `Exceeds by ${(totalPercentage - 100).toFixed(1)}%` 
                : `Below by ${(100 - totalPercentage).toFixed(1)}%`
              }
            </span>
          )}
        </div>
        {Math.abs(totalPercentage - 100) >= 0.01 && (
          <p className="text-xs mt-1 opacity-80">
            {totalPercentage < 100 
              ? 'Adjust percentages to total 100% for accurate forecasting'
              : 'Total percentage cannot exceed 100%'
            }
          </p>
        )}
      </div>
    </Card>
  );
}
