"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, ProfessionalStudentData, MedicalFile, FileStatus, UserRole, UserStatus
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required


api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


# 01 EPT para registrar un nuevo usuario con datos de user en el caso de profesionales y estudiantes 
# agrega los datos de ProfessionalStudentData y crea un expediente médico empty en caso de pacientes
@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()

    # Campos obligatorios generales
    required_fields = ["first_name", "first_surname", "birth_day", "role", "email", "password"]
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"message": f"Campo requerido: {field}"}), 400

    # Verifica si el correo ya está registrado
    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "El correo ya está registrado"}), 400

    try:
        # Crear usuario base
        new_user = User(
            first_name=data["first_name"],
            second_name=data.get("second_name"),
            first_surname=data["first_surname"],
            second_surname=data.get("second_surname"),
            birth_day=data["birth_day"],
            phone=data.get("phone"),
            email=data["email"],
            password=generate_password_hash(data["password"]),
            role=data["role"]
        )
        db.session.add(new_user)
        db.session.flush()  # Necesario para obtener new_user.id antes del commit

        # Si es estudiante o profesional, crea sus datos académicos
        if data["role"] in ["student", "professional"]:
            required_academic_fields = ["institution", "career", "academic_grade", "register_number"]
            for field in required_academic_fields:
                if field not in data or not data[field]:
                    return jsonify({"message": f"Campo requerido para datos académicos: {field}"}), 400

            academic_data = ProfessionalStudentData(
                user_id=new_user.id,
                institution=data["institution"],
                career=data["career"],
                academic_grade=data["academic_grade"],
                register_number=data["register_number"]
            )
            db.session.add(academic_data)

        # Si es paciente, se crea automáticamente su expediente en estado "empty"
        if data["role"] == "patient":
            medical_file = MedicalFile(
                user_id=new_user.id,
                file_status=FileStatus.empty
            )
            db.session.add(medical_file)

        db.session.commit()
        return jsonify({"message": "Usuario registrado correctamente"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error en el servidor: {str(e)}"}), 500

# 02 LOGIN
@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        raise APIException("Credenciales inválidas", status_code=401)
                                                                                                # Asegúrate de que identity sea string
    access_token = create_access_token(                                                         # Genera un token JWT con exp de 1 hora

        identity=str(user.id), expires_delta=timedelta(hours=1))

    return jsonify({"token": access_token, "user": user.serialize()}), 200



# 03 EPT para RUTA PROTEGIDA
@api.route('/private', methods=['GET'])
@jwt_required()
def private():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify({"msg": "Acceso autorizado", "user": user.serialize()}), 200







# 04 EPT para obtener información de TODOS los usuarios (solo para administradores)
@api.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if not current_user or current_user.role.value != "admin":
        raise APIException("Acceso no autorizado", status_code=403)

    users = User.query.all()
    return jsonify([user.serialize() for user in users]), 200




from functools import wraps
from flask_jwt_extended import get_jwt_identity

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user or user.role.value != "admin":
            raise APIException("Acceso no autorizado", status_code=403)
        return fn(*args, **kwargs)
    return wrapper

@api.route('/api/user/<int:user_id>/approve', methods=['PUT'])
@admin_required  # Solo el admin puede aprobar
def approve_user(user_id):
    user = User.query.get(user_id)
    if not user or user.role != "professional":
        return jsonify({"error": "Usuario no encontrado o no es profesional"}), 400

    user.status = "approved"
    db.session.commit()
    return jsonify({"message": "Usuario aprobado", "user": user.serialize()}), 200




# 05 EPT para que el admin valide al usuario professional
@api.route('/validate_professional/<int:user_id>', methods=['POST'])
@admin_required
def validate_professional(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    user = User.query.get(user_id)
    if not user or user.role != UserRole.professional or user.status != UserStatus.pre_approved:
        return jsonify({"error": "Usuario no válido"}), 400

    data = ProfessionalStudentData.query.filter_by(user_id=user_id).first()
    if not data:
        return jsonify({"error": "Faltan datos profesionales"}), 400

    # Validar datos manualmente si hace falta (ej. campos vacíos)

    data.validated_by_id = current_user.id  # quien valida
    data.validated_at = datetime.utcnow()
    user.status = UserStatus.approved

    db.session.commit()
    return jsonify({"message": "Profesional validado exitosamente"}), 200
