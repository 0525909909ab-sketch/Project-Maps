import React, { useState } from 'react';
import GlobalMap from './features/map/GlobalMap';
import mapboxgl from 'mapbox-gl'; 
import Layout from './pages/Layout';
import Login from './pages/Login';
import { createBrowserRouter,RouterProvider } from 'react-router-dom'
import Home from './pages/Home';
import AddLocationForm from './pages/AddLocationForm';
import UsersMap from './features/map/UsersMap';
import UserProfile from './pages/userProfile';
const myRouter=createBrowserRouter([
  {path:"/", element :<Layout/>,
    children:[
      {index:true,element:<Home/>},
      {path:'map',element:<GlobalMap/>},
      {path:'usersMap',element:<UsersMap />},
      {path:'userProfile',element:<UserProfile />},
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
