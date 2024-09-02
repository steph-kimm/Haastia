import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css'
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/api/signin', { email, password });
      console.log(response.data);
      const { token } = response.data;

      // Store token in localStorage or sessionStorage
      localStorage.setItem('token', token);

      // Decode token to get expiration time
      const decodedToken = jwtDecode(token);
      const expirationTime = decodedToken.exp * 1000 - Date.now();

      // Set a timeout to log out when the token expires
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/login'); // Redirect to login page after token expires
      }, expirationTime);

      // Redirect to the homepage
      navigate('/');

    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
