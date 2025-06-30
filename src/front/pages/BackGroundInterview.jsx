import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import BackgroundForm from "../components/BackgroundForm";

const BackGroundInterview = () => {
  const { medicalFileId } = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchMedicalFile = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/medical_file/${medicalFileId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
        } else {
          console.error("Error al obtener expediente");
        }
      } catch (err) {
        console.error("Error al conectar:", err);
      }
    };
    if (medicalFileId) fetchMedicalFile();
  }, [medicalFileId]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Entrevista</h1>
      <BackgroundForm initialData={initialData} medicalFileId={medicalFileId} />
    </div>
  );
};

export default BackGroundInterview;
