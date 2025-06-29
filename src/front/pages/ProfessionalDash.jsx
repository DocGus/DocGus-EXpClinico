import React, { useEffect, useState } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfessionalDash = () => {
  const [studentRequests, setStudentRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/professional/student_requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error cargando solicitudes");
      const data = await res.json();
      setStudentRequests(data);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (studentId, action) => {
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
      if (!res.ok) throw new Error("Error al procesar solicitud");
      alert(`Solicitud ${action} correctamente.`);
      fetchRequests(); // refrescar lista
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="professional-dash">
      <h2>Panel del Profesional</h2>
      <h4>Solicitudes de estudiantes</h4>

      {studentRequests.length === 0 ? (
        <p>No hay solicitudes pendientes.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Email</th>
              <th>Carrera</th>
              <th>Grado académico</th>
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
                <td>
                  <button
                    onClick={() => handleAction(student.id, "approve")}
                    className="btn btn-success me-2"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleAction(student.id, "reject")}
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
    </div>
  );
};

export default ProfessionalDash;
