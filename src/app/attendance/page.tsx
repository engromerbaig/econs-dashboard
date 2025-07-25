'use client';

import { useState, useEffect } from 'react';
import { salaryMap } from '@/components/constants';
import Image from 'next/image';
import { FaCheck, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation'; // Import useRouter

interface AttendanceRecord {
  employee: string;
  date: string;
  status: 'present' | 'absent';
}

export default function AttendancePage() {
  const router = useRouter(); // Initialize router
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState<Record<string, '' | 'present' | 'absent'>>({});
  const [remainingEmployees, setRemainingEmployees] = useState<string[]>([]);
  const [isWorkingDay, setIsWorkingDay] = useState(true);
  const [nextWorkingDay, setNextWorkingDay] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Format date as "Aug 7 2025, Monday"
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  // Check if selected date is a working day
  const isWorkingDayCheck = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    if (day >= 1 && day <= 5) return true; // Monday to Friday
    if (day === 0) return false; // Sunday
    const referenceDate = new Date('2025-07-26');
    const diffDays = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    return weeks % 2 === 0; // Even weeks from July 26 are open
  };

  // Determine if the selected date is the last working day of the week
  const isLastWorkingDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0); // Normalize to start of day
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Find Saturday of the same week
    const saturday = new Date(date);
    saturday.setDate(date.getDate() + (6 - day)); // Move to Saturday of current week
    const saturdayDateStr = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
    
    // Check if Saturday is a working day (using the existing isWorkingDayCheck function)
    const isSaturdayOpen = isWorkingDayCheck(saturdayDateStr);
    
    console.log(`Date: ${dateStr}, Day: ${day}, Saturday (${saturdayDateStr}) Open: ${isSaturdayOpen}`); // Debug log
    
    if (isSaturdayOpen && day === 6) {
      // If Saturday is open and current date is Saturday, it's the last working day
      console.log(`${dateStr} is Saturday and last working day (even week)`);
      return true;
    }
    
    if (!isSaturdayOpen && day === 5) {
      // If Saturday is closed and current date is Friday, it's the last working day
      console.log(`${dateStr} is Friday and last working day (odd week - Saturday closed)`);
      return true;
    }
    
    console.log(`${dateStr} is not the last working day`);
    return false;
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

  // Check if date is in the future
  const isFutureDate = (dateStr: string) => {
    const selected = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return selected > now;
  };

  // Filter employees based on selected date and exclude Lawyer/Cleaner
  const getActiveEmployees = (dateStr: string) => {
    const selected = new Date(dateStr);
    selected.setHours(0, 0, 0, 0);
    const isLastDay = isLastWorkingDayOfWeek(dateStr);
    return Object.keys(salaryMap).filter((employee) => {
      if (employee === 'Lawyer' || employee === 'Cleaner') return false; // Exclude Lawyer and Cleaner
      if (employee === 'Usman' && !isLastDay) {
        console.log(`Excluding Usman for ${dateStr} (not last working day)`); // Debug log
        return false; // Usman only on last working day
      }
      const departureDate = salaryMap[employee].departureDate;
      if (!departureDate) {
        console.log(`Including ${employee} for ${dateStr} (no departure date)`); // Debug log
        return true; // Current employee
      }
      const departure = new Date(departureDate);
      departure.setHours(0, 0, 0, 0);
      const isActive = selected <= departure;
      console.log(`Checking ${employee} for ${dateStr}: Departure ${departureDate}, Active: ${isActive}`); // Debug log
      return isActive; // Include if selected date is on or before departure
    });
  };

  // Navigate to previous or next day
  const changeDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + (direction === 'prev' ? -1 : 1));
    const newDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    setSelectedDate(newDate);
  };

  // Bulk mark attendance
  const markAllAttendance = async (status: 'present' | 'absent') => {
    const activeEmployees = getActiveEmployees(selectedDate);
    const records: AttendanceRecord[] = remainingEmployees
      .filter((employee) => activeEmployees.includes(employee))
      .map((employee) => ({
        employee,
        date: selectedDate,
        status,
      }));

    if (records.length === 0) {
      toast.error('No employees to mark for this date.');
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
        toast.error(`Failed to mark bulk attendance: Invalid response from server`);
        console.error('JSON parse error:', jsonError);
        return;
      }

      if (res.ok && data.status === 'success') {
        toast.success(`Marked all as ${status} (${data.insertedCount} records)`);
        setRemainingEmployees([]);
        setAttendance(
          Object.keys(salaryMap).reduce(
            (acc, employee) => ({
              ...acc,
              [employee]: activeEmployees.includes(employee) && remainingEmployees.includes(employee)
                ? status
                : acc[employee] || '',
            }),
            {} as Record<string, '' | 'present' | 'absent'>
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
          const activeEmployees = getActiveEmployees(selectedDate);
          console.log(`Active employees for ${selectedDate}:`, activeEmployees); // Debug log
          const markedEmployees = data.records.map((record: AttendanceRecord) => record.employee);
          const remaining = activeEmployees.filter(
            (employee) => !markedEmployees.includes(employee)
          );
          console.log(`Remaining employees for ${selectedDate}:`, remaining); // Debug log
          setRemainingEmployees(remaining);
          setAttendance(
            Object.keys(salaryMap).reduce(
              (acc, employee) => ({
                ...acc,
                [employee]: activeEmployees.includes(employee) && markedEmployees.includes(employee)
                  ? data.records.find((r: AttendanceRecord) => r.employee === employee).status
                  : '',
              }),
              {} as Record<string, '' | 'present' | 'absent'>
            )
          );
        } else {
          toast.error(`Failed to fetch attendance: ${data.detail || data.message || 'Unknown error'}`);
          setRemainingEmployees(getActiveEmployees(selectedDate));
        }
      } catch (error) {
        toast.error('Failed to fetch attendance: Network issue');
        console.error('Error fetching attendance:', error);
        setRemainingEmployees(getActiveEmployees(selectedDate));
      } finally {
        setIsLoading(false);
      }
    };

    setIsWorkingDay(isWorkingDayCheck(selectedDate));
    setNextWorkingDay(getNextWorkingDay(selectedDate));
    fetchAttendance();
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
        setRemainingEmployees((prev) => prev.filter((emp) => emp !== employee));
        setAttendance((prev) => ({ ...prev, [employee]: status }));
      } else {
        toast.error(`Failed to mark attendance for ${employee}: ${data.detail || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.error(`Failed to mark attendance for ${employee}: Network issue`);
      console.error('Error in handleAttendanceChange:', error);
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
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() => changeDate('prev')}
            className="bg-black text-white px-3 py-1 rounded hover:bg-black/80 flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Previous
          </button>
          <div className="flex flex-col items-center">
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
            <p className="text-sm text-gray-500 mt-2">{formatDisplayDate(selectedDate)}</p>
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
        ) : remainingEmployees.length === 0 ? (
          <div className="text-center text-lg font-semibold text-green-500">
            All attendances marked
            <p className="text-sm text-gray-500 mt-2">{nextWorkingDay}</p>
          </div>
        ) : (
          <>
            {isWorkingDay ? (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <AnimatePresence>
                    {remainingEmployees.map((employee) => (
                      <motion.div
                        key={employee}
                        className="flex items-center gap-4 p-4 border rounded hover:bg-gray-100 cursor-pointer" // Added cursor-pointer
                        initial={{ x: 0, opacity: 1 }}
                        exit={{ x: -100, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => router.push(`/dashboard/${encodeURIComponent(employee)}`)} // Added click event
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
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click from triggering navigation
                                handleAttendanceChange(employee, 'present');
                              }}
                              className={`px-3 py-1 cursor-pointer rounded ${
                                attendance[employee] === 'present'
                                  ? 'bg-green-300 text-white hover:bg-green-400'
                                  : 'bg-green-200 text-black hover:bg-green-400'
                              }`}
                            >
                              <FaCheck className="inline mr-1" /> Present
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent card click from triggering navigation
                                handleAttendanceChange(employee, 'absent');
                              }}
                              className={`px-3 py-1 cursor-pointer rounded ${
                                attendance[employee] === 'absent'
                                  ? 'bg-red-300 text-white hover:bg-red-400'
                                  : 'bg-red-200 text-black hover:bg-red-400'
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