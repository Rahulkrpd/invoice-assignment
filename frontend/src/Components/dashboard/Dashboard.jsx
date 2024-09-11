import React from 'react';
import "./dashboard.css";
import { Link, Outlet } from "react-router-dom";

const Dashboard = () => {
    // Fetch the company name from localStorage
    const companyName = localStorage.getItem('CompanyName');

    // Capitalize the first letter and make the rest lowercase
    const CompanyName = companyName
        ? companyName.charAt(0).toUpperCase() + companyName.slice(1).toLowerCase()
        : '';

    const companylogo = localStorage.getItem('photoURL');

    return (
        <div className="dashboard-wrapper">
            <div className="side-nav">
                <div className="profile-info">
                    <img src={companylogo} alt="Profile" />
                    <p>{CompanyName}</p>
                    <button>Logout</button>
                </div>
                <hr className='line' />

                {/* Updated paths for the links */}
                <Link to={'/dashboard/home'} className='menu-link'>Home</Link>
                <Link to={'/dashboard/invoice'} className='menu-link'>Invoices</Link>
                <Link to={'/dashboard/new-invoice'} className='menu-link'>New Invoice</Link>
                <Link to={'/dashboard/settings'} className='menu-link'>Settings</Link>
            </div>

            <div className="main-container">
                {/* Render child components here */}
                <Outlet />
            </div>
        </div>
    );
}

export default Dashboard;
