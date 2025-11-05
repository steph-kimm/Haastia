import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MyServices.css";

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

  if (loading) return <p className="loading">Loading services...</p>;

  const serviceCount = services.length;

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="hero-sheen" aria-hidden="true" />
        <div className="hero-content">
          <span className="hero-kicker">Professional Console</span>
          <h1>My Services</h1>
          <p>
            Curate, refine, and publish the offerings your clients rely on. Keep your
            catalogue fresh and aligned with your business goals.
          </p>
        </div>
      </section>

      <div className="services-container">
        <header className="services-header">
          <div>
            <h2>Service catalogue</h2>
            <p className="services-subhead">
              {serviceCount === 0
                ? "You haven’t added any services yet. Start by crafting your first offering."
                : "Review your live services and fine-tune details in real time."}
            </p>
          </div>
          <span className="service-count" aria-live="polite">
            {serviceCount} {serviceCount === 1 ? "service" : "services"}
          </span>
        </header>

        {serviceCount === 0 ? (
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
                    <div className="edit-actions">
                      <button onClick={() => saveEdit(service._id)}>Save</button>
                      <button onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="service-heading">
                      <h3>{service.title}</h3>
                      <p className="price">${service.price}</p>
                    </div>
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
    </div>
  );
};

export default MyServices;
