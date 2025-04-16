import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4">
        <h2 className="text-center mb-3">Dashboard</h2>
        <p className="text-center">
          Welcome to your SteelDocs AI dashboard!
        </p>

        <div className="d-flex justify-content-center">
          <Link to="/upload" className="btn btn-primary">
            Upload a PDF
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
