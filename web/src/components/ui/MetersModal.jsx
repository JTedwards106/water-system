// components/ui/MetersModal.jsx
import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';

export default function MetersModal({ isOpen, onClose, meters, selectedMeter, onMeterSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMeters, setFilteredMeters] = useState(meters);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredMeters(meters);
    } else {
      const filtered = meters.filter(meter =>
        meter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meter.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMeters(filtered);
    }
  }, [searchTerm, meters]);

  const handleMeterClick = (meter) => {
    onMeterSelect(meter);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">All Meters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="meter name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {/* Meters List */}
        <div className="overflow-y-auto max-h-96">
          <div className="p-6 space-y-3">
            {filteredMeters.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No meters found matching "{searchTerm}"
              </div>
            ) : (
              filteredMeters.map((meter) => (
                <div
                  key={meter.id}
                  onClick={() => handleMeterClick(meter)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedMeter.id === meter.id
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        selectedMeter.id === meter.id ? 'text-primary' : 'text-slate-900'
                      }`}>
                        {meter.name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{meter.location}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        meter.status === 'online'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {meter.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {meter.battery}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}