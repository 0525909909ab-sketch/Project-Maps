import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

const Layout = () => {
  return (
    <div className='Layout-page'>
        <NavBar/>
      <Outlet />
    </div>
  );
};

export default Layout;
