import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const StudentDash = () => {
  const [patientRequests, setPatientRequests] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [professionalId, setProfessionalId] = useState("");
  const [studentStatus, setStudentStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Obtener datos del usuario
        const userRes = await fetch(`${backendUrl}/api/private`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        setStudentStatus(userData.user.status);

        // Obtener solicitudes de pacientes
        const requestsRes = await fetch(`${backendUrl}/api/student/patient_requests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const requestsData = await requestsRes.json();
        setPatientRequests(requestsData);

        // Obtener pacientes asignados
        await fetchAssignedPatients(token);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  const fetchAssignedPatients = async (token) => {
    try {
      const res = await fetch(`${backendUrl}/api/student/assigned_patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignedPatients(data);
    } catch (error) {
      console.error("Error fetching assigned patients:", error);
    }
  };

  const handleRequestApproval = async () => {
    if (!professionalId) {
      alert("Debes ingresar el ID del profesional");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/request_student_validation/${professionalId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error solicitando aprobación");
      alert("Solicitud de aprobación enviada.");
      setStudentStatus("pre_approved");
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePatientAction = async (patientId, action) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/student/validate_patient/${patientId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Error procesando solicitud");
      alert(`Solicitud ${action} correctamente.`);

      // Quitar de la lista de solicitudes
      setPatientRequests(patientRequests.filter(p => p.id !== patientId));

      // Refrescar pacientes asignados
      await fetchAssignedPatients(token);
    } catch (error) {
      alert(error.message);
    }
  };

  const goToInterview = (medicalFileId) => {
    // Navegar a la entrevista; la vista de entrevista debe encargarse de cargar el expediente
    navigate(`/dashboard/student/interview/${medicalFileId}`);
  };

  return (
    <div className="student-dash">
      <h2>Panel del Estudiante</h2>

      <div className="request-professional-approval">
        <h4>Solicitar aprobación al profesional</h4>
        <input
          type="number"
          placeholder="ID del profesional"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
          disabled={studentStatus === "approved"}
          className="form-control mb-2"
        />
        <button
          onClick={handleRequestApproval}
          disabled={!professionalId || studentStatus === "approved"}
          className="btn btn-primary"
        >
          Enviar solicitud
        </button>
      </div>

      <div className="patient-requests mt-4">
        <h3>Solicitudes de pacientes</h3>
        {patientRequests.length === 0 ? (
          <p>No hay solicitudes pendientes.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Acciones</th>
                <th>Entrevista</th>
              </tr>
            </thead>
            <tbody>
              {patientRequests.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.full_name}</td>
                  <td>
                    <button
                      onClick={() => handlePatientAction(patient.id, "approve")}
                      className="btn btn-success me-2"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handlePatientAction(patient.id, "reject")}
                      className="btn btn-danger"
                    >
                      Rechazar
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => goToInterview(patient.medicalFileId)}
                      className="btn btn-primary"
                      disabled={!patient.approved}
                    >
                      Entrevista
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="assigned-patients mt-4">
        <h3>Mis pacientes asignados</h3>
        {assignedPatients.length === 0 ? (
          <p>No tienes pacientes asignados aún.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Estado expediente</th>
                <th>Entrevista</th>
              </tr>
            </thead>
            <tbody>
              {assignedPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.full_name}</td>
                  <td>{patient.file_status}</td>
                  <td>
                    <button
                      onClick={() => goToInterview(patient.medicalFileId)}
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
    </div>
  );
};

export default StudentDash;
