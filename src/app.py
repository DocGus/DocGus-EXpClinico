"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_jwt_extended import JWTManager
from flask_cors import CORS

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "ZkV-hpLWLgVXEXmPu4I0gJY8NdW0cn4UK-ZOjQgoMR4"
jwt = JWTManager(app)

# Configurar CORS para permitir el frontend específico
CORS(app, resources={r"/api/*": {"origins": "https://cautious-potato-jjjr947p6r6g2p54r-3000.app.github.dev"}})

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../dist/')
app.url_map.strict_slashes = False

# Database configuration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace("postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Admin and CLI commands
setup_admin(app)
setup_commands(app)

# Registrar Blueprints
app.register_blueprint(api, url_prefix='/api')

# Manejo de errores global para APIException
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Sitemap solo en modo development
@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# Catch-all route para servir frontend en rutas desconocidas
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if path.startswith("api"):
        return jsonify({"error": "API endpoint not found"}), 404

    file_path = os.path.join(static_file_dir, path)
    if os.path.isfile(file_path):
        response = send_from_directory(static_file_dir, path)
    else:
        # Si no existe el archivo, devuelve index.html (React Router se encarga)
        response = send_from_directory(static_file_dir, 'index.html')

    response.cache_control.max_age = 0  # Evitar cache durante desarrollo
    return response

# Solo ejecuta el server si se corre directamente
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)