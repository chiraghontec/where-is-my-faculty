import React from 'react';
import AvailabilityChecker from '../components/AvailabilityChecker/AvailabilityChecker';

export default function AvailabilityPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Check Availability</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Find out which faculty are free during a specific time window
        </p>
      </div>
      <AvailabilityChecker />
    </div>
  );
}
