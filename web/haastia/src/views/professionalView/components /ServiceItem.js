import React, { useState } from 'react';
import ServiceActions from './ServiceActions';
import EditServiceForm from './EditServiceForm';
import './ServiceItem.css'
function ServiceItem({ service }) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="service-item">
            {isEditing ? (
                <EditServiceForm service={service} setIsEditing={setIsEditing} />
            ) : (
                <>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <p>Price: ${service.price}</p>
                    <ServiceActions service={service} setIsEditing={setIsEditing} />
                </>
            )}
        </div>
    );
}

export default ServiceItem;
