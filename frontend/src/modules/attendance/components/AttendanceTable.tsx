import React from "react";


interface AttendanceRecord {

  id?: number;

  employeeId?: string;

  employee_id?: string;

  date?: string;

  attendance_date?: string;

  status: string;

  checkIn?: string;

  checkOut?: string;

  check_in?: string;

  check_out?: string;

  notes?: string;

}



interface AttendanceTableProps {

  records: AttendanceRecord[];

  loading?: boolean;

}



const AttendanceTable: React.FC<
AttendanceTableProps
> = ({ records }) => {

  return (

    <div className="attendance-table">


      <h3>
        Attendance Records
      </h3>



      {
        records.length === 0 ? (

          <p>
            No attendance records found
          </p>


        ) : (


          <table border={1}>


            <thead>

              <tr>

                <th>
                  Employee ID
                </th>


                <th>
                  Date
                </th>


                <th>
                  Status
                </th>


                <th>
                  Check In
                </th>


                <th>
                  Check Out
                </th>


                <th>
                  Notes
                </th>


              </tr>


            </thead>




            <tbody>


              {
                records.map(
                  (record, index) => (

                    <tr key={record.id ?? index}>


                      <td>
                        {
                          record.employee_id ??
                          record.employeeId
                        }
                      </td>



                      <td>
                        {
                          record.attendance_date ??
                          record.date
                        }
                      </td>




                      <td>
                        {record.status}
                      </td>




                      <td>
                        {
                          record.check_in ??
                          record.checkIn ??
                          "-"
                        }
                      </td>




                      <td>
                        {
                          record.check_out ??
                          record.checkOut ??
                          "-"
                        }
                      </td>




                      <td>
                        {
                          record.notes ??
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



export default AttendanceTable;