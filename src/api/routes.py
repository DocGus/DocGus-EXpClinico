"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, ProfessionalStudentData, MedicalFile, FileStatus
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from datetime import datetime


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
