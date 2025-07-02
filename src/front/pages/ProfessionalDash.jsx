import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfessionalDash = () => {
  const [reviewFiles, setReviewFiles] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Expedientes en revisión
    const fetchReviewFiles = async () => {
      try {
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

    // Solicitudes de estudiantes
    const fetchStudentRequests = async () => {
      try {
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

    fetchReviewFiles();
    fetchStudentRequests();
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

      setReviewFiles((prev) => prev.filter((file) => file.id !== fileId));
      setComment("");
    } catch (error) {
      alert(error.message);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error procesando acción");

      alert(data.message);

      if (action === "reject") {
        // Quitar de la lista si se rechaza
        setStudentRequests((prev) => prev.filter((s) => s.id !== studentId));
      } else if (action === "approve") {
        // Marcar como aprobado para mostrar botón verde
        setStudentRequests((prev) =>
          prev.map((student) =>
            student.id === studentId ? { ...student, status: "approved" } : student
          )
        );
      }
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

      <h4>Solicitudes de estudiantes</h4>
      {studentRequests.length === 0 ? (
        <p>No hay solicitudes.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Carrera</th>
              <th>Grado</th>
              <th>Solicitado en</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {studentRequests.map((student) => (
              <tr key={student.id}>
                <td>{student.full_name}</td>
                <td>{student.email}</td>
                <td>{student.career}</td>
                <td>{student.academic_grade}</td>
                <td>{student.requested_at}</td>
                <td>
                  {student.status === "approved" ? (
                    <button
                      className="btn"
                      style={{
                        backgroundColor: "#28a745",
                        color: "#fff",
                        cursor: "default",
                        border: "none",
                      }}
                      disabled
                    >
                      Aprobado
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStudentAction(student.id, "approve")}
                        className="btn btn-success me-2"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleStudentAction(student.id, "reject")}
                        className="btn btn-danger"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
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
