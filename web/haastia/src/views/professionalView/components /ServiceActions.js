import React from 'react';

function ServiceActions({ service, setIsEditing }) {
    const handleDelete = async () => {
        const confirmDelete = window.confirm(
            'Are you sure you want to delete this service? It will not affect any appointments already booked.'
        );
        if (confirmDelete) {
            try {
                // Call the delete API
                await fetch(`/api/services/${service._id}`, {
                    method: 'DELETE',
                });
                window.location.reload(); // Reload the page after deletion
            } catch (error) {
                console.error('Error deleting service:', error);
            }
        }
    };

    return (
        <div className="service-actions">
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button onClick={handleDelete}>Delete</button>
        </div>
    );
}

export default ServiceActions;
