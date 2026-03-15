// components/ui/MeterSelector.jsx
import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import MetersModal from './MetersModal';

export default function MeterSelector({ meters, selectedMeter, onMeterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (meter) => {
    onMeterChange(meter);
    setIsOpen(false);
  };

  const handleShowAll = () => {
    setIsOpen(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <RotateCcw className="h-5 w-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            {selectedMeter.name}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>

        {isOpen && (
          <div className="absolute top-full mt-1 w-64 bg-white border border-slate-300 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {meters.map((meter) => (
                <button
                  key={meter.id}
                  onClick={() => handleSelect(meter)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 focus:outline-none focus:bg-slate-50 ${
                    selectedMeter.id === meter.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{meter.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      meter.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {meter.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {meter.location} • Battery: {meter.battery}%
                  </div>
                </button>
              ))}
              {/* Separator */}
              <div className="border-t border-slate-200 my-1"></div>
              {/* Show All Button */}
              <button
                onClick={handleShowAll}
                className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-primary/5 focus:outline-none focus:bg-primary/5 font-medium"
              >
                Show All Meters
              </button>
            </div>
          </div>
        )}
      </div>

      <MetersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        meters={meters}
        selectedMeter={selectedMeter}
        onMeterSelect={onMeterChange}
      />
    </>
  );
}