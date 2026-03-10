from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from database.config import get_db
from .auth import get_current_user
from typing import Optional
import csv
import io

router = APIRouter()


async def _get_attendance_with_students(db, query):
    """Helper to get attendance records with student details."""
    records = await db.attendance.find(query).sort("date", -1).to_list(length=10000)
    results = []
    for att in records:
        student = await db.students.find_one({"_id": att["student_id"]})
        if student:
            results.append((att, student))
    return results


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard statistics."""
    total_students = await db.students.count_documents({})

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    attendance_today = await db.attendance.find({"date": {"$gte": today_start}}).to_list(length=10000)

    present_today = len([a for a in attendance_today if a["status"] == "PRESENT"])
    absent_today = len([a for a in attendance_today if a["status"] == "ABSENT"])

    attendance_rate = (present_today / total_students * 100) if total_students > 0 else 0

    # Trend vs yesterday
    yesterday_start = today_start - timedelta(days=1)
    attendance_yesterday = await db.attendance.find({
        "date": {"$gte": yesterday_start, "$lt": today_start}
    }).to_list(length=10000)
    present_yesterday = len([a for a in attendance_yesterday if a["status"] == "PRESENT"])
    yesterday_rate = (present_yesterday / total_students * 100) if total_students > 0 else 0
    trend = attendance_rate - yesterday_rate

    return {
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": absent_today,
        "attendance_rate": f"{attendance_rate:.1f}%",
        "trend": f"{'+' if trend >= 0 else ''}{trend:.1f}%",
        "trend_up": trend >= 0
    }


@router.get("/")
async def get_attendance_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    class_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get attendance report summary."""
    query = {}
    if start_date:
        try:
            query.setdefault("date", {})["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            query.setdefault("date", {})["$lt"] = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    results = await _get_attendance_with_students(db, query)

    # Filter by class if specified
    if class_id:
        results = [(att, st) for att, st in results if st.get("class_id") == class_id]

    # Build per-student summary
    student_summary = {}
    for att, student in results:
        sid = student["_id"]
        if sid not in student_summary:
            student_summary[sid] = {
                "student_id": sid,
                "student_name": student["name"],
                "roll_number": student["roll_number"],
                "class_id": student.get("class_id", ""),
                "present_count": 0,
                "absent_count": 0,
                "total_days": 0,
                "avg_confidence": 0.0,
                "confidences": []
            }
        entry = student_summary[sid]
        entry["total_days"] += 1
        if att["status"] == "PRESENT":
            entry["present_count"] += 1
            if att.get("confidence"):
                entry["confidences"].append(att["confidence"])
        else:
            entry["absent_count"] += 1

    for sid, entry in student_summary.items():
        if entry["confidences"]:
            entry["avg_confidence"] = round(sum(entry["confidences"]) / len(entry["confidences"]), 4)
        del entry["confidences"]
        entry["attendance_rate"] = round(
            (entry["present_count"] / entry["total_days"] * 100) if entry["total_days"] > 0 else 0, 1
        )

    return {
        "total_records": len(results),
        "students": list(student_summary.values())
    }


@router.get("/download/csv")
async def download_csv_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    class_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Download attendance report as CSV."""
    query = {}
    if start_date:
        try:
            query.setdefault("date", {})["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            query.setdefault("date", {})["$lt"] = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    results = await _get_attendance_with_students(db, query)
    if class_id:
        results = [(att, st) for att, st in results if st.get("class_id") == class_id]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Student Name", "Roll Number", "Class", "Status", "Confidence"])

    for att, student in results:
        writer.writerow([
            att["date"].strftime("%Y-%m-%d %H:%M") if att.get("date") else "",
            student["name"],
            student["roll_number"],
            student.get("class_id", ""),
            att["status"],
            f"{att.get('confidence', 0.0):.4f}"
        ])

    output.seek(0)
    filename = f"attendance_report_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/download/pdf")
async def download_pdf_report(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    class_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Download attendance report as PDF."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab not installed. Run: pip install reportlab")

    query = {}
    if start_date:
        try:
            query.setdefault("date", {})["$gte"] = datetime.strptime(start_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            query.setdefault("date", {})["$lt"] = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    results = await _get_attendance_with_students(db, query)
    if class_id:
        results = [(att, st) for att, st in results if st.get("class_id") == class_id]

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Attendance Report", styles['Title']))
    elements.append(Paragraph(
        f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        styles['Normal']
    ))
    elements.append(Spacer(1, 20))

    table_data = [["Date", "Student Name", "Roll Number", "Class", "Status", "Confidence"]]
    for att, student in results:
        table_data.append([
            att["date"].strftime("%Y-%m-%d %H:%M") if att.get("date") else "",
            student["name"],
            student["roll_number"],
            student.get("class_id", ""),
            att["status"],
            f"{att.get('confidence', 0.0):.2f}"
        ])

    if len(table_data) > 1:
        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F9FAFB')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F3F4F6')]),
        ]))
        elements.append(table)
    else:
        elements.append(Paragraph("No attendance records found.", styles['Normal']))

    total_present = len([r for r in results if r[0]["status"] == "PRESENT"])
    total_absent = len([r for r in results if r[0]["status"] == "ABSENT"])
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"Total Present: {total_present} | Total Absent: {total_absent} | Total Records: {len(results)}",
        styles['Normal']
    ))

    doc.build(elements)
    buffer.seek(0)

    filename = f"attendance_report_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
