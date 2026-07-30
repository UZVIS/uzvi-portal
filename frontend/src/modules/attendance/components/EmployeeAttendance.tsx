import React, { useEffect, useState } from "react";

import {
  getEmployeeAttendance,
} from "../api";

import type {
  Attendance,
} from "../types";

import AttendanceTable from "./AttendanceTable";


interface EmployeeAttendanceProps {
  employeeId: string;
}


const EmployeeAttendance: React.FC<EmployeeAttendanceProps> = ({
  employeeId,
}) => {


  const [records, setRecords] =
    useState<Attendance[]>([]);


  const [loading, setLoading] =
    useState(false);



  const fetchAttendance = async () => {

    try {

      setLoading(true);

      const data =
        await getEmployeeAttendance(
          employeeId
        );

      setRecords(data);


    } catch (error) {

      console.error(
        "Failed to fetch employee attendance",
        error
      );


    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    if(employeeId){

      fetchAttendance();

    }

  }, [employeeId]);



  return (

    <div>

      <h2>
        Employee Attendance
      </h2>


      {
        loading ? (

          <p>
            Loading attendance...
          </p>

        ) : (

          <AttendanceTable
            records={records}
          />

        )
      }


    </div>

  );

};


export default EmployeeAttendance;