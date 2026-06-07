from flask import Blueprint, request, jsonify
import psycopg2
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

meetings_bp = Blueprint('meetings', __name__)

def get_db():
    return psycopg2.connect(Config.SUPABASE_DB_URL)

# GET all meetings
@meetings_bp.route('/api/meetings', methods=['GET'])
def get_meetings():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT m.id, m.title, m.date, m.created_at,
                   s.content as summary
            FROM meetings m
            LEFT JOIN summaries s ON s.meeting_id = m.id
            ORDER BY m.created_at DESC
        """)
        rows = cur.fetchall()
        meetings = []
        for row in rows:
            meetings.append({
                "id": row[0],
                "title": row[1],
                "date": str(row[2]),
                "created_at": str(row[3]),
                "summary": row[4]
            })
        cur.close()
        conn.close()
        return jsonify(meetings)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# GET single meeting with all details
@meetings_bp.route('/api/meetings/<int:meeting_id>', methods=['GET'])
def get_meeting(meeting_id):
    try:
        conn = get_db()
        cur = conn.cursor()

        # Get meeting
        cur.execute("SELECT id, title, date, created_at FROM meetings WHERE id = %s", (meeting_id,))
        m = cur.fetchone()
        if not m:
            return jsonify({"error": "Meeting not found"}), 404

        # Get transcript
        cur.execute("SELECT content FROM transcripts WHERE meeting_id = %s", (meeting_id,))
        transcript = cur.fetchone()

        # Get summary
        cur.execute("SELECT content FROM summaries WHERE meeting_id = %s", (meeting_id,))
        summary = cur.fetchone()

        # Get action items
        cur.execute("SELECT id, description, assignee, due_date FROM action_items WHERE meeting_id = %s", (meeting_id,))
        action_rows = cur.fetchall()
        action_items = [{"id": r[0], "description": r[1], "assignee": r[2], "due_date": str(r[3]) if r[3] else None} for r in action_rows]

        # Get decisions
        cur.execute("SELECT id, description FROM decisions WHERE meeting_id = %s", (meeting_id,))
        decision_rows = cur.fetchall()
        decisions = [{"id": r[0], "description": r[1]} for r in decision_rows]

        cur.close()
        conn.close()

        return jsonify({
            "id": m[0],
            "title": m[1],
            "date": str(m[2]),
            "created_at": str(m[3]),
            "transcript": transcript[0] if transcript else None,
            "summary": summary[0] if summary else None,
            "action_items": action_items,
            "decisions": decisions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# DELETE a meeting
@meetings_bp.route('/api/meetings/<int:meeting_id>', methods=['DELETE'])
def delete_meeting(meeting_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM meetings WHERE id = %s", (meeting_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "Meeting deleted"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500