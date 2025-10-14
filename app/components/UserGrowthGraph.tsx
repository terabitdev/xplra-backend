'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ChevronDown } from 'lucide-react';

interface DailyGrowth {
  day: number;
  month?: string;
  count: number;
  percentage: number;
  isSelected: boolean;
}

interface GrowthData {
  totalUsers: number;
  dailyGrowth: DailyGrowth[];
  selectedDate: string;
}

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
  const [selectedDay, setSelectedDay] = useState<number | null>(getCurrentDay());
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<DailyGrowth[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Fetch user growth data for all months
  useEffect(() => {
    const fetchGrowthData = async () => {
      setLoading(true);
      try {
        // Show only 6 months with selected month in center (2 before, selected, 3 after)
        const selectedMonthIndex = months.indexOf(selectedMonth);
        let startIndex = selectedMonthIndex - 2;
        let endIndex = selectedMonthIndex + 4; // selected + 3 after = 4

        // Adjust if we're at the beginning or end of the year
        if (startIndex < 0) {
          startIndex = 0;
          endIndex = Math.min(6, months.length);
        } else if (endIndex > months.length) {
          endIndex = months.length;
          startIndex = Math.max(0, endIndex - 6);
        }

        const reorderedMonths = months.slice(startIndex, endIndex);

        // Fetch data for the 6 months in the range
        const monthlyData = await Promise.all(
          reorderedMonths.map(async (month, index) => {
            const params = new URLSearchParams({
              year: selectedYear.toString(),
              month: month,
            });

            try {
              const response = await fetch(`/api/users/growth?${params}`);
              const data: GrowthData = await response.json();

              if (response.ok) {
                // Sum up all users for this month
                const totalCount = data.dailyGrowth.reduce((sum, d) => sum + d.count, 0);
                return {
                  day: index + 1,
                  month: month.substring(0, 3),
                  count: totalCount,
                  percentage: 0, // Will calculate after we get all data
                  isSelected: month === selectedMonth,
                };
              }
              return {
                day: index + 1,
                month: month.substring(0, 3),
                count: 0,
                percentage: 0,
                isSelected: month === selectedMonth,
              };
            } catch (error) {
              console.error(`Error fetching data for ${month}:`, error);
              return {
                day: index + 1,
                month: month.substring(0, 3),
                count: 0,
                percentage: 0,
                isSelected: month === selectedMonth,
              };
            }
          })
        );

        // Calculate percentages based on max count
        const maxCount = Math.max(...monthlyData.map(d => d.count));
        const dataWithPercentages = monthlyData.map(d => ({
          ...d,
          percentage: maxCount > 0 ? (d.count / maxCount) * 100 : 0,
        }));

        setChartData(dataWithPercentages);

        // Calculate total users from all months
        const total = monthlyData.reduce((sum, d) => sum + d.count, 0);
        setTotalUsers(total);
      } catch (error) {
        console.error('Error fetching growth data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGrowthData();
  }, [selectedMonth, selectedYear]);

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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-2xl font-semibold mb-2 sm:mb-0 text-gray-900">New Users</h2>
        <div className="flex flex-row items-center gap-2">
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

      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Total Non-Admin Users: {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
              <span className="text-gray-500">Loading...</span>
            </span>
          ) : (
            <span className="font-semibold text-gray-900">{totalUsers}</span>
          )}
        </div>
      </div>

      <div className="h-80 w-full">
        {loading ? (
          <div className="flex gap-2 items-center justify-center h-full">
            <span className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></span>
            <span className="text-gray-500 text-xl">Loading...</span>
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
                interval={0}
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

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DailyGrowth;
                    return (
                      <div className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-lg">
                        <p className="text-sm text-gray-600">{data.month || `Day ${data.day}`}</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {data.count} user{data.count !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">{data.percentage}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
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
                      <g key={props.index ?? payload?.day ?? `${props.cx}-${props.cy}`}>
                        {payload.count > 0 && (
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
