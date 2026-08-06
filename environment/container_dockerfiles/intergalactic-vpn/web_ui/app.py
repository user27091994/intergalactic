import hashlib
import io
import os
import socket
import sqlite3
import subprocess
from typing import Any

from flask import Flask, Response, jsonify, request, send_file, send_from_directory, session
from openvpn_api.vpn import VPN

app = Flask(__name__, static_folder="static", static_url_path="/static")

app.secret_key = "REDACTED_PUBLIC_EXPORT_SECRET"

vpn = VPN(socket="/var/run/openvpn_management.sock")

DATABASE = "users.db"


def get_db() -> sqlite3.Connection:
    return sqlite3.connect(DATABASE)


def init_db() -> None:
    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )
    """
    )
    # Insert a default user if it doesn't exist (username: admin, password: admin)
    default_user = ("admin", hashlib.md5("admin".encode()).hexdigest())

    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", default_user)
    except sqlite3.IntegrityError:
        pass
    conn.commit()
    conn.close()


init_db()


@app.route("/views/<path:filename>")
def _views(filename: str) -> Any:
    views_dir = os.path.join(app.static_folder, "views")
    return send_from_directory(views_dir, filename)


@app.route("/", methods=["GET"])
def _index() -> Any:
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/login", methods=["POST"])
def _login() -> Response:
    data = request.get_json()
    if not data:
        return jsonify(success=False, message="Missing credentials"), 401

    username = data.get("username")
    password = data.get("password")
    if not username or not password:
        return jsonify(success=False, message="Missing credentials"), 401

    hashed_password = hashlib.md5(password.encode()).hexdigest()
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=? AND password=?", (username, hashed_password))
    user = c.fetchone()
    conn.close()
    if user:
        session["user"] = username
        return jsonify(success=True, message="Logged in successfully")
    else:
        return jsonify(success=False, message="Invalid credentials"), 401


@app.route("/api/logout", methods=["GET"])
def _logout() -> Response:
    session.clear()
    return jsonify(success=True, message="Logged out")


@app.route("/api/user", methods=["GET"])
def _read_user() -> Response:
    user = session.get("user")
    return jsonify(user=user)


@app.route("/api/statistics", methods=["GET"])
def _statistics() -> Response:
    try:
        vpn.connect()
        stats = vpn.get_stats()
        return jsonify(
            success=True,
            statistics={"bytes in": stats.bytes_in, "bytes out": stats.bytes_out, "clinets": stats.client_count},
        )
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500
    finally:
        vpn.disconnect()


@app.route("/api/clients", methods=["GET"])
def _clients() -> Response:
    try:
        vpn.connect()
        clients = []
        for endpoint, client in vpn.get_status().client_list.items():
            clients.append(
                {
                    "endpoint": str(endpoint),
                    "name": client.common_name,
                    "bytes received": client.bytes_received,
                    "bytes sent": client.bytes_sent,
                    "connected since": client.connected_since,
                }
            )

        return jsonify(success=True, clients=clients)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500
    finally:
        vpn.disconnect()


@app.route("/api/add_client", methods=["POST"])
def _add_client() -> Response:
    if "user" not in session:
        return jsonify(success=False, message="Not authenticated"), 401

    data = request.get_json()
    if not data or "client_name" not in data:
        return jsonify(success=False, message="Client name required"), 400

    client_name: str = data["client_name"]

    # server_ip = netifaces.ifaddresses("eth0")[netifaces.AF_INET][0]["addr"]
    server_hostname = "192.168.122.10"

    run_add_client = subprocess.Popen(
        ["/usr/bin/stdbuf", "-oL", "/bin/bash", "-c", f"/app/web_ui/add_client.sh {server_hostname} {client_name}"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    run_add_client.wait()

    stdout, _ = run_add_client.communicate()

    file_bytes = io.BytesIO(stdout.encode("utf-8"))
    file_bytes.seek(0)

    return send_file(file_bytes, as_attachment=True, download_name=f"{client_name}.ovpn", mimetype="text/plain")


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=80)
