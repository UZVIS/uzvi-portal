// src/modules/attendance/components/TeamAttendance.tsx


import React, {
  useEffect,
  useState
} from "react";


import {
  useTeamAttendance
} from "../hooks/useAttendance";



interface TeamAttendanceProps {

  onEmployeeClick?: (
    employeeId:string
  ) => void;

}




const TeamAttendance: React.FC<
  TeamAttendanceProps
> = ({
  onEmployeeClick
}) => {



  const {
    teamRecords,
    loading,
    fetchTeamAttendance
  } = useTeamAttendance();



  const [selectedDate,setSelectedDate] =
    useState(
      new Date()
      .toISOString()
      .split("T")[0]
    );




  useEffect(()=>{


    fetchTeamAttendance(
      selectedDate
    );


  },[selectedDate]);





  const getStatusBadge = (
    status:string
  ) => {


    const badges:Record<
      string,
      string
    > = {


      "in-office":
        "badge-success",


      "wfh":
        "badge-info",


      "on-leave":
        "badge-warning",


      "absent":
        "badge-danger",


    };


    return badges[status] ||
      "badge-secondary";

  };





  const getStatusLabel = (
    status:string
  ) => {


    const labels:Record<
      string,
      string
    > = {


      "in-office":
        "In-Office",


      "wfh":
        "WFH",


      "on-leave":
        "On-Leave",


      "absent":
        "Absent",


    };


    return labels[status] ||
      status;

  };





  if(loading){

    return (

      <div className="loading-state">

        Loading team attendance...

      </div>

    );

  }

  return (

    <div className="team-attendance-container">


      <div className="team-attendance-header">


        <h3>
          Team Attendance
        </h3>

        <div className="date-picker">


          <label>
            Date:
          </label>


          <input

            type="date"

            value={selectedDate}

            onChange={(e)=>
              setSelectedDate(
                e.target.value
              )
            }

          />


        </div>


      </div>





      {
        teamRecords.length === 0 ? (

          <div className="empty-state">

            No team attendance records found

          </div>


        ) : (



          <table className="team-attendance-table">


            <thead>


              <tr>

                <th>
                  Employee
                </th>


                <th>
                  Designation
                </th>


                <th>
                  Department
                </th>


                <th>
                  Status
                </th>


                <th>
                  Check-in
                </th>


                <th>
                  Check-out
                </th>


              </tr>


            </thead>





            <tbody>


              {
                teamRecords.map(
                  (record)=>(


                    <tr

                      key={
                        record.employee_id
                      }


                      onClick={()=>
                        onEmployeeClick?.(
                          record.employee_id
                        )
                      }


                      className="clickable-row"

                    >



                      <td>

                        {record.employee_name}

                      </td>




                      <td>

                        {record.designation}

                      </td>




                      <td>

                        {record.department}

                      </td>





                      <td>


                        <span
                          className={
                            `badge ${
                              getStatusBadge(
                                record.status
                              )
                            }`
                          }
                        >

                          {
                            getStatusLabel(
                              record.status
                            )
                          }


                        </span>


                      </td>





                      <td>

                        {
                          record.check_in ||
                          "-"
                        }

                      </td>





                      <td>

                        {
                          record.check_out ||
                          "-"
                        }

                      </td>



                    </tr>


                  )
                )
              }


            </tbody>



          </table>


        )
      }



    </div>


  );


};



export default TeamAttendance;