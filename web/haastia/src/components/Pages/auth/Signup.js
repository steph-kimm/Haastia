import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import './Auth.css'


const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        location: '',
        isProvider: false,
        availability: daysOfWeek.map(day => ({ day, slots: '' }))
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('availability')) {
            const index = parseInt(name.split('-')[1]);
            const newAvailability = [...formData.availability];
            newAvailability[index].slots = value;
            setFormData({ ...formData, availability: newAvailability });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value
            });
        }
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();
    //     try {
    //         const response = await axios.post('http://localhost:8000/api/signup', formData);
    //         console.log(response.data);
    //         const { token } = response.data;

    //         // Store token in localStorage or sessionStorage
    //         localStorage.setItem('token', token);

    //         // Decode token to get expiration time
    //         console.log('token', token);
    //         const decodedToken = jwtDecode(token);
    //         const expirationTime = decodedToken.exp * 1000 - Date.now();

    //         // Set a timeout to log out when the token expires
    //         setTimeout(() => {
    //             localStorage.removeItem('token');
    //             navigate('/login'); // Redirect to login page after token expires
    //         }, expirationTime);

    //         // Redirect to the homepage
    //         console.log('rediert')
    //         navigate('/');
    //     } catch (error) {
    //         console.error('Error signing up:', error);
    //     }
    // };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Make the API call
            const response = await axios.post('http://localhost:8000/api/signup', formData);
            
            // Log the full response
            console.log('Full Response:', response);
            
            // Extract the token
            const token = response.data.token;
    
            // Debug the token
            console.log('Token Received:', token);
            
            // Check if token is valid
            if (!token || typeof token !== 'string') {
                throw new Error('Invalid token received');
            }
    
            // Store token in localStorage or sessionStorage
            localStorage.setItem('token', token);
    
            // Decode token to get expiration time
            const decodedToken = jwtDecode(token);
            const expirationTime = decodedToken.exp * 1000 - Date.now();
    
            console.log('Token Expiration Time:', expirationTime);
    
            // Set a timeout to log out when the token expires
            setTimeout(() => {
                localStorage.removeItem('token');
                navigate('/login'); // Redirect to login page after token expires
            }, expirationTime);
    
            // Log before navigating
            console.log('Navigating to homepage...');
    
            // Redirect to the homepage
            navigate('/');
        } catch (error) {
            // Log any errors
            console.error('Error signing up:', error);
        }
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
            <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Location" required />
            <label>
                <input type="checkbox" name="isProvider" checked={formData.isProvider} onChange={handleChange} />
                I am a service provider
            </label>
            {formData.isProvider && (
                <div>
                    <h3>Availability</h3>
                    {daysOfWeek.map((day, index) => (
                        <div key={day}>
                            <label>{day}</label>
                            <input
                                type="text"
                                name={`availability-${index}`}
                                value={formData.availability[index].slots}
                                onChange={handleChange}
                                placeholder="e.g., 09:00-11:00, 14:00-17:00"
                            />
                        </div>
                    ))}
                </div>
            )}
            <button type="submit">Sign Up</button>
        </form>
    );
};

export default Signup;

// import React, { useState } from 'react';
// import axios from 'axios';
// import './Auth.css'

// function Signup() {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [location, setLocation] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('YOUR_SERVER_URL/signup', {
//         name,
//         email,
//         password,
//         location
//       });
//       console.log(response.data);
//     } catch (error) {
//       console.error('Error signing up:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>Signup</h1>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           required
//         />
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <input
//           type="text"
//           placeholder="Location"
//           value={location}
//           onChange={(e) => setLocation(e.target.value)}
//           required
//         />
//         <button type="submit">Signup</button>
//       </form>
//     </div>
//   );
// }

// export default Signup;
