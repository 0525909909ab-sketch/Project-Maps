import React, { useState } from 'react';
import Map3D from './features/map/Map';
import mapboxgl from 'mapbox-gl'; 
import Layout from './pages/Layout';
import Login from './pages/Login';
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import Home from './pages/Home';
import AddLocationForm from './pages/AddLocationForm';
const myRouter=createBrowserRouter([
  {path:"/", element :<Layout/>,
    children:[
      {index:true,element:<Home/>},
      {path:'map',element:<Map3D />},
      {path:'addLocationForm',element:<AddLocationForm />},
      {path:'login',element:<Login />},
     ]
  }


])


function App() {
  

  return (
    <RouterProvider router={myRouter}/>
          
      
  );
}

export default App;
