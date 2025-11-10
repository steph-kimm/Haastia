// src/views/professionalView/AddNewServiceForm.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getValidToken } from "../../../utils/auth";

const AddNewServiceForm = ({ onSuccess }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [images, setImages] = useState([]);
  const [preview, setPreview] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleAddAddOn = () => {
    setAddOns((prev) => [...prev, { title: "", description: "", price: "" }]);
  };

  const handleRemoveAddOn = (index) => {
    setAddOns((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddOnChange = (index, field, value) => {
    setAddOns((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const auth = getValidToken();
    if (!auth) {
      alert("Your session has expired. Please log in again.");
      navigate("/login");
      setLoading(false);
      return;
    }
    const { token } = auth;

    try {
      const hasIncompleteAddOn = addOns.some((addOn) => {
        const hasAnyValue =
          addOn.title.trim() !== "" ||
          addOn.description.trim() !== "" ||
          addOn.price !== "";

        if (!hasAnyValue) {
          return false;
        }

        const priceValue = parseFloat(addOn.price);
        return addOn.title.trim() === "" || addOn.price === "" || Number.isNaN(priceValue);
      });

      if (hasIncompleteAddOn) {
        alert("Please complete or remove any add-ons with missing information.");
        setLoading(false);
        return;
      }

      const normalizedAddOns = addOns
        .filter((addOn) => addOn.title.trim() !== "" && addOn.price !== "")
        .map((addOn) => {
          const titleValue = addOn.title.trim();
          const descriptionValue = addOn.description.trim();
          const priceValue = parseFloat(addOn.price);

          return {
            title: titleValue,
            price: priceValue,
            ...(descriptionValue ? { description: descriptionValue } : {}),
          };
        });

      const serviceData = {
        title,
        description,
        price: price ? parseFloat(price) : undefined,
        category,
        duration: duration ? parseInt(duration, 10) : undefined,
        images,
        addOns: normalizedAddOns,
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
      setAddOns([]);
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

          <div className="form-group addons-section">
            <div className="addons-header">
              <p className="addons-title">Add-ons</p>
              <p className="field-hint">
                Offer optional upgrades clients can choose when booking this service.
              </p>
            </div>

            {addOns.length > 0 && (
              <div className="addons-list">
                {addOns.map((addOn, index) => (
                  <div className="addon-card" key={`addon-${index}`}>
                    <div className="addon-card-header">
                      <p className="addon-label">Add-on {index + 1}</p>
                      <button
                        type="button"
                        className="btn-remove-addon"
                        onClick={() => handleRemoveAddOn(index)}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="addon-fields">
                      <div className="addon-row">
                        <div className="addon-field">
                          <label htmlFor={`addon-title-${index}`}>Title</label>
                          <div className="input-shell">
                            <input
                              id={`addon-title-${index}`}
                              type="text"
                              placeholder="e.g., Deep conditioning treatment"
                              value={addOn.title}
                              onChange={(e) => handleAddOnChange(index, "title", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="addon-field">
                          <label htmlFor={`addon-price-${index}`}>Price</label>
                          <div className="input-shell with-prefix">
                            <span className="input-prefix" aria-hidden="true">
                              $
                            </span>
                            <input
                              id={`addon-price-${index}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={addOn.price}
                              onChange={(e) => handleAddOnChange(index, "price", e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="addon-field">
                        <label htmlFor={`addon-description-${index}`}>Description</label>
                        <div className="input-shell">
                          <textarea
                            id={`addon-description-${index}`}
                            rows={3}
                            placeholder="Share what makes this add-on special."
                            value={addOn.description}
                            onChange={(e) =>
                              handleAddOnChange(index, "description", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              className="btn-ghost add-addon-btn"
              onClick={handleAddAddOn}
            >
              + Add add-on
            </button>
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
