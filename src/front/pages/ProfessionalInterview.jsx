import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BackgroundForm from "../components/BackgroundForm";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfessionalInterview = () => {
  const { medicalFileId } = useParams();
  const [fileData, setFileData] = useState(null);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFileData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${backendUrl}/api/medical_file/${medicalFileId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Error al cargar expediente");
        const data = await res.json();
        setFileData(data);
      } catch (error) {
        console.error(error);
        alert("Error al cargar expediente");
      }
    };

    fetchFileData();
  }, [medicalFileId]);

  const handleAction = async (action) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/professional/review_file/${medicalFileId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, comment }),
      });

      if (!res.ok) throw new Error("Error al procesar la acción");
      alert(`Expediente ${action} correctamente.`);
      navigate("/dashboard/professional");
    } catch (error) {
      console.error(error);
      alert("Error al procesar acción");
    }
  };

  if (!fileData) return <p>Cargando entrevista...</p>;

  const patient = fileData.patient;
  if (!patient) return <p>Información del paciente no disponible</p>;

  // Preparar initialData con todos los antecedentes
  const initialData = {
    patological_background: fileData.pathological_background || {},
    family_background: fileData.family_background || {},
    non_pathological_background: fileData.non_pathological_background || {},
    gynecological_background: fileData.gynecological_background || {},
    personal_data: {
      sex: fileData.non_pathological_background?.sex || "",
      address: fileData.non_pathological_background?.address || ""
    }
  };

  return (
    <div className="container mt-4">
      <h2>Revisión del expediente #{medicalFileId}</h2>

      <h4 className="mt-3">Paciente:</h4>
      <p>{patient.first_name} {patient.first_surname}</p>

      <h4 className="mt-3">Estado del expediente:</h4>
      <p>{fileData.file_status}</p>

      {/* Mostrar formulario solo en lectura */}
      <BackgroundForm
        initialData={initialData}
        readOnly={true}
      />

      <textarea
        className="form-control mt-3"
        placeholder="Comentario para el estudiante (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      ></textarea>

      <div className="mt-3">
        <button
          onClick={() => handleAction("approve")}
          className="btn btn-success me-2"
        >
          Aprobar
        </button>
        <button
          onClick={() => handleAction("reject")}
          className="btn btn-danger"
        >
          Rechazar
        </button>
      </div>
    </div>
  );
};

export default ProfessionalInterview;
