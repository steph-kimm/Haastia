import React, { useState } from 'react';

function EditServiceForm({ service, setIsEditing }) {
    const [title, setTitle] = useState(service.title);
    const [description, setDescription] = useState(service.description);
    const [price, setPrice] = useState(service.price);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Call the update API
            await fetch(`/api/services/${service._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description, price }),
            });
            setIsEditing(false); // Close the edit form after saving
            window.location.reload(); // Reload the page to reflect changes
        } catch (error) {
            console.error('Error updating service:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Title" 
                required 
            />
            <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Description" 
                required 
            />
            <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                placeholder="Price" 
                required 
            />
            <button type="submit">Submit</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
    );
}

export default EditServiceForm;
