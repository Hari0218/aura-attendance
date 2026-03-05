export const mockStudents = [
  { id: "1", name: "Aarav Sharma", rollNumber: "CS-001", photo: "", attendancePercent: 92, status: "present" as const, confidence: 97.5 },
  { id: "2", name: "Priya Patel", rollNumber: "CS-002", photo: "", attendancePercent: 88, status: "present" as const, confidence: 95.2 },
  { id: "3", name: "Rahul Singh", rollNumber: "CS-003", photo: "", attendancePercent: 75, status: "absent" as const, confidence: 0 },
  { id: "4", name: "Sneha Gupta", rollNumber: "CS-004", photo: "", attendancePercent: 95, status: "present" as const, confidence: 98.1 },
  { id: "5", name: "Vikram Joshi", rollNumber: "CS-005", photo: "", attendancePercent: 62, status: "absent" as const, confidence: 0 },
  { id: "6", name: "Ananya Reddy", rollNumber: "CS-006", photo: "", attendancePercent: 91, status: "present" as const, confidence: 94.8 },
  { id: "7", name: "Karthik Nair", rollNumber: "CS-007", photo: "", attendancePercent: 85, status: "present" as const, confidence: 96.3 },
  { id: "8", name: "Meera Iyer", rollNumber: "CS-008", photo: "", attendancePercent: 78, status: "absent" as const, confidence: 0 },
  { id: "9", name: "Arjun Kumar", rollNumber: "CS-009", photo: "", attendancePercent: 93, status: "present" as const, confidence: 99.1 },
  { id: "10", name: "Divya Menon", rollNumber: "CS-010", photo: "", attendancePercent: 89, status: "present" as const, confidence: 93.7 },
  { id: "11", name: "Rohan Desai", rollNumber: "CS-011", photo: "", attendancePercent: 55, status: "absent" as const, confidence: 0 },
  { id: "12", name: "Kavya Rao", rollNumber: "CS-012", photo: "", attendancePercent: 96, status: "present" as const, confidence: 97.9 },
];

export const mockWeeklyData = [
  { day: "Mon", present: 38, absent: 4 },
  { day: "Tue", present: 40, absent: 2 },
  { day: "Wed", present: 36, absent: 6 },
  { day: "Thu", present: 39, absent: 3 },
  { day: "Fri", present: 37, absent: 5 },
];

export const mockMonthlyData = [
  { month: "Jan", rate: 88 },
  { month: "Feb", rate: 91 },
  { month: "Mar", rate: 85 },
  { month: "Apr", rate: 92 },
  { month: "May", rate: 89 },
  { month: "Jun", rate: 94 },
];

export const mockRecentActivity = [
  { id: "1", type: "attendance" as const, message: "Attendance marked for CS-301 — 38/42 present", time: "10 min ago" },
  { id: "2", type: "notification" as const, message: "Absence alert sent to 4 parents", time: "25 min ago" },
  { id: "3", type: "alert" as const, message: "Vikram Joshi absent 5 consecutive days", time: "1 hr ago" },
  { id: "4", type: "attendance" as const, message: "Attendance marked for CS-201 — 35/38 present", time: "2 hrs ago" },
  { id: "5", type: "notification" as const, message: "Weekly report generated for Section A", time: "3 hrs ago" },
];

export const mockAttendanceHistory = [
  { id: "1", date: "2026-03-05", class: "CS-301", total: 42, present: 38, absent: 4 },
  { id: "2", date: "2026-03-04", class: "CS-301", total: 42, present: 40, absent: 2 },
  { id: "3", date: "2026-03-04", class: "CS-201", total: 38, present: 35, absent: 3 },
  { id: "4", date: "2026-03-03", class: "CS-301", total: 42, present: 36, absent: 6 },
  { id: "5", date: "2026-03-03", class: "CS-201", total: 38, present: 37, absent: 1 },
  { id: "6", date: "2026-03-02", class: "CS-301", total: 42, present: 39, absent: 3 },
  { id: "7", date: "2026-03-01", class: "CS-201", total: 38, present: 34, absent: 4 },
];

export const mockNotifications = [
  { id: "1", recipient: "Vikram Joshi (Parent)", type: "absence" as const, message: "Your child has been absent for 5 consecutive days.", status: "delivered" as const, time: "1 hr ago" },
  { id: "2", recipient: "Rahul Singh", type: "absence" as const, message: "You were marked absent today in CS-301.", status: "delivered" as const, time: "2 hrs ago" },
  { id: "3", recipient: "Meera Iyer (Parent)", type: "parent" as const, message: "Attendance report for the week has been shared.", status: "pending" as const, time: "3 hrs ago" },
  { id: "4", recipient: "Rohan Desai", type: "absence" as const, message: "You have been absent 8 times this month.", status: "failed" as const, time: "1 day ago" },
];

export const mockInsights = {
  frequentlyAbsent: [
    { name: "Rohan Desai", absences: 18, trend: "increasing" as const },
    { name: "Vikram Joshi", absences: 15, trend: "increasing" as const },
    { name: "Meera Iyer", absences: 9, trend: "stable" as const },
  ],
  predictions: [
    { name: "Rohan Desai", probability: 78, risk: "high" as const },
    { name: "Vikram Joshi", probability: 65, risk: "high" as const },
    { name: "Rahul Singh", probability: 40, risk: "medium" as const },
  ],
  classTrends: [
    { className: "CS-301", currentRate: 90, previousRate: 87, change: 3 },
    { className: "CS-201", currentRate: 92, previousRate: 94, change: -2 },
  ],
};
