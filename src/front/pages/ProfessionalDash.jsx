import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfessionalDash = () => {
  const [studentRequests, setStudentRequests] = useState([]);
  const [reviewFiles, setReviewFiles] = useState([]);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentRequests();
    fetchReviewFiles();
  }, []);

  const fetchStudentRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/professional/student_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error cargando solicitudes de estudiantes");
      const data = await res.json();
      setStudentRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

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

  const handleStudentAction = async (studentId, action) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/professional/validate_student/${studentId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Error procesando acción");
      alert(`Estudiante ${action} exitosamente.`);
      fetchStudentRequests(); // Refrescar lista
    } catch (error) {
      alert(error.message);
    }
  };

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
      if (!res.ok) throw new Error("Error procesando expediente");
      alert(`Expediente ${action} correctamente.`);
      fetchReviewFiles();
      setComment(""); // Limpiar comentario
    } catch (error) {
      alert(error.message);
    }
  };

  const goToInterview = (medicalFileId) => {
    navigate(`/dashboard/professional/interview/${medicalFileId}`);
  };

  return (
    <div className="professional-dash container py-4">
      <h2>Panel del Profesional</h2>

      {/* ---------- Tabla de solicitudes de estudiantes ---------- */}
      <h4 className="mt-4">Solicitudes de estudiantes</h4>
      {studentRequests.length === 0 ? (
        <p>No hay solicitudes de estudiantes pendientes.</p>
      ) : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Carrera</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {studentRequests.map((student) => (
              <tr key={student.id}>
                <td>{student.full_name}</td>
                <td>{student.email}</td>
                <td>{student.career}</td>
                <td>
                  <button
                    onClick={() => handleStudentAction(student.id, "approve")}
                    className="btn btn-success me-2"
                    style={{
                      opacity: student.approved ? 0.6 : 1,
                      fontWeight: student.approved ? "normal" : "bold",
                    }}
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleStudentAction(student.id, "reject")}
                    className="btn btn-danger"
                  >
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ---------- Tabla de expedientes en revisión ---------- */}
      <h4 className="mt-5">Expedientes en revisión</h4>
      {reviewFiles.length === 0 ? (
        <p>No hay expedientes en revisión.</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>ID</th>
              <th>Paciente</th>
              <th>Estudiante</th>
              <th>Acciones</th>
              <th>Entrevista</th>
            </tr>
          </thead>
          <tbody>
            {reviewFiles.map((file) => (
              <tr key={file.id}>
                <td>{file.id}</td>
                <td>{file.patient_name}</td>
                <td>{file.student_name}</td>
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
