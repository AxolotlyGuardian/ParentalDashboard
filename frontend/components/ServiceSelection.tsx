'use client';

import { useEffect, useState } from 'react';
import { servicesApi } from '@/lib/api';

interface Service {
  id: string;
  name: string;
  package: string;
}

export default function ServiceSelection() {
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await servicesApi.getServices();
      setAvailableServices(response.data.available_services);
      setSelectedServices(response.data.selected_services || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load services', error);
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const saveServices = async () => {
    setIsSaving(true);
    try {
      await servicesApi.updateServices(selectedServices);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save services', error);
      alert('Failed to save services');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <p className="text-gray-600">Loading streaming services...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">My Streaming Services</h2>
        <p className="text-sm text-gray-600">
          Select the streaming services you subscribe to. Content will be filtered to show only titles available on your selected services.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
        {availableServices.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          return (
            <button
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-[#F77B8A] bg-pink-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {service.name}
                </div>
                <div className="text-xs text-gray-500">
                  {isSelected ? '✓ Selected' : 'Tap to select'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={saveServices}
          disabled={isSaving}
          className="px-6 py-3 bg-[#F77B8A] text-white rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Services'}
        </button>

        {showSuccess && (
          <div className="text-green-600 font-medium">
            ✓ Services saved successfully!
          </div>
        )}

        <div className="text-sm text-gray-600">
          {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
        </div>
      </div>
    </div>
  );
}
