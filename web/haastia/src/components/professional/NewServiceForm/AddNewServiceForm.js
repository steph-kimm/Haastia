// src/views/professionalView/AddNewServiceForm.jsx
import React, { useState } from "react";
import axios from "axios";

const AddNewServiceForm = ({ onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  // Convert image files to Base64 for Cloudinary
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const readers = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers)
      .then((base64Images) => {
        setImages(base64Images);
        setPreview(files.map((f) => URL.createObjectURL(f)));
      })
      .catch((err) => console.error("File read error:", err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to add a service.");
      setLoading(false);
      return;
    }

    try {
      const serviceData = {
        title,
        description,
        price,
        category,
        duration,
        images,
      };

      const res = await axios.post("http://localhost:8000/api/services", serviceData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // notify parent page
      onSuccess?.(res.data);

      // reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setDuration("");
      setImages([]);
      setPreview([]);
    } catch (err) {
      console.error("Error adding service:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to add service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="svc-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="form-header">
          <span className="badge">Service details</span>
          <h2>Tell clients about your offer</h2>
          <p className="form-lede">A few polished details can make your service stand out.</p>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="service-title">
              Service title <span aria-hidden="true">*</span>
            </label>
            <div className="input-shell">
              <input
                id="service-title"
                type="text"
                placeholder="e.g., Signature Haircut & Style"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <p className="field-hint">Keep it short, descriptive, and easy to scan.</p>
          </div>

          <div className="form-group">
            <label htmlFor="service-description">
              Description <span aria-hidden="true">*</span>
            </label>
            <div className="input-shell">
              <textarea
                id="service-description"
                placeholder="Describe what’s included, who it’s for, and any preparation tips."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
              />
            </div>
            <p className="field-hint">Speak directly to your clients—clarity builds trust.</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="service-price">
                Price <span aria-hidden="true">*</span>
              </label>
              <div className="input-shell with-prefix">
                <span className="input-prefix" aria-hidden="true">
                  $
                </span>
                <input
                  id="service-price"
                  type="number"
                  min="20"
                  max="1000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <p className="field-hint">Clients see this price before they book.</p>
            </div>

            <div className="form-group">
              <label htmlFor="service-duration">
                Duration <span aria-hidden="true">*</span>
              </label>
              <div className="input-shell with-suffix">
                <input
                  id="service-duration"
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
                <span className="input-suffix" aria-hidden="true">
                  min
                </span>
              </div>
              <p className="field-hint">Consider prep, service, and clean-up time.</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="service-category">Category</label>
            <div className="input-shell">
              <input
                id="service-category"
                type="text"
                placeholder="e.g., Hair, Nails, Makeup"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <p className="field-hint">Optional, but it helps clients filter their search.</p>
          </div>

          <div className="form-group">
            <label htmlFor="service-images">Service gallery</label>
            <div className="upload-card">
              <div className="upload-icon" aria-hidden="true">
                📸
              </div>
              <div className="upload-copy">
                <p className="upload-title">Drag & drop images here</p>
                <p className="field-hint">High-quality photos build client confidence.</p>
                <span className="upload-action">Browse from your device</span>
              </div>
              <input
                id="service-images"
                className="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </div>
            {preview.length > 0 && (
              <div className="image-preview">
                {preview.map((src, i) => (
                  <img key={i} src={src} alt={`preview-${i}`} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add Service"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddNewServiceForm;
