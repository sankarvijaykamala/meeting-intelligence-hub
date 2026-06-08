from flask import Blueprint, request, jsonify
import psycopg2
import os
import sys
from groq import Groq
import json
import tempfile
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

process_bp = Blueprint('process', __name__)

def get_db():
    return psycopg2.connect(Config.SUPABASE_DB_URL)

# Initialize Groq client
groq_client = Groq(api_key=Config.GROQ_API_KEY)
print("Groq client initialized.")

def transcribe_audio(audio_path):
    """Use Groq Whisper API to transcribe — fast, no local model needed"""
    with open(audio_path, "rb") as audio_file:
        transcription = groq_client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), audio_file),
            model="whisper-large-v3",
            response_format="text"
        )
    return transcription

def run_ai_agents(transcript_text):
    prompt = f"""You are a meeting intelligence agent. Analyze the following meeting transcript and extract structured information.

TRANSCRIPT:
{transcript_text}

Return a JSON object with exactly this structure (no extra text, no markdown, just raw JSON):
{{
    "summary": "2-3 sentence summary of what the meeting was about",
    "action_items": [
        {{
            "description": "specific task to be done",
            "assignee": "person name or null",
            "due_date": null
        }}
    ],
    "decisions": [
        {{
            "description": "decision that was made"
        }}
    ]
}}
"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000
    )

    response_text = response.choices[0].message.content

    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0]
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0]

    print("=== GROQ RESPONSE ===")
    print(response_text)
    print("=====================")

    return json.loads(response_text.strip())

def save_to_db(conn, meeting_id, transcript, ai_results):
    """Save all extracted data to Supabase"""
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO transcripts (meeting_id, content) VALUES (%s, %s)",
        (meeting_id, transcript)
    )

    cur.execute(
        "INSERT INTO summaries (meeting_id, content) VALUES (%s, %s)",
        (meeting_id, ai_results["summary"])
    )

    for item in ai_results.get("action_items", []):
        due_date = item.get("due_date")

        try:
            if due_date:
                datetime.strptime(due_date, "%Y-%m-%d")
            else:
                due_date = None
        except:
            due_date = None

        cur.execute(
            "INSERT INTO action_items (meeting_id, description, assignee, due_date) VALUES (%s, %s, %s, %s)",
            (
                meeting_id,
                item["description"],
                item.get("assignee"),
                due_date
            )
        )

    for decision in ai_results.get("decisions", []):
        cur.execute(
            "INSERT INTO decisions (meeting_id, description) VALUES (%s, %s)",
            (meeting_id, decision["description"])
        )

    conn.commit()
    cur.close()

@process_bp.route('/api/process', methods=['POST'])
def process_meeting():
    try:
        title = request.form.get('title', 'Untitled Meeting')
        date = request.form.get('date')
        transcript_text = request.form.get('transcript_text', '')
        audio_file = request.files.get('audio')

        if not date:
            return jsonify({"error": "Date is required"}), 400

        if audio_file:
            # Check file size — Groq Whisper limit is 25MB
            audio_file.seek(0, 2)
            file_size_mb = audio_file.tell() / (1024 * 1024)
            audio_file.seek(0)

            if file_size_mb > 25:
                return jsonify({
                    "error": f"Audio file is {file_size_mb:.1f}MB. Groq Whisper limit is 25MB. Please compress the audio and try again."
                }), 400

            suffix = '.' + audio_file.filename.split('.')[-1]
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                audio_file.save(tmp.name)
                tmp_path = tmp.name

            print(f"Transcribing audio: {file_size_mb:.1f}MB...")
            transcript_text = transcribe_audio(tmp_path)
            os.unlink(tmp_path)
            print("Transcription complete.")

        elif not transcript_text:
            return jsonify(
                {"error": "Provide either audio file or transcript text"}
            ), 400

        conn = get_db()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO meetings (title, date) VALUES (%s, %s) RETURNING id",
            (title, date)
        )

        meeting_id = cur.fetchone()[0]
        conn.commit()
        cur.close()

        print("Running AI agents...")
        ai_results = run_ai_agents(transcript_text)
        print("AI processing complete.")

        save_to_db(conn, meeting_id, transcript_text, ai_results)

        conn.close()

        # Phase 2: Store in vector DB for semantic search
        try:
            from services.embeddings import add_meeting_to_vector_db
            add_meeting_to_vector_db(
                meeting_id=meeting_id,
                title=title,
                transcript=transcript_text,
                summary=ai_results["summary"]
            )
            print("Embeddings stored.")
        except Exception as e:
            print(f"Warning: embeddings failed: {e}")

        return jsonify({
            "meeting_id": meeting_id,
            "message": "Meeting processed successfully",
            "transcript": transcript_text,
            "summary": ai_results["summary"],
            "action_items": ai_results["action_items"],
            "decisions": ai_results["decisions"]
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500