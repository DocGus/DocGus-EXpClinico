import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfessionalDash = () => {
  const [reviewFiles, setReviewFiles] = useState([]);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviewFiles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${backendUrl}/api/professional/review_files`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error cargando expedientes en revisión");
        const data = await res.json();
        setReviewFiles(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchReviewFiles();
  }, []);

  const handleReviewAction = async (fileId, action) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/professional/review_file/${fileId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, comment }),
      });
      if (!res.ok) throw new Error("Error procesando acción");
      alert(`Expediente ${action} correctamente.`);

      // Filtra la lista local para ocultar después de acción
      setReviewFiles((prev) => prev.filter((file) => file.id !== fileId));
      setComment(""); // Limpia comentario
    } catch (error) {
      alert(error.message);
    }
  };

  const goToInterview = (medicalFileId) => {
    navigate(`/dashboard/professional/interview/${medicalFileId}`);
  };

  return (
    <div className="professional-dash">
      <h2>Panel del Profesional</h2>
      <h4>Expedientes en revisión</h4>

      {reviewFiles.length === 0 ? (
        <p>No hay expedientes pendientes de revisión.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID Expediente</th>
              <th>Acciones</th>
              <th>Entrevista</th>
            </tr>
          </thead>
          <tbody>
            {reviewFiles.map((file) => (
              <tr key={file.id}>
                <td>{file.id}</td>
                <td>
                  <textarea
                    placeholder="Comentario (opcional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="form-control mb-2"
                  />
                  <button
                    onClick={() => handleReviewAction(file.id, "approve")}
                    className="btn btn-success me-2"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReviewAction(file.id, "reject")}
                    className="btn btn-danger"
                  >
                    Regresar a progreso
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => goToInterview(file.id)}
                    className="btn btn-primary"
                  >
                    Ver entrevista
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProfessionalDash;