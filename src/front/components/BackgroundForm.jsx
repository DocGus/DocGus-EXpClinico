import React, { useEffect, useState } from "react";

const initialState = {
  patological_background: {
    personal_diseases: "",
    medications: "",
    hospitalizations: "",
    surgeries: "",
    traumatisms: "",
    transfusions: "",
    allergies: "",
    others: "",
  },
  family_background: {
    hypertension: false,
    diabetes: false,
    cancer: false,
    heart_disease: false,
    kidney_disease: false,
    liver_disease: false,
    mental_illness: false,
    congenital_malformations: false,
    others: ""
  },
  non_pathological_background: {
    education_level: "",
    economic_activity: "",
    marital_status: "",
    dependents: "",
    occupation: "",
    recent_travels: "",
    social_activities: "",
    exercise: "",
    diet_supplements: "",
    hygiene: "",
    tattoos: false,
    piercings: false,
    hobbies: "",
    tobacco_use: "",
    alcohol_use: "",
    recreational_drugs: "",
    addictions: "",
    others: "",
  },
  gynecological_background: {
    menarche_age: "",
    pregnancies: "",
    births: "",
    c_sections: "",
    abortions: "",
    contraceptive_method: "",
    others: "",
  },
  personal_data: {
    sex: "",
    address: "",
  }
};

const BackgroundForm = ({ initialData, medicalFileId, readOnly = false }) => {
  const [form, setForm] = useState(initialState);

  const handleChange = (e, section) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setForm((prevForm) => ({
      ...prevForm,
      [section]: {
        ...prevForm[section],
        [name]: val,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Si es readOnly, no debe enviar
    if (readOnly) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No hay token. Por favor, inicia sesión nuevamente.");
      return;
    }

    const newFormData = {
      ...form,
      medical_file_id: medicalFileId,
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backgrounds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newFormData),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Error en antecedentes:", data);
        alert(`Error al guardar antecedentes: ${data.error || data.message || "Revisa la consola"}`);
        return;
      }

      const reviewRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/mark_review/${medicalFileId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!reviewRes.ok) {
        const reviewData = await reviewRes.json();
        console.error("Error al marcar en revisión:", reviewData);
        alert(`Error al enviar a revisión: ${reviewData.error || "Revisa la consola"}`);
        return;
      }

      alert("Antecedentes guardados y expediente enviado a revisión correctamente ✅");
      setForm(initialState);

    } catch (err) {
      console.error("Error de conexión:", err);
      alert("Error de conexión con el servidor.");
    }
  };

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialState, ...initialData });
    }
  }, [initialData]);

  return (
    <form onSubmit={handleSubmit} className="row p-4 rounded shadow-md max-w-5xl mx-auto" data-bs-theme="dark">
      <h2 className="text-2xl font-bold mb-4">Antecedentes Médicos del Paciente</h2>

      {/* Datos Personales */}
      <h4 className="mt-4 mb-2 text-lg font-semibold">Datos Personales</h4>
      <div className="mb-2 col-6">
        <label className="block">Sexo</label>
        <select
          name="sex"
          value={form.personal_data.sex}
          onChange={(e) => handleChange(e, "personal_data")}
          className="form-control"
          disabled={readOnly}
        >
          <option value="">Selecciona</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div className="mb-2 col-6">
        <label className="block">Dirección</label>
        <textarea
          name="address"
          value={form.personal_data.address}
          onChange={(e) => handleChange(e, "personal_data")}
          className="form-control"
          disabled={readOnly}
        />
      </div>

      {/* Ejemplo general para el resto */}
      {/* Repite el mismo patrón para TODOS los campos existentes */}
      {/* Ya lo tienes en tu componente original, solo añade disabled={readOnly} en cada input/textarea/select */}

      {!readOnly && (
        <div className="mt-4 col-12">
          <button type="submit" className="btn btn-primary me-2">Guardar y enviar a revisión</button>
          <button type="button" className="btn btn-secondary" onClick={() => window.history.back()}>Cancelar</button>
        </div>
      )}
    </form>
  );
};

export default BackgroundForm;
