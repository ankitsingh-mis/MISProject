import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Plus, Trash2, Save, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { MasterDataItem, DEFAULT_MASTER_DATA, SeasoningOption } from '../App';
import { toast } from 'sonner';

interface MasterDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterData: MasterDataItem[];
  onUpdate: (data: MasterDataItem[]) => void;
}

export function MasterDataDialog({ open, onOpenChange, masterData, onUpdate }: MasterDataDialogProps) {
  const [editedData, setEditedData] = useState<MasterDataItem[]>(masterData);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Update editedData when dialog opens or masterData changes
  useEffect(() => {
    setEditedData(masterData);
  }, [masterData, open]);

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleUpdate = (index: number, field: keyof MasterDataItem, value: string | number | number[]) => {
    const newData = [...editedData];
    if (field === 'packetsPerBox' && typeof value === 'string') {
      // Parse comma-separated values for packetsPerBox
      newData[index][field] = value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    } else {
      (newData[index][field] as any) = value;
    }
    setEditedData(newData);
  };

  const addRow = () => {
    setEditedData([...editedData, {
      sku: '',
      productWeight: 0,
      pmWeight: 0,
      boxType: '',
      packetsPerBox: [10],
      seasoningOptions: []
    }]);
  };

  const removeRow = (index: number) => {
    const newData = editedData.filter((_, i) => i !== index);
    setEditedData(newData);
  };

  const addSeasoning = (skuIndex: number) => {
    const newData = [...editedData];
    newData[skuIndex].seasoningOptions.push({
      name: '',
      ratio: 0,
      potatoRatio: 0
    });
    setEditedData(newData);
  };

  const removeSeasoning = (skuIndex: number, seasoningIndex: number) => {
    const newData = [...editedData];
    newData[skuIndex].seasoningOptions = newData[skuIndex].seasoningOptions.filter((_, i) => i !== seasoningIndex);
    setEditedData(newData);
  };

  const updateSeasoning = (skuIndex: number, seasoningIndex: number, field: keyof SeasoningOption, value: string | number) => {
    const newData = [...editedData];
    (newData[skuIndex].seasoningOptions[seasoningIndex][field] as any) = value;
    setEditedData(newData);
  };

  const handleSave = () => {
    // Validate data
    const hasEmpty = editedData.some(item => !item.sku || !item.boxType);
    if (hasEmpty) {
      toast.error('Please fill all SKU and Box Type fields');
      return;
    }

    onUpdate(editedData);
    toast.success('Master data saved successfully');
    onOpenChange(false);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default master data? This will overwrite all your changes.')) {
      setEditedData(DEFAULT_MASTER_DATA);
      onUpdate(DEFAULT_MASTER_DATA);
      toast.success('Master data reset to defaults');
    }
  };

  const handleCancel = () => {
    setEditedData(masterData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Master Data Management</DialogTitle>
          <DialogDescription>
            Edit SKU details including product weight, PM weight, box type, packets per box, and seasoning options. Changes are saved to your browser's local storage.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={addRow} size="sm" variant="outline">
              <Plus className="size-4 mr-1.5" />
              Add SKU
            </Button>
            <Button onClick={handleReset} size="sm" variant="outline" className="text-amber-600 hover:text-amber-700">
              <RotateCcw className="size-4 mr-1.5" />
              Reset to Defaults
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-700 w-12"></th>
                    <th className="text-left p-3 font-semibold text-slate-700">SKU</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Product Weight (kg)</th>
                    <th className="text-left p-3 font-semibold text-slate-700">PM Weight (kg)</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Box Type</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Packets Per Box</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Seasonings</th>
                    <th className="text-left p-3 font-semibold text-slate-700 w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.map((item, index) => (
                    <>
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-2">
                          {item.seasoningOptions.length > 0 && (
                            <button
                              onClick={() => toggleRowExpansion(index)}
                              className="p-1 hover:bg-slate-200 rounded"
                            >
                              {expandedRows.has(index) ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                          )}
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.sku}
                            onChange={(e) => handleUpdate(index, 'sku', e.target.value)}
                            placeholder="e.g., 12gm"
                            className="h-9"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.001"
                            value={item.productWeight}
                            onChange={(e) => handleUpdate(index, 'productWeight', parseFloat(e.target.value) || 0)}
                            placeholder="0.012"
                            className="h-9 p-[4px]"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.0001"
                            value={item.pmWeight}
                            onChange={(e) => handleUpdate(index, 'pmWeight', parseFloat(e.target.value) || 0)}
                            placeholder="0.0035"
                            className="h-9 px-[1px] py-[4px]"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.boxType}
                            onChange={(e) => handleUpdate(index, 'boxType', e.target.value)}
                            placeholder="e.g., C1"
                            className="h-9"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={item.packetsPerBox.join(', ')}
                            onChange={(e) => handleUpdate(index, 'packetsPerBox', e.target.value)}
                            placeholder="e.g., 10, 20, 24"
                            className="h-9"
                            title="Comma-separated values for multiple options"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            onClick={() => addSeasoning(index)}
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs"
                          >
                            <Plus className="size-3 mr-1" />
                            Add ({item.seasoningOptions.length})
                          </Button>
                        </td>
                        <td className="p-2">
                          <Button
                            onClick={() => removeRow(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                      {/* Expanded Seasoning Details */}
                      {expandedRows.has(index) && item.seasoningOptions.length > 0 && (
                        <tr key={`${index}-seasoning`} className="bg-slate-50">
                          <td colSpan={8} className="p-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-slate-700 mb-2">Seasoning Options for {item.sku}</h4>
                              {item.seasoningOptions.map((seasoning, sIndex) => (
                                <div key={sIndex} className="flex items-center gap-2 p-3 bg-white rounded border border-slate-200">
                                  <div className="flex-1">
                                    <Label className="text-xs text-slate-600 mb-1 block">Seasoning Name</Label>
                                    <Input
                                      value={seasoning.name}
                                      onChange={(e) => updateSeasoning(index, sIndex, 'name', e.target.value)}
                                      placeholder="e.g., Salted"
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="w-36">
                                    <Label className="text-xs text-slate-600 mb-1 block">Ratio (kg/kg)</Label>
                                    <Input
                                      type="number"
                                      step="0.001"
                                      value={seasoning.ratio}
                                      onChange={(e) => updateSeasoning(index, sIndex, 'ratio', parseFloat(e.target.value) || 0)}
                                      placeholder="0.01"
                                      className="h-8"
                                    />
                                  </div>
                                  <div className="w-32">
                                    <Label className="text-xs text-slate-600 mb-1 block">Potato Ratio</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={seasoning.potatoRatio}
                                      onChange={(e) => updateSeasoning(index, sIndex, 'potatoRatio', parseFloat(e.target.value) || 0)}
                                      placeholder="4.16"
                                      className="h-8"
                                    />
                                  </div>
                                  <Button
                                    onClick={() => removeSeasoning(index, sIndex)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-5"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <strong>Note:</strong> 
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>For "Packets Per Box", you can enter multiple values separated by commas (e.g., "10, 20, 24") if a SKU has different box packing options.</li>
              <li>Click the chevron icon to expand and view/edit seasoning details for each SKU.</li>
              <li>Seasoning Ratio is the amount of seasoning (in kg) required per kg of production.</li>
              <li>Potato Ratio is the seasoning-specific ratio of raw potato to finished chips.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="size-4 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
