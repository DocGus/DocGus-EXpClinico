import React, { useEffect, useState } from 'react';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/users`, {
          method: 'GET',
          headers: {
            "Authorization": `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setUsers(Array.isArray(data) ? data : data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    const confirmDelete = window.confirm("¿Estás seguro que deseas eliminar este usuario?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${backendUrl}/api/user/${userId}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el usuario');
      }

      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  };

const handleApprove = async (userId) => {
  try {
    const response = await fetch(`${backendUrl}/api/validate_professional/${userId}`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || 'No se pudo validar al profesional');
      return;
    }

    alert("Profesional validado exitosamente");

    // Recargar la lista completa después de aprobar
    const updatedResponse = await fetch(`${backendUrl}/api/users`, {
      method: 'GET',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!updatedResponse.ok) {
      throw new Error('Error actualizando la lista de usuarios');
    }

    const updatedData = await updatedResponse.json();
    setUsers(Array.isArray(updatedData) ? updatedData : updatedData.users);

  } catch (error) {
    console.error('Error validando profesional:', error);
    alert('Error validando profesional');
  }
};

  return (
    <table className="table table-hover">
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Nombre Completo</th>
          <th scope="col">Rol</th>
          <th scope="col">Status</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <th scope="row">{user.id}</th>
            <td>
              {`${user.first_name || ""} ${user.second_name || ""} ${user.first_surname || ""} ${user.second_surname || ""}`}
            </td>
            <td>{user.role}</td>
            <td>{user.status}</td>
            <td>
              <button
                className="btn btn-success me-2"
                onClick={() => handleApprove(user.id)}
                disabled={user.status === "approved" || user.role !== "professional"}
              >
                Aprobar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(user.id)}
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsersTable;