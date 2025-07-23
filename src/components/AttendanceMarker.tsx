'use client';

import { useState, useEffect } from 'react';
import { salaryMap } from './constants';

interface AttendanceRecord {
  employee: string;
  date: string;
  status: 'present' | 'absent';
}

export default function AttendanceMarker() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<{ [employee: string]: '' | 'present' | 'absent' }>(
    Object.keys(salaryMap).reduce((acc, employee) => ({ ...acc, [employee]: '' }), {})
  );
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [message, setMessage] = useState('');

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
  }, [selectedDate]);

  const handleAttendanceChange = (employee: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [employee]: status }));
  };

  const handleSubmit = async () => {
    // Filter and map to ensure only valid AttendanceRecord objects
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

  return (
    <div className="mb-6 p-6 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Mark Attendance</h2>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Employee</th>
                  <th className="p-2 text-center">Present</th>
                  <th className="p-2 text-center">Absent</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(salaryMap).map((employee) => (
                  <tr key={employee} className="border-b">
                    <td className="p-2">{employee}</td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name={`attendance-${employee}`}
                        checked={attendance[employee] === 'present'}
                        onChange={() => handleAttendanceChange(employee, 'present')}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="radio"
                        name={`attendance-${employee}`}
                        checked={attendance[employee] === 'absent'}
                        onChange={() => handleAttendanceChange(employee, 'absent')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSubmit}
            className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
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
    </div>
  );
}