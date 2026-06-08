from flask import Flask
from flask_cors import CORS
from config import Config
import psycopg2

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

def get_db():
    conn = psycopg2.connect(Config.SUPABASE_DB_URL)
    return conn

from routes.meetings import meetings_bp
from routes.process import process_bp
from routes.search import search_bp

app.register_blueprint(meetings_bp)
app.register_blueprint(process_bp)
app.register_blueprint(search_bp)

@app.route('/health')
def health():
    return {"status": "ok"}

if __name__ == '__main__':
    app.run(debug=True, port=5000)