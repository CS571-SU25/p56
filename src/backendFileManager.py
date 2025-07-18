from flask import Flask, jsonify, send_from_directory, request, abort
import os
from pathlib import Path
from flask_cors import CORS
from datetime import datetime
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
CORS(app)

# Directories
BASE_DIR = os.path.join(Path.home(), "Downloads", "SERVER_STUFF")
os.makedirs(BASE_DIR, exist_ok=True)

ACCOUNT_DIR = os.path.join(Path.home(), "Downloads", "ACCOUNTS")
os.makedirs(ACCOUNT_DIR, exist_ok=True)

# Helpers
def get_user_dir(username):
    safe_username = secure_filename(username)
    user_dir = os.path.join(BASE_DIR, safe_username)
    os.makedirs(user_dir, exist_ok=True)
    return user_dir

def get_path_in_user_dir(username, *paths):
    user_dir = get_user_dir(username)
    abs_path = os.path.abspath(os.path.join(user_dir, *(paths if paths else [])))
    if not abs_path.startswith(user_dir):
        abort(403, description="Access denied")
    return abs_path

def get_account_path(username):
    safe_name = secure_filename(username)
    return os.path.join(ACCOUNT_DIR, f"{safe_name}.json")

# Account management routes

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "Both username and password are required"}), 400

    account_path = get_account_path(username)
    if os.path.exists(account_path):
        return jsonify({"error": "Username already exists"}), 409

    try:
        with open(account_path, "w") as f:
            json.dump({"username": username, "password": password}, f)
    except Exception as e:
        return jsonify({"error": f"Failed to create account: {str(e)}"}), 500

    return jsonify({"success": True})

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "Both username and password are required"}), 400

    account_path = get_account_path(username)
    if not os.path.exists(account_path):
        return jsonify({"error": "Invalid username or password"}), 401

    try:
        with open(account_path, "r") as f:
            saved = json.load(f)
        if saved.get("password") != password:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception as e:
        return jsonify({"error": f"Failed to read account data: {str(e)}"}), 500

    return jsonify({"success": True})


# Existing file & folder management routes

@app.route('/delete-folder', methods=['DELETE'])
def delete_folder():
    username = request.args.get("username")
    dir_name = request.args.get("dir")

    if not username:
        return jsonify({"error": "Username required"}), 400
    if not dir_name:
        return jsonify({"error": "Directory name required"}), 400
    if dir_name.strip().lower() == "home":
        return jsonify({"error": "Cannot delete the Home directory"}), 403

    try:
        target_dir = get_path_in_user_dir(username, dir_name)

        if not os.path.isdir(target_dir):
            return jsonify({"error": "Folder not found"}), 404

        import shutil
        shutil.rmtree(target_dir)

        return jsonify({"message": f"Folder '{dir_name}' deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/subdirs', methods=['GET'])
def list_subdirectories():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username required"}), 400

    try:
        user_dir = get_user_dir(username)
        subdirs = []
        for entry in os.listdir(user_dir):
            full_path = os.path.join(user_dir, entry)
            if os.path.isdir(full_path):
                subdirs.append(entry)
        return jsonify(subdirs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete-file', methods=['DELETE'])
def delete_file():
    username = request.args.get("username")
    filename = request.args.get("file")
    dir_name = request.args.get("dir")

    if not username or not filename:
        return jsonify({"error": "Username and filename required"}), 400

    try:
        file_path = get_path_in_user_dir(username, dir_name, filename) if dir_name else get_path_in_user_dir(username, filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404

        os.remove(file_path)
        return jsonify({"message": f"{filename} deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/files', methods=['GET'])
def list_files():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username required"}), 400

    dir_name = request.args.get('dir')
    try:
        target_dir = get_path_in_user_dir(username, dir_name) if dir_name else get_user_dir(username)

        if not os.path.isdir(target_dir):
            return jsonify({"error": "Directory not found"}), 404

        files_list = []
        for fname in os.listdir(target_dir):
            full_path = os.path.join(target_dir, fname)
            if os.path.isfile(full_path):
                created = os.path.getctime(full_path)
                files_list.append({
                    "name": fname,
                    "created": datetime.fromtimestamp(created).isoformat(),
                    "size": os.path.getsize(full_path)
                })
        return jsonify(files_list)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/download/<path:filepath>', methods=['GET'])
def download_file(filepath):
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username required"}), 400

    try:
        directory = get_path_in_user_dir(username, os.path.dirname(filepath))
        filename = os.path.basename(filepath)
        file_path = os.path.join(directory, filename)
        if not os.path.isfile(file_path):
            return jsonify({"error": "File not found"}), 404

        return send_from_directory(directory, filename, as_attachment=True)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route('/upload', methods=['POST'])
def upload_file():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username required"}), 400

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    dir_name = request.args.get('dir')

    try:
        upload_dir = get_path_in_user_dir(username, dir_name) if dir_name else get_user_dir(username)
        os.makedirs(upload_dir, exist_ok=True)

        safe_name = secure_filename(file.filename)
        save_path = os.path.join(upload_dir, safe_name)
        file.save(save_path)

        return jsonify({"message": f"Uploaded {safe_name} successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/create-folder', methods=['POST'])
def create_folder():
    username = request.args.get("username")
    if not username:
        return jsonify({"error": "Username required"}), 400

    dir_name = request.args.get('dir')
    data = request.get_json()
    folder_name = data.get('folderName', '').strip()

    if not folder_name:
        return jsonify({"error": "Folder name required"}), 400

    try:
        target_dir = get_path_in_user_dir(username, dir_name) if dir_name else get_user_dir(username)
        new_folder_path = os.path.join(target_dir, secure_filename(folder_name))
        if os.path.exists(new_folder_path):
            return jsonify({"error": "Folder already exists"}), 400

        os.makedirs(new_folder_path)
        return jsonify({"message": f"Folder '{folder_name}' created successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3001)