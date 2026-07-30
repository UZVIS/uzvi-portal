import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";

import React, { useState } from "react";

import {
  LayoutDashboard,
  LogOut,
  Menu,
  ChevronDown,
  Calendar as CalendarIcon,
  ClipboardCheck,
  UserCog,
  Target,
} from "lucide-react";

import AttendanceModulePage from "./modules/attendance/AttendanceModulePage";
import PerformanceModulePage from "./modules/performance/PerformanceModulePage";


type NavLinkProps = {
  to: string;
  icon: React.ElementType;
  label: string;
};


const NavLink: React.FC<NavLinkProps> = ({
  to,
  icon: Icon,
  label,
}) => {

  const location = useLocation();

  const isActive =
    location.pathname === to;


  return (
    <Link
      to={to}
      className={`
        flex items-center justify-between
        px-4 py-3 mb-2 rounded-xl
        font-semibold transition-all

        ${
          isActive
            ? "bg-[#F37021] text-white"
            : "text-gray-400 hover:bg-white/10 hover:text-white"
        }
      `}
    >

      <div className="flex items-center gap-3">

        <Icon size={18}/>

        <span>
          {label}
        </span>

      </div>


      {
        isActive &&
        <ChevronDown size={16}/>
      }


    </Link>
  );
};



function AppLayout(){

  const [activeRole,setActiveRole] =
    useState("Employee");


  return (

    <div className="
      flex h-screen 
      bg-[#F4F6F8]
      overflow-hidden
    ">


      {/* SIDEBAR */}

      <aside
        className="
          w-[280px]
          bg-[#1A1614]
          flex flex-col
          justify-between
        "
      >


        <div>


          <div
            className="
              p-5
              border-b
              border-white/10
            "
          >

            <h1 className="
              text-white
              text-xl
              font-bold
            ">
              UZVI PORTAL
            </h1>


            <p className="
              text-[#F37021]
              text-sm
            ">
              Employee Portal
            </p>


          </div>



          <div className="px-4 py-6">


            <NavLink
              to="/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
            />


            <NavLink
              to="/attendance"
              icon={ClipboardCheck}
              label="Attendance"
            />



            <NavLink
              to="/performance"
              icon={Target}
              label="Performance & Goals"
            />


          </div>


        </div>



        {/* USER */}

        <div
          className="
            p-4
            border-t
            border-white/10
          "
        >

          <div className="flex items-center gap-3">


            <div
              className="
                w-10 h-10
                rounded-full
                bg-[#F37021]
                flex items-center justify-center
                text-white
                font-bold
              "
            >
              AU
            </div>


            <div>

              <p className="text-white">
                Admin User
              </p>


              <p className="
                text-[#F37021]
                text-sm
              ">
                {activeRole}
              </p>


            </div>


          </div>


        </div>


      </aside>





      {/* MAIN */}

      <main className="
        flex-1
        flex
        flex-col
      ">



        <header
          className="
            h-[72px]
            bg-[#1A1614]
            flex
            items-center
            justify-between
            px-6
          "
        >


          <div className="
            flex
            items-center
            gap-4
          ">


            <Menu
              className="text-white"
            />


            <h2 className="
              text-white
              font-bold
              text-lg
            ">
              UZVI Employee Portal
            </h2>


          </div>




          <div className="
            flex
            items-center
            gap-4
          ">


            <UserCog
              className="text-[#F37021]"
            />


            <select
              value={activeRole}
              onChange={(e)=>
                setActiveRole(e.target.value)
              }
              className="
                bg-[#2A2421]
                text-white
                rounded
                p-2
              "
            >

              <option>
                Employee
              </option>

              <option>
                Manager
              </option>

              <option>
                HR
              </option>

              <option>
                Admin
              </option>


            </select>




            <CalendarIcon
              className="text-[#F37021]"
            />



            <button
              className="
                text-white
                flex
                items-center
                gap-2
              "
            >

              <LogOut size={18}/>

              Logout

            </button>


          </div>


        </header>






        <div
          className="
            flex-1
            overflow-auto
            p-6
          "
        >


          <Routes>


            <Route
              path="/"
              element={
                <Navigate
                  to="/attendance"
                  replace
                />
              }
            />



            <Route
              path="/dashboard"
              element={
                <Navigate
                  to="/attendance"
                  replace
                />
              }
            />



            <Route
              path="/attendance"
              element={
                <AttendanceModulePage/>
              }
            />



            <Route
              path="/performance"
              element={
                <PerformanceModulePage/>
              }
            />



            <Route
              path="*"
              element={
                <Navigate
                  to="/attendance"
                  replace
                />
              }
            />


          </Routes>



        </div>


      </main>



    </div>

  );

}




export default function App(){

  return (

    <Router>

      <AppLayout/>

    </Router>

  );

}