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

def student_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        # Permitir tanto UserRole.student como string "student"
        if not user or (hasattr(user.role, "value") and user.role.value != "student") and user.role != "student":
            raise APIException("Acceso no autorizado", status_code=403)
        return fn(*args, **kwargs)
    return wrapper

def professional_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        # Permitir tanto UserRole.professional como string "professional"
        if not user or (hasattr(user.role, "value") and user.role.value != "professional") and user.role != "professional":
            raise APIException("Acceso no autorizado", status_code=403)
        return fn(*args, **kwargs)
    return wrapper

def patient_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        # Permitir tanto UserRole.patient como string "patient"
        if not user or (hasattr(user.role, "value") and user.role.value != "patient") and user.role != "patient":
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

# 06 EPT para que el estudiante solicite validación a un profesional
@api.route('/request_student_validation/<int:professional_id>', methods=['POST'])
@student_required
def request_professional_validation(professional_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    if current_user.status != UserStatus.pre_approved:
        return jsonify({"error": "Solo los estudiantes en estado pre_approved pueden solicitar validación"}), 400

    professional = User.query.get(professional_id)

    if not professional or professional.role != UserRole.professional or professional.status != UserStatus.approved:
        return jsonify({"error": "El profesional no existe o no está aprobado"}), 400

    student_data = ProfessionalStudentData.query.filter_by(user_id=current_user.id).first()

    if not student_data:
        return jsonify({"error": "Faltan los datos profesionales del estudiante"}), 400

    # Guardar la solicitud
    student_data.requested_professional_id = professional.id
    student_data.requested_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Solicitud de validación enviada exitosamente"}), 200



# 07 EPT para que el profesional valide al estudiante
@api.route('/professional/validate_student/<int:student_id>', methods=['PUT'])
@professional_required
def validate_student(student_id):
    current_user_id = get_jwt_identity()
    current_professional = User.query.get(current_user_id)

    student = User.query.get(student_id)
    if not student or student.role != UserRole.student:
        return jsonify({"error": "El usuario no es un estudiante válido"}), 400

    if student.status != UserStatus.pre_approved:
        return jsonify({"error": "El estudiante no está en estado pre_approved"}), 400

    student_data = ProfessionalStudentData.query.filter_by(user_id=student.id).first()
    if not student_data:
        return jsonify({"error": "El estudiante no tiene datos profesionales registrados"}), 400

    # Verificar que la solicitud sea para este profesional
    if student_data.requested_professional_id != current_professional.id:
        return jsonify({"error": "Este estudiante no te ha solicitado validación a ti"}), 403

    data = request.get_json()
    action = data.get("action")

    if action not in ["approve", "reject"]:
        return jsonify({"error": "Acción no válida. Usa 'approve' o 'reject'"}), 400

    if action == "approve":
        student.status = UserStatus.approved
        student_data.validated_by_id = current_professional.id
        student_data.validated_at = datetime.utcnow()
        # Limpiar solicitud ya resuelta
        student_data.requested_professional_id = None
        student_data.requested_at = None
        db.session.commit()
        return jsonify({"message": "Estudiante aprobado exitosamente"}), 200

    elif action == "reject":
        student_data.requested_professional_id = None
        student_data.requested_at = None
        db.session.commit()
        return jsonify({"message": "Solicitud de validación rechazada"}), 200


# 08 Paciente solicita a un estudiante llenar su expediente
@api.route('/patient/request_student_validation/<int:student_id>', methods=['POST'])
@patient_required
def request_student_validation(student_id):
    current_user_id = get_jwt_identity()
    patient = User.query.get(current_user_id)
    student = User.query.get(student_id)

    if not student or student.role != UserRole.student or student.status != UserStatus.approved:
        return jsonify({"error": "El estudiante no existe o no está aprobado"}), 400

    # Buscar o crear el expediente médico del paciente
    medical_file = MedicalFile.query.filter_by(user_id=patient.id).first()

    if not medical_file:
        medical_file = MedicalFile(user_id=patient.id)
        db.session.add(medical_file)

    # Validar que el paciente no tenga ya una solicitud pendiente
    if medical_file.patient_requested_student_id:
        return jsonify({"error": "Ya tienes una solicitud pendiente a un estudiante"}), 400

    # Guardar la solicitud
    medical_file.patient_requested_student_id = student.id
    medical_file.patient_requested_student_at = datetime.utcnow()

    db.session.commit()

    return jsonify({"message": "Solicitud de validación enviada exitosamente al estudiante"}), 200

# 09 Estudiante acepta llenar el expediente del paciente
# Esta ruta es llamada por el estudiante cuando acepta la solicitud del paciente
@api.route('/student/validate_patient/<int:patient_id>', methods=['PUT'])
@student_required
def validate_patient_request(patient_id):
    current_user_id = get_jwt_identity()
    student = User.query.get(current_user_id)

    if not student or student.role != UserRole.student or student.status != UserStatus.approved:
        return jsonify({"error": "El usuario actual no es un estudiante aprobado"}), 403

    patient = User.query.get(patient_id)
    if not patient or patient.role != UserRole.patient:
        return jsonify({"error": "El paciente no existe o no tiene el rol correcto"}), 400

    medical_file = MedicalFile.query.filter_by(user_id=patient.id).first()
    if not medical_file:
        return jsonify({"error": "El paciente no tiene expediente médico"}), 404

    # Validar que la solicitud sea para este estudiante
    if medical_file.patient_requested_student_id != student.id:
        return jsonify({"error": "Este paciente no te ha solicitado validación"}), 403

    data = request.get_json()
    action = data.get("action")

    if action not in ["approve", "reject"]:
        return jsonify({"error": "Acción no válida. Usa 'approve' o 'reject'"}), 400

    if action == "approve":
        medical_file.student_validated_patient_id = student.id
        medical_file.student_validated_patient_at = datetime.utcnow()

        # Limpiamos la solicitud pendiente
        medical_file.patient_requested_student_id = None
        medical_file.patient_requested_student_at = None

        # Asignamos formalmente al estudiante al expediente
        medical_file.selected_student_id = student.id

        db.session.commit()
        return jsonify({"message": "Paciente validado exitosamente"}), 200

    elif action == "reject":
        medical_file.student_rejected_patient_id = student.id
        medical_file.student_rejected_patient_at = datetime.utcnow()

        # Limpiamos la solicitud pendiente
        medical_file.patient_requested_student_id = None
        medical_file.patient_requested_student_at = None

        db.session.commit()
        return jsonify({"message": "Solicitud del paciente rechazada"}), 200