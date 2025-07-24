
'use client';

import { useState, useEffect } from 'react';
import { salaryMap } from '@/components/constants';
import { FaCheck, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

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
  const [attendance, setAttendance] = useState<{ [employee: string]: '' | 'present' | 'absent' }>({});
  const [remainingEmployees, setRemainingEmployees] = useState<string[]>([]);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

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

  // Check if date is in the future
  const isFutureDate = (dateStr: string) => {
    const selected = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day
    return selected > now;
  };

  // Navigate to previous or next day
  const changeDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    const newDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDate);
  };

  // Fetch attendance records for the selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/attendance?date=${selectedDate}`);
        let data;
        try {
          data = await res.json();
        } catch (jsonError) {
          toast.error('Failed to fetch attendance: Invalid response from server');
          console.error('JSON parse error:', jsonError);
          return;
        }

        if (res.ok && data.status === 'success') {
          const markedEmployees = data.records.map((record: AttendanceRecord) => record.employee);
          const remaining = Object.keys(salaryMap).filter(
            (employee) => !markedEmployees.includes(employee)
          );
          setRemainingEmployees(remaining);
          setAttendance(
            Object.keys(salaryMap).reduce(
              (acc, employee) => ({
                ...acc,
                [employee]: markedEmployees.includes(employee)
                  ? data.records.find((r: AttendanceRecord) => r.employee === employee).status
                  : '',
              }),
              {}
            )
          );
        } else {
          toast.error(`Failed to fetch attendance: ${data.detail || data.message || 'Unknown error'}`);
          setRemainingEmployees(Object.keys(salaryMap)); // Fallback to all employees on error
        }
      } catch (error) {
        toast.error('Failed to fetch attendance: Network issue');
        console.error('Error fetching attendance:', error);
        setRemainingEmployees(Object.keys(salaryMap)); // Fallback to all employees on error
      } finally {
        setIsLoading(false);
      }
    };

    setIsWorkingDay(isWorkingDayCheck(selectedDate));
    fetchAttendance();
  }, [selectedDate]);

  const handleAttendanceChange = (employee: string, status: 'present' | 'absent') => {
    setAttendance((prev) => ({ ...prev, [employee]: status }));
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
      toast.error('Please mark attendance for at least one employee.');
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
        toast.error('Failed to mark attendance: Invalid response from server');
        console.error('JSON parse error:', jsonError);
        return;
      }

      if (res.ok && data.status === 'success') {
        toast.success(`Attendance saved successfully! (${data.insertedCount} records)`);
        setRemainingEmployees((prev) => prev.filter((emp) => !records.some((r) => r.employee === emp)));
        setAttendance(
          Object.keys(salaryMap).reduce(
            (acc: { [employee: string]: '' | 'present' | 'absent' }, employee) => ({
              ...acc,
              [employee]: records.find((r) => r.employee === employee)?.status || acc[employee] || '',
            }),
            {} as { [employee: string]: '' | 'present' | 'absent' }
          )
        );
      } else {
        toast.error(`Failed to mark attendance: ${data.detail || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to mark attendance: Network issue');
      console.error('Error in handleSubmit:', error);
    }
  };

  const markAllAttendance = async (status: 'present' | 'absent') => {
    const records: AttendanceRecord[] = remainingEmployees.map((employee) => ({
      employee,
      date: selectedDate,
      status,
    }));

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
        toast.error(`Failed to mark bulk attendance: Invalid response from server`);
        console.error('JSON parse error:', jsonError);
        return;
      }

      if (res.ok && data.status === 'success') {
        toast.success(`Marked all as ${status} (${data.insertedCount} records)`);
        setRemainingEmployees([]);
        setAttendance(
          Object.keys(salaryMap).reduce(
            (acc: { [employee: string]: '' | 'present' | 'absent' }, employee) => ({
              ...acc,
              [employee]: remainingEmployees.includes(employee) ? status : acc[employee] || '',
            }),
            {} as { [employee: string]: '' | 'present' | 'absent' }
          )
        );
      } else {
        toast.error(`Failed to mark bulk attendance: ${data.detail || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error('Failed to mark bulk attendance: Network issue');
      console.error('Error in markAllAttendance:', error);
    }
  };

  return (
    <div className="mb-6 p-6 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Mark Attendance</h2>
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => changeDate('prev')}
          className="bg-black text-white px-3 py-1 rounded hover:bg-black/80 flex items-center"
        >
          <FaArrowLeft className="mr-2" /> Previous
        </button>
        <div>
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
        <button
          onClick={() => changeDate('next')}
          disabled={isFutureDate(selectedDate)}
          className={`px-3 py-1 rounded flex items-center ${
            isFutureDate(selectedDate)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-black/80'
          }`}
        >
          Next <FaArrowRight className="ml-2" />
        </button>
      </div>
      {isLoading ? (
        <div className="text-center text-lg font-semibold text-gray-500">
          Loading attendance...
        </div>
      ) : isWorkingDay ? (
        <>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => markAllAttendance('present')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAllAttendance('absent')}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Mark All Absent
            </button>
          </div>
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
                {remainingEmployees.map((employee) => (
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
        </>
      ) : (
        <p className="text-sm text-gray-500">Selected date is not a working day.</p>
      )}
      <Toaster position="top-right" />
    </div>
  );
}
