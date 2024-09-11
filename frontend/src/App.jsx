import { Routes, Route } from "react-router-dom";
import Login from "./Components/login/Login";
import Register from "./Components/register/Register";
import Dashboard from "./Components/dashboard/Dashboard";
import Home from "./Components/dashboard/pages/Home";
import NewInvoice from "./Components/dashboard/pages/NewInvoice";
import Setting from "./Components/dashboard/pages/Setting";
import InvoiceList from "./Components/dashboard/pages/Invoice";

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Parent route for Dashboard with nested child routes */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="home" element={<Home />} />
          <Route path="invoice" element={<InvoiceList />} />
          <Route path="new-invoice" element={<NewInvoice />} />
          <Route path="settings" element={<Setting />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
