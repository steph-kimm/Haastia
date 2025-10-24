import React from 'react';
import { useNavigate } from 'react-router-dom';

const SwitchView = ({ view }) => {
  const navigate = useNavigate();

  const handleSwitch = () => {
    localStorage.setItem('userView', view); // Save view to local storage or context
    navigate(`/${view}-home`); // Navigate to the corresponding home page
  };

  return (
    <button onClick={handleSwitch} className="dropdown-item">
      Switch to {view} View
    </button>
  );
};

export default SwitchView;
