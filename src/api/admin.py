# Permite que los administradores vean, editen, creen y eliminen registros directamente desde el navegador 
# en todas las tablas clave del proyecto, como usuarios, expedientes médicos y antecedentes clínicos.

import os
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_admin.form import SecureForm
from wtforms import PasswordField, validators
from werkzeug.security import generate_password_hash
from .models import (
    db,
    User,
    ProfessionalStudentData,
    MedicalFile,
    NonPathologicalBackground,
    PathologicalBackground,
    FamilyBackground,
    GynecologicalBackground
)

# ------------------------ Vista personalizada para User con hash obligatorio ------------------------
class UserView(ModelView):
    form_base_class = SecureForm

    column_list = [
        "id", "role", "status",
        "first_name", "second_name", "first_surname", "second_surname", 
        "birth_day", "phone", "email", "password"
    ]

    form_extra_fields = {
        'password': PasswordField('Password', [validators.DataRequired()])
    }

    def on_model_change(self, form, model, is_created):
        if form.password.data:
            model.password = generate_password_hash(form.password.data)

# ------------------------ Otras vistas ------------------------
class ProfessionalStudentDataView(ModelView):
    column_list = [
        "id", "user_id", "institution", "career", "academic_grade", "register_number"
    ]

class MedicalFileView(ModelView):
    column_list = [
        "id", "user_id", "file_status", "selected_student_id", "progressed_by_id", 
        "progressed_at", "reviewed_by_id", "reviewed_at", "approved_by_id",
        "approved_at", "no_approved_by_id", "no_approved_at", "confirmed_by_id",
        "confirmed_at", "no_confirmed_by_id", "no_confirmed_at", "non_pathological_background",
        "pathological_background", "family_background", "gynecological_background",
    ]

class NonPathologicalBackgroundView(ModelView):
    column_list = [
        "id", "user_id", "medical_file_id", "sex", "nationality", "ethnic_group", "languages",
        "blood_type", "spiritual_practices", "other_origin_info", "civil_status", "address",
        "housing_type", "cohabitants", "dependents", "other_living_info", "education_institution",
        "academic_degree", "career", "institute_registration_number", "other_education_info", 
        "economic_activity", "is_employer", "other_occupation_info", "has_medical_insurance",
        "insurance_institution", "insurance_number", "other_insurance_info", "diet_quality",
        "meals_per_day", "daily_liquid_intake_liters", "supplements", "other_diet_info", 
        "hygiene_quality", "other_hygiene_info", "exercise_quality", "exercise_details",
        "sleep_quality", "sleep_details", "hobbies", "recent_travel", "has_piercings",
        "has_tattoos", "alcohol_use", "tobacco_use", "other_drug_use", "addictions", "other_recreational_info"
    ]

class PathologicalBackgroundView(ModelView):
    column_list = [
        "id", "user_id", "medical_file_id", "disability_description", "visual_disability",
        "hearing_disability", "motor_disability", "intellectual_disability", "chronic_diseases",
        "current_medications", "hospitalizations", "surgeries", "accidents", "transfusions",
        "allergies", "other_pathological_info"
    ]

class FamilyBackgroundView(ModelView):
    column_list = [
        "id", "user_id", "medical_file_id", "hypertension", "diabetes", "cancer",
        "mental_illnesses", "congenital_diseases", "heart_diseases", "liver_diseases",
        "kidney_diseases", "other_family_background_info"
    ]

class GynecologicalBackgroundView(ModelView):
    column_list = [
        "id", "user_id", "medical_file_id", "menarche_age", "pregnancies", "births", "c_sections",
        "abortions", "contraceptive_methods", "other_gynecological_info"
    ]

# ------------------------ Configuración del Admin ------------------------
def setup_admin(app):
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')

    # Agregar las vistas
    admin.add_view(UserView(User, db.session))
    admin.add_view(ProfessionalStudentDataView(ProfessionalStudentData, db.session))
    admin.add_view(MedicalFileView(MedicalFile, db.session))
    admin.add_view(NonPathologicalBackgroundView(NonPathologicalBackground, db.session))
    admin.add_view(PathologicalBackgroundView(PathologicalBackground, db.session))
    admin.add_view(FamilyBackgroundView(FamilyBackground, db.session))
    admin.add_view(GynecologicalBackgroundView(GynecologicalBackground, db.session))
