import React from "react";


interface AttendanceStats {

  totalPresent: number;

  totalAbsent: number;

  totalLeave: number;

  totalEmployees: number;

}



const AttendanceSummary: React.FC<{
  stats: AttendanceStats
}> = ({ stats }) => {



  const percentage = (value: number) => {

    if (stats.totalEmployees === 0) {

      return "0";

    }


    return (
      ((value / stats.totalEmployees) * 100)
        .toFixed(1)
    );

  };




  return (

    <div className="attendance-summary">


      <h3>
        Attendance Summary
      </h3>



      <div className="stats-grid">



        <div className="stat-card">

          <span>
            Present
          </span>


          <span>
            {stats.totalPresent}
          </span>


          <span>
            {percentage(stats.totalPresent)}%
          </span>


        </div>





        <div className="stat-card">

          <span>
            Absent
          </span>


          <span>
            {stats.totalAbsent}
          </span>


          <span>
            {percentage(stats.totalAbsent)}%
          </span>


        </div>





        <div className="stat-card">

          <span>
            Leave
          </span>


          <span>
            {stats.totalLeave}
          </span>


          <span>
            {percentage(stats.totalLeave)}%
          </span>


        </div>



      </div>


    </div>

  );

};


export default AttendanceSummary;