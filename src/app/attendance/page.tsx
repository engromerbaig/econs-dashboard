'use client';

import { useState, useEffect } from 'react';
import { salaryMap } from '@/components/constants';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { CiLogout } from 'react-icons/ci';

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
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  useEffect(() => {
    setIsWorkingDay(isWorkingDayCheck(selectedDate));
    // Reset attendance state when date changes
    setAttendance(Object.keys(salaryMap).reduce((acc, employee) => ({ ...acc, [employee]: '' }), {}));
    setMessage('');
    setIsSubmitted(false);
  }, [selectedDate]);

  const handleAttendanceChange = (employee: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [employee]: status }));
  };

  const handleSubmit = async () => {
    const records: AttendanceRecord[] = Object.entries(attendance)
      .filter(([_, status]) => status === 'present' || status === 'absent')
      .map(([employee, status]) => ({
        employee,
        date: selectedDate,
        status: status as 'present' | 'absent',
      }));

    if (records.length === 0) {
      setMessage('Please mark attendance for at least one employee.');
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        setMessage('Error: Invalid response from server. Please try again.');
        console.error('JSON parse error:', jsonError);
        return;
      }

      if (res.ok && data.status === 'success') {
        setMessage(`Attendance saved successfully! (${data.insertedCount} records)`);
        setIsSubmitted(true);
        // Reset attendance state
        setAttendance(Object.keys(salaryMap).reduce((acc, employee) => ({ ...acc, [employee]: '' }), {}));
      } else {
        setMessage(`Error: ${data.detail || data.message || 'Failed to save attendance.'}`);
      }
    } catch (error) {
      setMessage('Error: Network issue or server is unavailable.');
      console.error('Error in handleSubmit:', error);
    }
  };

  const getEmployeeImage = (employeeName: string) => {
    const normalizedName = employeeName.toLowerCase().replace(/\s+/g, '-');
    return `/images/${normalizedName}.webp`;
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Top Navbar */}
      <div className="bg-econs-blue border-b px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg text-white font-semibold">Mark Attendance</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-black text-white px-4 py-1 rounded cursor-pointer hover:bg-black/80"
          >
            Dashboard
          </button>
          <button
            onClick={async () => {
              await fetch('/api/logout', { method: 'POST' });
              router.push('/');
            }}
            className="bg-black text-white px-4 py-1 rounded cursor-pointer hover:bg-black/80"
          >
            <CiLogout className="inline mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="p-6">
        {isSubmitted ? (
          <div className="text-center text-lg font-semibold text-green-500">
            All attendances marked
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {Object.keys(salaryMap).map((employee) => (
                    <div
                      key={employee}
                      className="flex items-center gap-4 p-4 border rounded hover:bg-gray-100"
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
                      />
                      <div className="flex-1">
                        <span className="font-semibold">{employee}</span>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAttendanceChange(employee, 'present')}
                            className={`px-3 py-1 rounded ${
                              attendance[employee] === 'present'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-black'
                            }`}
                          >
                            <FaCheck className="inline mr-1" /> Present
                          </button>
                          <button
                            onClick={() => handleAttendanceChange(employee, 'absent')}
                            className={`px-3 py-1 rounded ${
                              attendance[employee] === 'absent'
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-black'
                            }`}
                          >
                            <FaTimes className="inline mr-1" /> Absent
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Save Attendance
                </button>
                {message && (
                  <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                    {message}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Selected date is not a working day.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}