import React, { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const PatientDash = () => {
  const [patientStatus, setPatientStatus] = useState("");
  const [medicalFileId, setMedicalFileId] = useState(null);
  const [fileStatus, setFileStatus] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const userRes = await fetch(`${backendUrl}/api/private`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();

        setPatientStatus(userData.user.status);

        if (userData.user.medical_file_id) {
          setMedicalFileId(userData.user.medical_file_id);

          // Obtener expediente para conocer el file_status
          const fileRes = await fetch(`${backendUrl}/api/medical_file/${userData.user.medical_file_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (fileRes.ok) {
            const fileData = await fileRes.json();
            setFileStatus(fileData.medical_file.file_status);
          }

          // Obtener snapshots
          const snapRes = await fetch(`${backendUrl}/api/patient/snapshots/${userData.user.medical_file_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (snapRes.ok) {
            const snapData = await snapRes.json();
            setSnapshots(snapData);
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
  }, []);

  const handleAction = async (actionType) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/patient/confirm_file/${medicalFileId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: actionType, comment }),
      });

      if (!res.ok) throw new Error("Error al enviar acción");
      alert(`Expediente ${actionType} correctamente.`);

      if (actionType === "reject") {
        setSnapshots([]);
        setComment("");
      }

      window.location.reload();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="patient-dash">
      <h2>Panel del Paciente</h2>
      <p>Status usuario: {patientStatus}</p>
      <p>Status expediente: {fileStatus}</p>

      {(fileStatus === "approved" || fileStatus === "confirmed") && snapshots.length > 0 ? (
        <>
          <h4>Tu expediente listo para revisar</h4>
          <a
            href={snapshots[0].url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-info"
          >
            Ver snapshot
          </a>

          {/* Botón Confirmar solo si aún no confirmado */}
          {fileStatus === "approved" && (
            <button
              onClick={() => handleAction("confirm")}
              className="btn btn-success mt-2 me-2"
            >
              Confirmar
            </button>
          )}

          {/* Botón Solicitar cambios siempre visible si approved o confirmed */}
          <div className="mt-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentarios para solicitar cambios (opcional)"
              className="form-control mb-2"
            />
            <button
              onClick={() => handleAction("reject")}
              className="btn btn-danger"
            >
              Solicitar cambios
            </button>
          </div>
        </>
      ) : (
        <p>No tienes expediente revisado aún.</p>
      )}
    </div>
  );
};

export default PatientDash;
