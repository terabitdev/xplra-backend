import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  type?: string; // Optional - some users might not have this field
  createdAt: string;
  updatedAt: string;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month are required' },
        { status: 400 }
      );
    }

    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get();

    const users = usersSnapshot.docs.map(doc => doc.data() as User);

    // Filter users: exclude Admin type OR include users without type field
    // This ensures we count regular users and users who don't have a type field yet
    const nonAdminUsers = users.filter(user => !user.type || user.type !== 'Admin');

    // Parse the selected date
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.indexOf(month);

    if (monthIndex === -1) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    // Calculate date ranges
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0); // Last day of month

    // If day is specified, filter for that specific day
    let filteredUsers = nonAdminUsers;
    if (day) {
      const specificDate = new Date(parseInt(year), monthIndex, parseInt(day));
      const nextDay = new Date(parseInt(year), monthIndex, parseInt(day) + 1);

      filteredUsers = nonAdminUsers.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= specificDate && userDate < nextDay;
      });
    } else {
      // Filter users created in the selected month
      filteredUsers = nonAdminUsers.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= startDate && userDate <= endDate;
      });
    }

    // Calculate daily growth data for the month
    const daysInMonth = endDate.getDate();
    const dailyGrowth = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStart = new Date(parseInt(year), monthIndex, d);
      const dayEnd = new Date(parseInt(year), monthIndex, d + 1);

      const usersOnDay = nonAdminUsers.filter(user => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate >= dayStart && userDate < dayEnd;
      });

      dailyGrowth.push({
        day: d,
        count: usersOnDay.length,
        isSelected: day ? parseInt(day) === d : false,
      });
    }

    // Calculate percentage relative to max
    const maxCount = Math.max(...dailyGrowth.map(d => d.count), 1);
    const growthData = dailyGrowth.map(d => ({
      ...d,
      percentage: maxCount > 0 ? Math.round((d.count / maxCount) * 100) : 0,
    }));

    return NextResponse.json({
      totalUsers: filteredUsers.length,
      dailyGrowth: growthData,
      selectedDate: day ? `${month} ${day}, ${year}` : `${month} ${year}`,
    });
  } catch (error: any) {
    console.error('Get user growth error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user growth data' },
      { status: 500 }
    );
  }
}
