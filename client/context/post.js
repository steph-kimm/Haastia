import React , {useState, createContext} from 'react';

const PostContext = createContext();

const PostProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);

    return (
        <PostContext.Provider value={[posts, setPosts]}>
            {children}
        </PostContext.Provider>
    );
}

export { PostContext, PostProvider }