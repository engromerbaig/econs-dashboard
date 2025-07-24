'use client';

import { useState, useEffect } from 'react';
import { salaryMap } from '@/components/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { CiLogout } from 'react-icons/ci';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface AttendanceRecord {
  employee: string;
  date: string;
  status: 'present' | 'absent';
}

export default function AttendancePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<{ [employee: string]: '' | 'present' | 'absent' }>(
    Object.keys(salaryMap).reduce((acc, employee) => ({ ...acc, [employee]: '' }), {})
  );
  const [remainingEmployees, setRemainingEmployees] = useState<string[]>(Object.keys(salaryMap));
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [message, setMessage] = useState('');
  const [nextWorkingDay, setNextWorkingDay] = useState<string>('');

  // Check if selected date is a working day
  const isWorkingDayCheck = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    // Monday to Friday (1 to 5) are working days
    if (day >= 1 && day <= 5) return true;
    // Sundays (0) are not working days
    if (day === 0) return false;
    // Saturdays: alternate starting from July 26, 2025 (open)
    const referenceDate = new Date('2025-07-26');
    const diffDays = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    return weeks % 2 === 0; // Even weeks from July 26 are open
  };

  // Calculate next working day
  const getNextWorkingDay = (currentDate: string) => {
    let nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    while (!isWorkingDayCheck(nextDate.toISOString().split('T')[0])) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const formattedDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;
    return `Next working day: ${days[nextDate.getDay()]}, ${formattedDate}`;
  };

  useEffect(() => {
    setIsWorkingDay(isWorkingDayCheck(selectedDate));
    // Reset state when date changes
    setAttendance(Object.keys(salaryMap).reduce((acc, employee) => ({ ...acc, [employee]: '' }), {}));
    setRemainingEmployees(Object.keys(salaryMap));
    setMessage('');
    setNextWorkingDay(getNextWorkingDay(selectedDate));
  }, [selectedDate]);

  const handleAttendanceChange = async (employee: string, status: 'present' | 'absent') => {
    const record: AttendanceRecord = { employee, date: selectedDate, status };

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [record] }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        toast.error(`Failed to mark attendance for ${employee}: Invalid response from server`);
        console.error('JSON parse error:', jsonError);
        return;
      }

      if (res.ok && data.status === 'success') {
        toast.success(`Attendance marked for ${employee}`);
        // Remove employee from UI
        setRemainingEmployees(prev => prev.filter(emp => emp !== employee));
        // Update attendance state
        setAttendance(prev => ({ ...prev, [employee]: status }));
      } else {
        toast.error(`Failed to mark attendance for ${employee}: ${data.detail || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Failed to mark attendance for ${employee}: Network issue`);
      console.error('e in handleAttendanceChange:', error);
    }
  };

  // Dynamic employee image path
  const getEmployeeImage = (employeeName: string) => {
    const normalizedName = employeeName.toLowerCase().replace(/\s+/g, '-');
    return `/images/${normalizedName}.webp`;
  };

  return (
    <main className="min-h-screen bg-white">
     

      <div className="p-6">
        <Toaster position="top-right" />
        {remainingEmployees.length === 0 ? (
          <div className="text-center text-lg font-semibold text-green-500">
            All attendances marked
            <p className="text-sm text-gray-500 mt-2">{nextWorkingDay}</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="text-sm font-semibold mr-2">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min="2025-07-23"
                max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                className="border px-3 py-1 rounded"
              />
            </div>
            {isWorkingDay ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <AnimatePresence>
                  {remainingEmployees.map((employee) => (
                    <motion.div
                      key={employee}
                      className="flex items-center gap-4 p-4 border rounded hover:bg-gray-100"
                      initial={{ x: 0, opacity: 1 }}
                      exit={{ x: -100, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={getEmployeeImage(employee)}
                        alt={`${employee} profile picture`}
                        width={50}
                        height={50}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default.webp';
                        }}
                        unoptimized
                      />
                      <div className="flex-1">
                        <span className="font-semibold">{employee}</span>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAttendanceChange(employee, 'present')}
                            className={`px-3 py-1 rounded ${
                              attendance[employee] === 'present'
                                ? 'bg-green-300 text-white hover:bg-green-400'
                                : 'bg-gray-200 text-black hover:bg-green-400'
                            }`}
                          >
                            <FaCheck className="inline mr-1" /> Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(employee, 'absent')}
                            className={`px-3 py-1 rounded ${
                              attendance[employee] === 'absent'
                                ? 'bg-red-300 text-white hover:bg-red-400'
                                : 'bg-gray-200 text-black hover:bg-red-400'
                            }`}
                          >
                            <FaTimes className="inline mr-1" /> Absent
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Selected date is not a working day.</p>
            )}
            {message && (
              <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}