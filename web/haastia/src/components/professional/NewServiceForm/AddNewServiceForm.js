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
      <div className="form-grid">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            placeholder="e.g., Haircut & Style"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Describe your service..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
          />
        </div>

        <div className="form-row">
          <div className="form-group half">
            <label>Price ($)</label>
            <input
              type="number"
              min="20"
              max="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group half">
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <input
            type="text"
            placeholder="e.g., Hair, Nails, Makeup"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Upload Images</label>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
          {preview.length > 0 && (
            <div className="image-preview">
              {preview.map((src, i) => (
                <img key={i} src={src} alt={`preview-${i}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Adding..." : "Add Service"}
      </button>
    </form>
  );
};

export default AddNewServiceForm;
