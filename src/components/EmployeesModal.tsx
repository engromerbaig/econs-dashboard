'use client';

import { useEffect } from 'react';
import { salaryMap } from './constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}

export default function EmployeesModal({ isOpen, onClose, router }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getEmployeeImage = (employeeName: string) => {
    const normalizedName = employeeName.toLowerCase().replace(/\s+/g, '-');
    return `/images/${normalizedName}.webp`;
  };

  // Filter active employees based on today's date
  const getActiveEmployees = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    return Object.keys(salaryMap).filter((employee) => {
      const departureDate = salaryMap[employee].departureDate;
      if (!departureDate) return true; // Current employee
      const departure = new Date(departureDate);
      departure.setHours(0, 0, 0, 0); // Normalize to start of day
      return departure >= today; // Include if departure is today or future
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Employees</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {getActiveEmployees().map((employee) => (
            <div
              key={employee}
              className="flex items-center gap-4 p-4 border rounded hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                router.push(`/dashboard/${encodeURIComponent(employee)}`);
                onClose();
              }}
            >
              <Image
                src={getEmployeeImage(employee)}
                alt={`${employee} profile picture`}
                width={80}
                height={80}
                className="rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/images/default.webp';
                }}
              />
              <span className="font-semibold">{employee}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
