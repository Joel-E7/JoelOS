#!/usr/bin/env python3
"""
JE OS Webhook Server - Receives data from Tasker
Listens on http://localhost:3000
Endpoints: /api/sleep, /api/notes
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from datetime import datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)

SLEEP_LOG_FILE = DATA_DIR / 'sleep_log.jsonl'
NOTES_DIR = DATA_DIR / 'notes'
NOTES_DIR.mkdir(exist_ok=True)

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_len = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_len).decode('utf-8')
            data = json.loads(body)

            if self.path == '/api/sleep':
                self.handle_sleep(data)
            elif self.path == '/api/notes':
                self.handle_notes(data)
            else:
                self.send_error(404)
                return

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())

        except Exception as e:
            self.send_error(500, str(e))
            print(f"❌ Error: {e}")

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def handle_sleep(self, data):
        """Append sleep data to JSONL log"""
        if 'date' not in data:
            data['date'] = datetime.now().strftime('%Y-%m-%d')

        with open(SLEEP_LOG_FILE, 'a') as f:
            f.write(json.dumps(data) + '\n')

        print(f"✓ Sleep data logged for {data.get('date')}")

    def handle_notes(self, data):
        """Store note PDF"""
        filename = data.get('filename', f'note_{datetime.now().isoformat()}.pdf')
        content = data.get('content', '')

        note_path = NOTES_DIR / filename

        try:
            import base64
            decoded = base64.b64decode(content)
            with open(note_path, 'wb') as f:
                f.write(decoded)
        except:
            with open(note_path, 'w') as f:
                f.write(content)

        print(f"✓ Note saved: {filename}")

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

if __name__ == '__main__':
    port = 3000
    server = HTTPServer(('localhost', port), WebhookHandler)
    print(f"🚀 JE OS Webhook Server running on http://localhost:{port}")
    print(f"   POST /api/sleep - receive sleep data from Tasker")
    print(f"   POST /api/notes - receive note PDFs from Tasker")
    server.serve_forever()
