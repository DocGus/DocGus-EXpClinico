import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const StudentPatientRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const navigate = useNavigate();

  // Obtener solicitudes
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    setActionMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/patient_requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cargar solicitudes');
      } else {
        setRequests(data);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Manejar aceptar o rechazar
  const handleAction = async (patientId, action) => {
    setError(null);
    setActionMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/student/validate_patient/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error en la acción');
      } else {
        setActionMessage(data.message);

        if (action === 'approve') {
          // Redirigir al formulario de entrevista con el patientId (o medicalFileId si lo tienes)
          navigate(`/dashboard/student/interview/${patientId}`);
        } else {
          // Solo refrescar solicitudes si es rechazo
          fetchRequests();
        }
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  if (loading) return <div>Cargando solicitudes...</div>;

  return (
    <div>
      <h2>Solicitudes de pacientes pendientes</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {actionMessage && <div className="alert alert-success">{actionMessage}</div>}

      {requests.length === 0 ? (
        <p>No tienes solicitudes pendientes.</p>
      ) : (
        <table className="table table-striped table-dark">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.full_name}</td>
                <td>
                  <button
                    className="btn btn-success me-2"
                    onClick={() => handleAction(req.id, 'approve')}
                  >
                    Aceptar
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleAction(req.id, 'reject')}
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

export default StudentPatientRequests;
