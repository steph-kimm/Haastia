import React, { useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "./AddServiceForm.css";

const AddServiceForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ Convert selected images to Base64 for Cloudinary
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileReaders = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(fileReaders)
      .then((base64Images) => {
        setImages(base64Images);
        setPreview(files.map((file) => URL.createObjectURL(file)));
      })
      .catch((err) => console.error("Error reading files:", err));
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");

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

      const response = await axios.post(
        "http://localhost:8000/api/services",
        serviceData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Service added:", response.data);
      setSuccessMessage("Service added successfully!");
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setDuration("");
      setImages([]);
      setPreview([]);
    } catch (error) {
      console.error("❌ Error adding service:", error);
      alert("Failed to add service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-form-container">
      <h2 className="form-title">Add a New Service</h2>

      {successMessage && <p className="success-message">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="service-form">
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
          ></textarea>
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
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
          />
          <div className="image-preview">
            {preview.map((src, i) => (
              <img key={i} src={src} alt={`preview-${i}`} />
            ))}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Adding..." : "Add Service"}
        </button>
      </form>
    </div>
  );
};

export default AddServiceForm;
