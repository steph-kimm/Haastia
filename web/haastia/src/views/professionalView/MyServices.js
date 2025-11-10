import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyServices.css";
import { getValidToken } from "../../utils/auth";

const MyServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    price: "",
    deposit: "",
    description: "",
    addOns: [],
  });
  const navigate = useNavigate();
  const auth = getValidToken();
  const token = auth?.token;

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchServices();
  }, [navigate, token]);

  const fetchServices = async () => {
    if (!token) return;
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
    if (!token) return;
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
      title: service.title || "",
      price: service.price?.toString() || "",
      deposit:
        service.deposit !== undefined && service.deposit !== null
          ? service.deposit.toString()
          : "",
      description: service.description || "",
      addOns:
        service.addOns?.map((addOn) => ({
          _id: addOn._id,
          title: addOn.title || "",
          price: addOn.price !== undefined && addOn.price !== null ? addOn.price.toString() : "",
          description: addOn.description || "",
        })) || [],
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleAddOnChange = (index, field, value) => {
    setEditData((prev) => {
      const updatedAddOns = prev.addOns.map((addOn, i) =>
        i === index ? { ...addOn, [field]: value } : addOn
      );
      return { ...prev, addOns: updatedAddOns };
    });
  };

  const addAddOnRow = () => {
    setEditData((prev) => ({
      ...prev,
      addOns: [
        ...prev.addOns,
        { _id: undefined, title: "", price: "", description: "" },
      ],
    }));
  };

  const removeAddOn = (index) => {
    setEditData((prev) => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== index),
    }));
  };

  const resetEditState = () => {
    setEditing(null);
    setEditData({ title: "", price: "", deposit: "", description: "", addOns: [] });
  };

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(value));
  };

  const saveEdit = async (id) => {
    if (!token) return;
    try {
      const trimmedTitle = editData.title.trim();
      const parsedPrice = parseFloat(editData.price);
      const parsedDeposit = editData.deposit === "" ? 0 : parseFloat(editData.deposit);

      if (!trimmedTitle) {
        alert("Title is required");
        return;
      }

      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        alert("Price must be a valid number");
        return;
      }

      if (Number.isNaN(parsedDeposit) || parsedDeposit < 0) {
        alert("Deposit must be zero or a positive number");
        return;
      }

      if (parsedDeposit > parsedPrice) {
        alert("Deposit cannot exceed the total price");
        return;
      }

      const normalizedAddOns = editData.addOns
        .filter((addOn) => addOn.title.trim() !== "" || addOn.price !== "")
        .map((addOn) => {
          const trimmedAddOnTitle = addOn.title.trim();
          const parsedAddOnPrice = parseFloat(addOn.price);

          if (!trimmedAddOnTitle || Number.isNaN(parsedAddOnPrice) || parsedAddOnPrice < 0) {
            throw new Error(
              "Each add-on must include a title and a valid, non-negative price."
            );
          }

          return {
            _id: addOn._id,
            title: trimmedAddOnTitle,
            description: addOn.description.trim(),
            price: parsedAddOnPrice,
          };
        });

      const res = await axios.put(
        `http://localhost:8000/api/services/${id}`,
        {
          title: trimmedTitle,
          price: parsedPrice,
          deposit: parsedDeposit,
          description: editData.description.trim(),
          addOns: normalizedAddOns,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setServices(services.map((s) => (s._id === id ? res.data : s)));
      resetEditState();
    } catch (err) {
      console.error("Error updating service:", err);
      alert(err.message || "Error updating service");
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
                    <input
                      name="deposit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.deposit}
                      onChange={handleEditChange}
                      placeholder="Deposit"
                    />
                    <textarea
                      name="description"
                      value={editData.description}
                      onChange={handleEditChange}
                      placeholder="Description"
                    />
                    <div className="edit-addons">
                      <div className="edit-addons-header">
                        <h4>Add-ons</h4>
                        <button type="button" onClick={addAddOnRow}>
                          + Add add-on
                        </button>
                      </div>
                      {editData.addOns.length === 0 ? (
                        <p className="no-addons-inline">No add-ons yet.</p>
                      ) : (
                        editData.addOns.map((addOn, index) => (
                          <div
                            key={addOn._id || `new-${index}`}
                            className="edit-addon-row"
                          >
                            <input
                              type="text"
                              placeholder="Add-on title"
                              value={addOn.title}
                              onChange={(e) =>
                                handleAddOnChange(index, "title", e.target.value)
                              }
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Price"
                              value={addOn.price}
                              onChange={(e) =>
                                handleAddOnChange(index, "price", e.target.value)
                              }
                            />
                            <textarea
                              placeholder="Description (optional)"
                              value={addOn.description}
                              onChange={(e) =>
                                handleAddOnChange(index, "description", e.target.value)
                              }
                            />
                            <button
                              type="button"
                              className="remove-addon"
                              onClick={() => removeAddOn(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="edit-actions">
                      <button onClick={() => saveEdit(service._id)}>Save</button>
                      <button onClick={resetEditState}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="service-heading">
                      <h3>{service.title}</h3>
                      <div className="price-stack">
                        <p className="price">{formatCurrency(service.price)}</p>
                        <p className="deposit">
                          {service.deposit && service.deposit > 0
                            ? `Deposit ${formatCurrency(service.deposit)}`
                            : "No deposit required"}
                        </p>
                      </div>
                    </div>
                    <p className="category">{service.category}</p>
                    <p className="desc">{service.description}</p>

                    {service.addOns?.length > 0 && (
                      <div className="addons-display">
                        <h4>Add-ons</h4>
                        <ul>
                          {service.addOns.map((addOn) => (
                            <li key={addOn._id}>
                              <div className="addon-header">
                                <span className="addon-title">{addOn.title}</span>
                                <span className="addon-price">{formatCurrency(addOn.price)}</span>
                              </div>
                              {addOn.description && (
                                <p className="addon-description">{addOn.description}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

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
