import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyServices.css";
import { jwtDecode } from "jwt-decode";

const MyServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({ title: "", price: "", description: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/services/my-services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching services:", err);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(services.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Error deleting service:", err);
    }
  };

  const startEdit = (service) => {
    setEditing(service._id);
    setEditData({
      title: service.title,
      price: service.price,
      description: service.description,
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = async (id) => {
    try {
      const res = await axios.put(
        `http://localhost:8000/api/services/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setServices(services.map((s) => (s._id === id ? res.data : s)));
      setEditing(null);
    } catch (err) {
      console.error("Error updating service:", err);
    }
  };

  if (loading) return <p>Loading services...</p>;

  return (
    <div className="services-container">
      <h2>My Services</h2>
      {services.length === 0 ? (
        <p className="no-services">You haven’t added any services yet.</p>
      ) : (
        <div className="service-grid">
          {services.map((service) => (
            <div key={service._id} className="service-card">
              {service.images?.[0]?.url && (
                <img src={service.images[0].url} alt={service.title} className="service-img" />
              )}

              {editing === service._id ? (
                <div className="edit-form">
                  <input
                    name="title"
                    value={editData.title}
                    onChange={handleEditChange}
                    placeholder="Title"
                  />
                  <input
                    name="price"
                    type="number"
                    value={editData.price}
                    onChange={handleEditChange}
                    placeholder="Price"
                  />
                  <textarea
                    name="description"
                    value={editData.description}
                    onChange={handleEditChange}
                    placeholder="Description"
                  />
                  <button onClick={() => saveEdit(service._id)}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <h3>{service.title}</h3>
                  <p className="price">${service.price}</p>
                  <p className="category">{service.category}</p>
                  <p className="desc">{service.description}</p>

                  <div className="actions">
                    <button onClick={() => startEdit(service)}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(service._id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyServices;
