import { useRef } from 'react';
import { Button } from './ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { domToPng } from 'modern-screenshot';
import * as XLSX from 'xlsx';
import { ProductionParams, SKUData, MasterDataItem } from '../App';
import { toast } from 'sonner';

interface ExportButtonsProps {
  params: ProductionParams;
  distribution: SKUData[];
  masterData: MasterDataItem[];
}

export function ExportButtons({ params, distribution, masterData }: ExportButtonsProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadSnapshot = async () => {
    try {
      const mainContent = document.querySelector('main');
      if (!mainContent) {
        toast.error('Unable to capture snapshot');
        return;
      }

      toast.info('Capturing snapshot...');

      const dataUrl = await domToPng(mainContent as HTMLElement, {
        scale: 2,
        backgroundColor: '#f1f5f9',
      });

      const link = document.createElement('a');
      link.download = `production-forecast-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success('Snapshot downloaded successfully!');
    } catch (error) {
      console.error('Error capturing snapshot:', error);
      toast.error('Failed to download snapshot');
    }
  };

  const handleDownloadExcel = () => {
    try {
      // Calculate all values
      const totalProduction = params.numberOfDays * params.standardProductionPerDay;
      const oilConsumption = totalProduction * (params.oilPickup / 100);

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
          packetsPerBox = item.selectedPacketsPerBox || pmData.packetsPerBox[0];
          numberOfBoxes = numberOfUnits / packetsPerBox;

          // Calculate seasoning if selected
          if (item.selectedSeasoning && item.customSeasoningRatio) {
            seasoningRequired = productionKg * item.customSeasoningRatio;
          }

          // Use custom potato ratio if seasoning is selected
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

      const totalPotatoRequired = skuBreakdown.reduce(
        (sum, item) => sum + item.potatoRequiredForSKU,
        0
      );

      const totalPackagingMaterial = skuBreakdown.reduce(
        (sum, item) => sum + item.packagingMaterial,
        0
      );

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

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Create header section
      const headerData = [
        ['Production Forecast Calculator - Potato Chips Manufacturing'],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['PRODUCTION PARAMETERS', '', '', 'SKU DISTRIBUTION'],
        ['Forecast for Days', params.numberOfDays, '', 'SKU', 'Percentage', 'Seasoning'],
        ['Standard Potato Ratio', params.potatoRatio, '', ...distribution.map(d => d.sku)],
        ['Oil Pickup %', params.oilPickup, '', ...distribution.map(d => `${d.percentage}%`)],
        ['Production per Day (kg)', params.standardProductionPerDay, '', ...distribution.map(d => d.selectedSeasoning || 'None')],
        [],
        ['SUMMARY'],
        ['Total Running Hours', params.numberOfDays * 24],
        ['Total Expected Production (kg)', totalProduction],
        ['Raw Potato Required (kg)', totalPotatoRequired],
        ['Expected Oil Consumption (kg)', oilConsumption],
        ['Total Packaging Material (kg)', `${totalPackagingMaterial.toFixed(2)} (${pmWithWastage.toFixed(2)} with 1% wastage)`],
        ['Total Seasoning Required (kg)', totalSeasoningRequired],
        [],
      ];

      // Add seasoning breakdown
      if (Object.keys(seasoningByType).length > 0) {
        headerData.push(['SEASONING BREAKDOWN BY TYPE']);
        Object.entries(seasoningByType).forEach(([name, amount]) => {
          headerData.push([name, Math.round(amount * 100) / 100 + ' kg']);
        });
        headerData.push([]);
      }

      headerData.push(['SKU BREAKDOWN']);
      headerData.push(['SKU', 'Seasoning', 'Percentage (%)', 'Production (kg)', 'Packets', 'Potato (kg)', 'Potato Ratio', 'Seasoning (kg)', 'PM (kg)', 'Box Type', 'Pkts/Box', 'Boxes']);

      // Add SKU breakdown rows
      skuBreakdown.forEach((item) => {
        headerData.push([
          item.sku || 'Unspecified',
          item.seasoningName || 'None',
          item.percentage,
          Math.round(item.productionKg * 100) / 100,
          Math.round(item.numberOfUnits),
          Math.round(item.potatoRequiredForSKU * 100) / 100,
          item.effectivePotatoRatio,
          Math.round(item.seasoningRequired * 100) / 100,
          Math.round(item.packagingMaterial * 100) / 100,
          item.boxType,
          item.packetsPerBox,
          Math.round(item.numberOfBoxes),
        ]);
      });

      // Add totals row
      headerData.push([
        'TOTAL',
        '',
        distribution.reduce((sum, d) => sum + d.percentage, 0),
        totalProduction,
        '',
        totalPotatoRequired,
        '',
        totalSeasoningRequired,
        totalPackagingMaterial,
        '',
        '',
        '',
      ]);

      // Add master data reference table
      headerData.push([]);
      headerData.push(['MASTER DATA REFERENCE']);
      headerData.push(['SKU', 'Product Weight (kg)', 'PM Weight (kg)', 'Box Type', 'Packets Per Box Options', 'Available Seasonings']);
      
      masterData.forEach((pm) => {
        const seasonings = pm.seasoningOptions.map(s => `${s.name} (Ratio: ${s.ratio}, Potato: ${s.potatoRatio})`).join('; ');
        headerData.push([pm.sku, pm.productWeight, pm.pmWeight, pm.boxType, pm.packetsPerBox.join(', '), seasonings || 'None']);
      });

      // Convert to worksheet
      const ws = XLSX.utils.aoa_to_sheet(headerData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Production Forecast');

      // Generate filename
      const filename = `production-forecast-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      
      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button onClick={handleDownloadSnapshot} variant="outline" size="sm">
          <Download className="size-4 mr-2" />
          Download Snapshot
        </Button>
        <Button onClick={handleDownloadExcel} variant="default" size="sm">
          <FileSpreadsheet className="size-4 mr-2" />
          Download Excel
        </Button>
      </div>
      <div ref={contentRef} style={{ display: 'none' }} />
    </>
  );
}