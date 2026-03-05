

# AI-Powered Attendance System — Implementation Plan

## Design System
- **Color palette**: Indigo primary, slate grays, white backgrounds, soft gradients
- **Style**: Clean SaaS aesthetic inspired by Linear/Notion — rounded cards, subtle shadows, smooth animations
- **Dark/Light mode** toggle throughout
- **Mobile responsive** on all pages

## Layout
- **Sidebar navigation** with icons: Dashboard, Mark Attendance, Students, Attendance History, Notifications, AI Insights, Settings
- Collapsible sidebar with smooth transitions
- Top header bar with teacher profile avatar, dark mode toggle, and notification bell

## Pages

### 1. Login Page
- Centered card with email/password form and "Forgot Password" link
- Animated AI face-recognition illustration on the side (CSS/SVG animation)
- Gradient background with subtle floating shapes

### 2. Dashboard
- **4 stat cards** at top: Total Students, Present Today, Absent Today, Attendance %
- Each card with icon, number, and trend indicator (↑/↓)
- **Weekly Attendance** bar chart and **Monthly Trends** line chart (Recharts)
- **Recent Activity** feed: attendance sessions, notifications, alerts with timestamps
- Loading skeletons while data loads

### 3. Mark Attendance (Core Feature)
- Drag-and-drop image upload zone with preview
- **Real-time processing animation**: 4 animated steps (Detecting Faces → Matching → Verifying → Generating)
- **Results panel**: recognized/absent counts, confidence score, timestamp
- **Student cards grid**: photo, name, status badge (Present/Absent), confidence %
- Action buttons: Confirm Attendance, Re-scan, Download Report

### 4. Student Management
- Searchable/filterable student table/grid
- Student cards showing photo, name, roll number, attendance %
- Add/Edit student modal with face image upload
- Individual student profile page with attendance history

### 5. Attendance History
- Data table with date, class, total/present/absent columns
- Filters: date range picker, class dropdown, student search
- Download report button (CSV/PDF export)

### 6. Notifications
- Compose notification form: select students, type (absence/parent alert), message
- Notification log table: recipient, message, delivery status, timestamp

### 7. AI Insights
- Visual cards: Frequently Absent Students, Attendance Predictions, Risk Alerts
- Class attendance trend charts
- Color-coded risk indicators

### 8. Settings & Profile
- Teacher profile page with avatar and details
- App settings: theme, notification preferences

## Interactions & Polish
- Smooth page transitions and micro-animations
- Toast notifications for actions (confirm, errors)
- Loading skeletons on all data views
- Modern icon system (Lucide icons)
- All data will be mock/static for now — ready to connect to a real backend later

