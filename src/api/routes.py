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
from functools import wraps

api = Blueprint('api', __name__)
CORS(api)

# ---------------------------- Decoradores de roles ----------------------------
def role_required(role_name):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            current_user = User.query.get(get_jwt_identity())
            if not current_user or current_user.role.value != role_name:
                raise APIException("Acceso no autorizado", status_code=403)
            return fn(*args, **kwargs)
        return wrapper
    return decorator

admin_required = role_required("admin")
student_required = role_required("student")
professional_required = role_required("professional")
patient_required = role_required("patient")

# 01 EPT para registrar un nuevo usuario
@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()

    required_fields = ["first_name", "first_surname", "birth_day", "role", "email", "password"]
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({"message": f"Campo requerido: {field}"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "El correo ya está registrado"}), 400

    try:
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
        db.session.flush()

        # Si es student o professional, registrar datos académicos
        if data["role"] in ["student", "professional"]:
            required_academic_fields = ["institution", "career", "academic_grade", "register_number"]
            for field in required_academic_fields:
                if field not in data or not data[field]:
                    return jsonify({"message": f"Campo requerido: {field}"}), 400

            academic_data = ProfessionalStudentData(
                user_id=new_user.id,
                institution=data["institution"],
                career=data["career"],
                academic_grade=data["academic_grade"],
                register_number=data["register_number"]
            )
            db.session.add(academic_data)

        # Si es patient, crear expediente en estado empty
        if data["role"] == "patient":
            medical_file = MedicalFile(user_id=new_user.id, file_status=FileStatus.empty)
            db.session.add(medical_file)

        db.session.commit()
        return jsonify({"message": "Usuario registrado correctamente"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error en el servidor: {str(e)}"}), 500

# 02 EPT para login
@api.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        raise APIException("Credenciales inválidas", status_code=401)

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1))
    return jsonify({"token": access_token, "user": user.serialize()}), 200

# 03 EPT para ruta privada
@api.route('/private', methods=['GET'])
@jwt_required()
def private():
    current_user = User.query.get(get_jwt_identity())
    return jsonify({"msg": "Acceso autorizado", "user": current_user.serialize()}), 200

# 04 EPT para obtener todos los usuarios (admin)
@api.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([user.serialize() for user in users]), 200

# 05 EPT para validar profesional (admin)
@api.route('/validate_professional/<int:user_id>', methods=['POST'])
@admin_required
def validate_professional(user_id):
    user = User.query.get(user_id)
    if not user or user.role != UserRole.professional or user.status != UserStatus.pre_approved:
        return jsonify({"error": "Usuario no válido o ya aprobado"}), 400

    data = ProfessionalStudentData.query.filter_by(user_id=user_id).first()
    if not data:
        return jsonify({"error": "Datos profesionales incompletos"}), 400

    data.validated_by_id = get_jwt_identity()
    data.validated_at = datetime.utcnow()
    user.status = UserStatus.approved

    db.session.commit()
    return jsonify({"message": "Profesional validado exitosamente"}), 200

# 06 EPT para que el estudiante solicite validación al profesional
@api.route('/request_student_validation/<int:professional_id>', methods=['POST'])
@student_required
def request_professional_validation(professional_id):
    student = User.query.get(get_jwt_identity())

    if student.status != UserStatus.pre_approved:
        return jsonify({"error": "Solo estudiantes pre_aprobados pueden solicitar validación"}), 400

    professional = User.query.get(professional_id)
    if not professional or professional.role != UserRole.professional or professional.status != UserStatus.approved:
        return jsonify({"error": "Profesional no válido o no aprobado"}), 400

    student_data = ProfessionalStudentData.query.filter_by(user_id=student.id).first()
    if not student_data:
        return jsonify({"error": "Faltan datos académicos del estudiante"}), 400

    student_data.requested_professional_id = professional.id
    student_data.requested_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"message": "Solicitud enviada al profesional"}), 200

# 07 EPT para que el profesional apruebe o rechace al estudiante
@api.route('/professional/validate_student/<int:student_id>', methods=['PUT'])
@professional_required
def validate_student(student_id):
    professional = User.query.get(get_jwt_identity())
    student = User.query.get(student_id)

    if not student or student.role != UserRole.student or student.status != UserStatus.pre_approved:
        return jsonify({"error": "Estudiante no válido o ya aprobado"}), 400

    student_data = ProfessionalStudentData.query.filter_by(user_id=student.id).first()
    if not student_data or student_data.requested_professional_id != professional.id:
        return jsonify({"error": "Este estudiante no te ha solicitado validación"}), 403

    data = request.get_json()
    action = data.get("action")

    if action == "approve":
        student.status = UserStatus.approved
        student_data.validated_by_id = professional.id
        student_data.validated_at = datetime.utcnow()
    elif action == "reject":
        student_data.requested_professional_id = None
        student_data.requested_at = None
    else:
        return jsonify({"error": "Acción no válida. Usa 'approve' o 'reject'"}), 400

    db.session.commit()
    return jsonify({"message": f"Estudiante {action}d exitosamente"}), 200

# 08 EPT para que el paciente solicite a un estudiante llenar su expediente
@api.route('/patient/request_student_validation/<int:student_id>', methods=['POST'])
@patient_required
def patient_request_student(student_id):
    patient = User.query.get(get_jwt_identity())
    student = User.query.get(student_id)

    if not student or student.role != UserRole.student or student.status != UserStatus.approved:
        return jsonify({"error": "Estudiante no válido o no aprobado"}), 400

    medical_file = MedicalFile.query.filter_by(user_id=patient.id).first()
    if not medical_file:
        medical_file = MedicalFile(user_id=patient.id)
        db.session.add(medical_file)

    if medical_file.patient_requested_student_id:
        return jsonify({"error": "Ya tienes una solicitud pendiente"}), 400

    medical_file.patient_requested_student_id = student.id
    medical_file.patient_requested_student_at = datetime.utcnow()

    db.session.commit()
    return jsonify({"message": "Solicitud enviada al estudiante"}), 200

# 09 EPT para que el estudiante apruebe o rechace solicitud de paciente
@api.route('/student/validate_patient/<int:patient_id>', methods=['PUT'])
@student_required
def validate_patient(patient_id):
    student = User.query.get(get_jwt_identity())
    patient = User.query.get(patient_id)

    if not student or student.role != UserRole.student or student.status != UserStatus.approved:
        return jsonify({"error": "Estudiante no válido o no aprobado"}), 400

    if not patient or patient.role != UserRole.patient:
        return jsonify({"error": "Paciente no válido"}), 400

    medical_file = MedicalFile.query.filter_by(user_id=patient.id).first()
    if not medical_file or medical_file.patient_requested_student_id != student.id:
        return jsonify({"error": "No tienes solicitud pendiente de este paciente"}), 400

    data = request.get_json()
    action = data.get("action")

    if action == "approve":
        medical_file.selected_student_id = student.id
        medical_file.student_validated_patient_id = student.id
        medical_file.student_validated_patient_at = datetime.utcnow()

        # 🔥 Cambios clave: actualizar estado a progress
        medical_file.file_status = FileStatus.progress
        medical_file.progressed_by_id = student.id
        medical_file.progressed_at = datetime.utcnow()

    elif action == "reject":
        medical_file.student_rejected_patient_id = student.id
        medical_file.student_rejected_patient_at = datetime.utcnow()
    else:
        return jsonify({"error": "Acción no válida. Usa 'approve' o 'reject'"}), 400

    # Resetear solicitud
    medical_file.patient_requested_student_id = None
    medical_file.patient_requested_student_at = None

    db.session.commit()
    return jsonify({"message": f"Paciente {action}d exitosamente"}), 200

# 10 EPT para obtener solicitudes de pacientes al estudiante
@api.route('/student/patient_requests', methods=['GET'])
@student_required
def get_patient_requests():
    student_id = get_jwt_identity()
    requests = MedicalFile.query.filter_by(patient_requested_student_id=student_id).all()
    result = []

    for req in requests:
        patient_user = User.query.get(req.user_id)
        result.append({
            "id": patient_user.id,
            "full_name": f"{patient_user.first_name} {patient_user.first_surname}",
            "medicalFileId": req.id,
            "approved": req.student_validated_patient_id == student_id
        })

    return jsonify(result), 200


# 11 EPT para obtener solicitudes de estudiantes al profesional
@api.route('/professional/student_requests', methods=['GET'])
@professional_required
def get_student_requests():
    professional_id = get_jwt_identity()
    student_requests = ProfessionalStudentData.query.filter_by(requested_professional_id=professional_id).all()

    result = []
    for data in student_requests:
        student = User.query.get(data.user_id)
        result.append({
            "id": student.id,
            "full_name": f"{student.first_name} {student.first_surname}",
            "email": student.email,
            "career": data.career,
            "academic_grade": data.academic_grade.value,
            "requested_at": data.requested_at.isoformat() if data.requested_at else None
        })

    return jsonify(result), 200