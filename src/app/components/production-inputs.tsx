import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { ProductionParams } from '../App';

interface ProductionInputsProps {
  params: ProductionParams;
  onUpdate: (params: ProductionParams) => void;
}

export function ProductionInputs({ params, onUpdate }: ProductionInputsProps) {
  const handleChange = (field: keyof ProductionParams, value: string) => {
    const numValue = parseFloat(value) || 0;
    onUpdate({
      ...params,
      [field]: numValue,
    });
  };

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900 mb-5">Production Parameters</h2>
      
      <div className="space-y-5">
        <div>
          <Label htmlFor="days" className="text-slate-700">
            Number of Days
          </Label>
          <Input
            id="days"
            type="number"
            min="1"
            value={params.numberOfDays}
            onChange={(e) => handleChange('numberOfDays', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="potato" className="text-slate-700">
            Potato Ratio (kg potato per kg chips)
          </Label>
          <Input
            id="potato"
            type="number"
            step="0.1"
            min="0"
            value={params.potatoRatio}
            onChange={(e) => handleChange('potatoRatio', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="oil" className="text-slate-700">
            Oil Pickup (%)
          </Label>
          <Input
            id="oil"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={params.oilPickup}
            onChange={(e) => handleChange('oilPickup', e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="production" className="text-slate-700">
            Standard Production per Day (kg)
          </Label>
          <Input
            id="production"
            type="number"
            min="0"
            value={params.standardProductionPerDay}
            onChange={(e) => handleChange('standardProductionPerDay', e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
    </Card>
  );
}
