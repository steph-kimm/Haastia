import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [category, setCategory] = useState('All');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:8000/api/get-posts");
                setPosts(response.data);
                setFilteredPosts(response.data);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };

        fetchPosts();
    }, []);

    const filterPosts = (category) => {
        if (category === 'All') {
            setFilteredPosts(posts);
        } else {
            const filtered = posts.filter(post => post.category === category);
            setFilteredPosts(filtered);
        }
    };

    useEffect(() => {
        filterPosts(category);
    }, [category, posts]);

    return (
        <div className="home-container">
            <h1>Welcome to Haastia</h1>
            <p>Connecting people to small beauticians in the area</p>
            <div className="category-menu">
                {['All', 'Hair', 'Nails', 'Makeup', 'Wax'].map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}>
                        {cat}
                    </button>
                ))}
            </div>
            <div className="posts-container">
                {filteredPosts.map(post => (
                    //   <Link to={`/service/${post._id}`} key={post._id} className="post-link"></Link>
                    <Link to={`/service/${post._id}`} key={post._id} className="post-link">
                        <div key={post._id} className="post-card">
                            {post.images.length > 0 && <img src={post.images[0].url} alt={post.title} />}
                            <h2>{post.title}</h2>
                            <p>{post.description}</p>
                            <Link to={`/profile/${post.owner.id}`}><p><strong>Owner:</strong> {post.owner.name}</p> </Link>
                            <p className="price">${post.price}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Home;
