import React, { useState } from 'react';

const PatientRequestStudent = () => {
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!studentId) {
      setError('Por favor ingresa un ID válido de estudiante.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/patient/request_student_validation/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al enviar la solicitud.');
      } else {
        setMessage('Solicitud enviada exitosamente al estudiante.');
        setStudentId('');
      }
    } catch (err) {
      setError('Error al conectar con el servidor.');
    }
  };

  return (
    <div>
      <h2>Solicitar estudiante para llenar expediente</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="studentId" className="form-label">ID del Estudiante</label>
          <input
            type="number"
            id="studentId"
            className="form-control"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            min="1"
          />
        </div>
        <button type="submit" className="btn btn-primary">Enviar solicitud</button>
      </form>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}
    </div>
  );
};

export default PatientRequestStudent;