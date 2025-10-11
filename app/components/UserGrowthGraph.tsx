'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts';
import { ChevronDown } from 'lucide-react';

export default function UserGrowthGraph() {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const getCurrentMonth = () => months[new Date().getMonth()];
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentDay = () => new Date().getDate();

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sample chart data - replace with actual data
  const chartData = [
    { month: 'Jan', percentage: 20, value: 5 },
    { month: 'Feb', percentage: 40, value: 10 },
    { month: 'Mar', percentage: 60, value: 15 },
    { month: 'Apr', percentage: 45, value: 12 },
    { month: 'May', percentage: 80, value: 20, isSelected: true },
    { month: 'Jun', percentage: 55, value: 14 },
  ];

  const getAvailableYears = () => {
    const currentYear = getCurrentYear();
    const years = [];
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year);
    }
    return years.reverse();
  };

  const getAvailableDays = () => {
    const monthIndex = months.indexOf(selectedMonth);
    const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  return (
    <div className="bg-white p-6 rounded-lg font-DMSansRegular shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">New Users</h2>
        <div className="flex items-center gap-2">
          {/* Year Dropdown */}
          <div className="relative date-dropdown">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[80px]"
            >
              <span>{selectedYear}</span>
              <ChevronDown size={14} />
            </button>

            {showYearDropdown && (
              <div className="absolute right-0 mt-2 w-24 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {getAvailableYears().map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearDropdown(false);
                    }}
                    className={`block w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                      year === selectedYear
                        ? 'bg-gray-100 text-blue-600 font-semibold'
                        : 'text-black'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Month Dropdown */}
          <div className="relative date-dropdown">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[120px]"
            >
              <span>{selectedMonth}</span>
              <ChevronDown size={14} />
            </button>

            {showMonthDropdown && (
              <div className="absolute right-0 mt-2 w-36 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setShowMonthDropdown(false);
                    }}
                    className={`block w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                      month === selectedMonth
                        ? 'bg-gray-100 text-blue-600 font-semibold'
                        : 'text-black'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Day Dropdown */}
          <div className="relative date-dropdown">
            <button
              onClick={() => setShowDayDropdown(!showDayDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[70px]"
            >
              <span>{selectedDay}</span>
              <ChevronDown size={14} />
            </button>

            {showDayDropdown && (
              <div className="absolute right-0 mt-2 w-20 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                {getAvailableDays().map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setShowDayDropdown(false);
                    }}
                    className={`block w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                      day === selectedDay
                        ? 'bg-gray-100 text-blue-600 font-semibold'
                        : 'text-black'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading chart data...</div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>

                <linearGradient id="userBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>

                <radialGradient id="userDotGradient" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
                </radialGradient>
              </defs>

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#9ca3af' }}
                dy={10}
              />

              <YAxis
                domain={[0, 100]}
                ticks={[20, 40, 60, 80, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 14, fill: '#9ca3af' }}
                tickFormatter={(value) => `${value}%`}
                dx={-10}
              />

              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#2563eb"
                strokeWidth={3}
                fill="url(#areaGradient)"
                dot={(props) => {
                  const { payload } = props;
                  if (payload?.isSelected) {
                    const bottomY = 280;
                    const barHeight = bottomY - props.cy;

                    return (
                      <g key={props.index ?? payload?.month ?? `${props.cx}-${props.cy}`}>
                        {payload.value > 0 && (
                          <rect
                            x={props.cx - 12}
                            y={props.cy}
                            width={24}
                            height={barHeight}
                            fill="url(#userBarGradient)"
                            stroke="none"
                            rx={0}
                          />
                        )}
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={12}
                          fill="#ffffff"
                          stroke="#2563eb"
                          strokeWidth={3}
                        />
                      </g>
                    );
                  }
                  return <></>;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">No data available</div>
          </div>
        )}
      </div>
    </div>
  );
}
