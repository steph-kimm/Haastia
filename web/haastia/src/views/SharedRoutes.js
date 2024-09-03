import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SharedPage1 from '../pages/SharedPage1';
import SharedPage2 from '../pages/SharedPage2';

function SharedRoutes() {
    return (
        <>
            <Route path="/shared-page-1" element={<SharedPage1 />} />
            <Route path="/shared-page-2" element={<SharedPage2 />} />
            {/* Add more shared routes here */}
        </>
    );
}

export default SharedRoutes;

// TO use this import it into both of the routes files. 