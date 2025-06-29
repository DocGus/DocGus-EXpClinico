import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BackGroundInterview = () => {
  const { medicalFileId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Non-Pathological
    sex: '',
    nationality: '',
    ethnic_group: '',
    languages: '',
    blood_type: '',
    spiritual_practices: '',
    other_origin_info: '',
    address: '',
    housing_type: '',
    civil_status: '',
    cohabitants: '',
    dependents: '',
    other_living_info: '',
    education_institution: '',
    academic_degree: '',
    career: '',
    institute_registration_number: '',
    other_education_info: '',
    economic_activity: '',
    is_employer: false,
    other_occupation_info: '',
    has_medical_insurance: '',
    insurance_institution: '',
    insurance_number: '',
    other_insurance_info: '',
    diet_quality: '',
    meals_per_day: '',
    daily_liquid_intake_liters: '',
    supplements: '',
    other_diet_info: '',
    hygiene_quality: '',
    other_hygiene_info: '',
    exercise_quality: '',
    exercise_details: '',
    sleep_quality: '',
    sleep_details: '',
    hobbies: '',
    recent_travel: '',
    has_piercings: '',
    has_tattoos: '',
    alcohol_use: '',
    tobacco_use: '',
    other_drug_use: '',
    addictions: '',
    other_recreational_info: '',

    // Pathological
    disability_description: '',
    visual_disability: false,
    hearing_disability: false,
    motor_disability: false,
    intellectual_disability: false,
    chronic_diseases: '',
    current_medications: '',
    hospitalizations: '',
    surgeries: '',
    accidents: '',
    transfusions: '',
    allergies: '',
    other_pathological_info: '',

    // Family
    hypertension: false,
    diabetes: false,
    cancer: false,
    mental_illnesses: false,
    congenital_diseases: false,
    heart_diseases: false,
    liver_diseases: false,
    kidney_diseases: false,
    other_family_background_info: '',

    // Gynecological
    menarche_age: '',
    pregnancies: '',
    births: '',
    c_sections: '',
    abortions: '',
    contraceptive_methods: '',
    other_gynecological_info: ''
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/save_medical_file/${medicalFileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al guardar la entrevista.');
      } else {
        setMessage('Expediente enviado para revisión.');
        setTimeout(() => navigate('/dashboard/student'), 2000);
      }
    } catch (err) {
      setError('Error de conexión.');
    }
  };

  const renderInput = (label, name, type = 'text') => (
    <div className="mb-3">
      <label>{label}</label>
      <input
        type={type}
        name={name}
        className="form-control"
        value={formData[name]}
        onChange={handleChange}
      />
    </div>
  );

  const renderCheckbox = (label, name) => (
    <div className="form-check mb-2">
      <input
        type="checkbox"
        name={name}
        className="form-check-input"
        checked={formData[name]}
        onChange={handleChange}
      />
      <label className="form-check-label">{label}</label>
    </div>
  );

  return (
    <div className="container my-4">
      <h2>Entrevista Clínica Completa</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <form onSubmit={handleSubmit}>
        <h4>Datos Personales y Sociales</h4>
        {renderInput('Sexo', 'sex')}
        {renderInput('Nacionalidad', 'nationality')}
        {renderInput('Grupo Étnico', 'ethnic_group')}
        {renderInput('Idiomas', 'languages')}
        {renderInput('Tipo de Sangre', 'blood_type')}
        {renderInput('Prácticas Espirituales', 'spiritual_practices')}
        {renderInput('Otra Información de Origen', 'other_origin_info')}
        {renderInput('Dirección', 'address')}
        {renderInput('Tipo de Vivienda', 'housing_type')}
        {renderInput('Estado Civil', 'civil_status')}
        {renderInput('Cohabitantes', 'cohabitants')}
        {renderInput('Dependientes', 'dependents')}
        {renderInput('Otra Info sobre Vivienda', 'other_living_info')}
        {renderInput('Institución Educativa', 'education_institution')}
        {renderInput('Grado Académico', 'academic_degree')}
        {renderInput('Carrera', 'career')}
        {renderInput('Número de Registro Escolar', 'institute_registration_number')}
        {renderInput('Otra Info Educativa', 'other_education_info')}
        {renderInput('Actividad Económica', 'economic_activity')}
        {renderCheckbox('¿Es empleador?', 'is_employer')}
        {renderInput('Otra Info Laboral', 'other_occupation_info')}
        {renderInput('Seguro Médico', 'has_medical_insurance')}
        {renderInput('Institución del Seguro', 'insurance_institution')}
        {renderInput('Número de Seguro', 'insurance_number')}
        {renderInput('Otra Info de Seguro', 'other_insurance_info')}
        {renderInput('Calidad de la Dieta', 'diet_quality')}
        {renderInput('Comidas por día', 'meals_per_day', 'number')}
        {renderInput('Litros líquidos/día', 'daily_liquid_intake_liters', 'number')}
        {renderInput('Suplementos', 'supplements')}
        {renderInput('Otra Info Dietética', 'other_diet_info')}
        {renderInput('Calidad de Higiene', 'hygiene_quality')}
        {renderInput('Otra Info Higiene', 'other_hygiene_info')}
        {renderInput('Calidad de Ejercicio', 'exercise_quality')}
        {renderInput('Detalles de Ejercicio', 'exercise_details')}
        {renderInput('Calidad de Sueño', 'sleep_quality')}
        {renderInput('Detalles del Sueño', 'sleep_details')}
        {renderInput('Pasatiempos', 'hobbies')}
        {renderInput('Viajes Recientes', 'recent_travel')}
        {renderInput('Uso de Alcohol', 'alcohol_use')}
        {renderInput('Uso de Tabaco', 'tobacco_use')}
        {renderInput('Uso de otras Drogas', 'other_drug_use')}
        {renderInput('Adicciones', 'addictions')}
        {renderInput('Otra Info Recreativa', 'other_recreational_info')}
        {renderCheckbox('¿Tiene Piercings?', 'has_piercings')}
        {renderCheckbox('¿Tiene Tatuajes?', 'has_tattoos')}

        <h4>Antecedentes Patológicos</h4>
        {renderInput('Descripción de Discapacidad', 'disability_description')}
        {renderCheckbox('Discapacidad Visual', 'visual_disability')}
        {renderCheckbox('Discapacidad Auditiva', 'hearing_disability')}
        {renderCheckbox('Discapacidad Motora', 'motor_disability')}
        {renderCheckbox('Discapacidad Intelectual', 'intellectual_disability')}
        {renderInput('Enfermedades Crónicas', 'chronic_diseases')}
        {renderInput('Medicamentos Actuales', 'current_medications')}
        {renderInput('Hospitalizaciones', 'hospitalizations')}
        {renderInput('Cirugías', 'surgeries')}
        {renderInput('Accidentes', 'accidents')}
        {renderInput('Transfusiones', 'transfusions')}
        {renderInput('Alergias', 'allergies')}
        {renderInput('Otra Info Patológica', 'other_pathological_info')}

        <h4>Antecedentes Familiares</h4>
        {renderCheckbox('Hipertensión', 'hypertension')}
        {renderCheckbox('Diabetes', 'diabetes')}
        {renderCheckbox('Cáncer', 'cancer')}
        {renderCheckbox('Enfermedades Mentales', 'mental_illnesses')}
        {renderCheckbox('Enfermedades Congénitas', 'congenital_diseases')}
        {renderCheckbox('Enfermedades del Corazón', 'heart_diseases')}
        {renderCheckbox('Enfermedades Hepáticas', 'liver_diseases')}
        {renderCheckbox('Enfermedades Renales', 'kidney_diseases')}
        {renderInput('Otra Info Familiar', 'other_family_background_info')}

        <h4>Antecedentes Ginecológicos</h4>
        {renderInput('Edad de Menarquia', 'menarche_age', 'number')}
        {renderInput('Embarazos', 'pregnancies', 'number')}
        {renderInput('Partos', 'births', 'number')}
        {renderInput('Cesáreas', 'c_sections', 'number')}
        {renderInput('Abortos', 'abortions', 'number')}
        {renderInput('Métodos Anticonceptivos', 'contraceptive_methods')}
        {renderInput('Otra Info Ginecológica', 'other_gynecological_info')}

        <button type="submit" className="btn btn-primary mt-3">Guardar y Enviar</button>
      </form>
    </div>
  );
};

export default BackGroundInterview;
