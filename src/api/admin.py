# Permite que los administradores vean, editen, creen y eliminen registros directamente desde el navegador 
# en todas las tablas clave del proyecto, como usuarios, expedientes médicos y antecedentes clínicos.
 
 
   
import os                                                       # Importa el módulo `os` para acceder a variables de entorno
from flask_admin import Admin                                   # Importa la clase `Admin` de Flask-Admin para crear una interfaz de administración
from flask_admin.contrib.sqla import ModelView                  # Importa `ModelView` para crear vistas de modelos SQLAlchemy en la interfaz de administración
from flask_admin import expose                                  # Importa `expose` para definir rutas personalizadas en las vistas de administración 
from .models import (                                           # Importa los modelos necesarios desde el módulo `models`          
    db,
    User,
    ProfessionalStudentData,
    MedicalFile,
    NonPathologicalBackground,
    PathologicalBackground,
    FamilyBackground,
    GynecologicalBackground
    
)

class UserView(ModelView):                                                                  # Define una vista personalizada para el modelo `User`  
    column_list = [
        "id", "role", "status",
        "first_name", "second_name", "first_surname", "second_surname", 
        "birth_day","phone", "email", "password"  
    ]

class ProfessionalStudentDataView(ModelView):                                                      # Define una vista personalizada para el modelo `ProfessionalData`
    column_list = [
        "id", "user_id", "institution", "career", "academic_grade", "register_number"
    ]

class MedicalFileView(ModelView):                                                           # Define una vista personalizada para el modelo `MedicalFile`
    column_list = [
            "id", "user_id", "file_status", "selected_student_id", "progressed_by_id", 
            "progressed_at", "reviewed_by_id", "reviewed_at", "approved_by_id",
            "approved_at", "no_approved_by_id", "no_approved_at", "confirmed_by_id",
            "confirmed_at", "no_confirmed_by_id", "no_confirmed_at", "non_pathological_background",
            "pathological_background", "family_background", "gynecological_background",
    ]

class NonPathologicalBackgroundView(ModelView):                                             # Define una vista personalizada para el modelo `NonPathologicalBackground`
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

class PathologicalBackgroundView(ModelView):                                                # Define una vista personalizada para el modelo `PathologicalBackground`
    column_list = [
        "id", "user_id", "medical_file_id", "disability_description", "visual_disability",
        "hearing_disability", "motor_disability", "intellectual_disability", "chronic_diseases",
        "current_medications", "hospitalizations", "surgeries", "accidents", "transfusions",
        "allergies", "other_pathological_info"
    ]

class FamilyBackgroundView(ModelView):                                                      # Define una vista personalizada para el modelo `FamilyBackground`
    column_list = [
        "id", "user_id", "medical_file_id", "hypertension", "diabetes", "cancer",
        "mental_illnesses", "congenital_diseases", "heart_diseases", "liver_diseases",
        "kidney_diseases", "other_family_background_info"
    ]

class GynecologicalBackgroundView(ModelView):                                               # Define una vista personalizada para el modelo `GynecologicalBackground`
    column_list = [
        "id", "user_id", "medical_file_id", "menarche_age", "pregnancies", "births", "c_sections",
        "abortions", "contraceptive_methods", "other_gynecological_info"
    ]



def setup_admin(app):                                                                       # Define una función para configurar el panel de administración
    app.secret_key = os.environ.get('FLASK_APP_KEY', 'sample key')                          # Configura la clave secreta de la aplicación Flask
    app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'                                           # Configura el tema del panel de administración
    admin = Admin(app, name='4Geeks Admin', template_mode='bootstrap3')                     # Crea una instancia de `Admin` con la aplicación Flask, nombre y modo de plantilla 

    # Agregar las vistas personalizadas al admin
    admin.add_view(UserView(User, db.session))
    admin.add_view(ProfessionalStudentDataView(ProfessionalStudentData, db.session))
    admin.add_view(MedicalFileView(MedicalFile, db.session))
    admin.add_view(NonPathologicalBackgroundView(NonPathologicalBackground, db.session))
    admin.add_view(PathologicalBackgroundView(PathologicalBackground, db.session))
    admin.add_view(FamilyBackgroundView(FamilyBackground, db.session))
    admin.add_view(GynecologicalBackgroundView(GynecologicalBackground, db.session))
    

    