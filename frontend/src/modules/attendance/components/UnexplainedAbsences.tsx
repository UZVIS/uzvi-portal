// src/modules/attendance/components/UnexplainedAbsences.tsx


import React, {
  useEffect,
  useState
} from "react";


import {
  useTeamAttendance
} from "../hooks/useAttendance";


import type {
  UnexplainedAbsence
} from "../types";





interface UnexplainedAbsencesProps {

  onFollowUp?: (
    employee: UnexplainedAbsence
  ) => void;

}






const UnexplainedAbsences: React.FC<UnexplainedAbsencesProps> = (props) => {

const onFollowUp = props.onFollowUp;



  const {
    unexplainedAbsences,
    loading,
    fetchUnexplainedAbsences
  } = useTeamAttendance();




  const [selectedEmployee,setSelectedEmployee] =
    useState<UnexplainedAbsence | null>(null);



  const [showModal,setShowModal] =
    useState(false);



  const [followUpNote,setFollowUpNote] =
    useState("");



  const [showToast,setShowToast] =
    useState(false);



  const [toastMessage,setToastMessage] =
    useState("");



  const [toastType,setToastType] =
    useState<
      "success" | "error"
    >("success");






  useEffect(()=>{


    fetchUnexplainedAbsences();


  },[]);






  const getDaysCount = (
    startDate:string,
    endDate:string
  ) => {


    const start =
      new Date(startDate);


    const end =
      new Date(endDate);



    return Math.ceil(
      (
        end.getTime() -
        start.getTime()
      )
      /
      (
        1000 *
        60 *
        60 *
        24
      )
    ) + 1;

  };






  const getBadgeClass = (
    days:number
  ) => {


    if(days >= 5)
      return "badge-critical";


    if(days >= 3)
      return "badge-warning";


    return "badge-info";

  };






  const getBadgeText = (
    days:number
  ) => {


    if(days >= 5)
      return `⚠️ Critical (${days} days)`;


    if(days >= 3)
      return `⚡ Warning (${days} days)`;


    return `📌 ${days} day${days > 1 ? "s" : ""}`;

  };






  const handleFollowUpClick = (
    employee:UnexplainedAbsence
  ) => {


    setSelectedEmployee(employee);


    setShowModal(true);



    onFollowUp?.(
      employee
    );


  };






  const handleSendFollowUp = async()=>{


    if(!followUpNote.trim()){


      setToastMessage(
        "Please enter follow-up message"
      );


      setToastType(
        "error"
      );


      setShowToast(true);


      return;

    }





    try{


      setToastMessage(
        `Follow-up sent to ${
          selectedEmployee?.employee_name
        }`
      );


      setToastType(
        "success"
      );


      setShowToast(true);



      setShowModal(false);


      setFollowUpNote("");


      setSelectedEmployee(null);



      await fetchUnexplainedAbsences();



    }
    catch(error){


      setToastMessage(
        "Failed to send follow-up"
      );


      setToastType(
        "error"
      );


      setShowToast(true);

    }


  };







  if(loading){


    return (

      <div className="loading-state">

        Loading unexplained absences...

      </div>

    );


  }






  return (

    <div className="unexplained-absences-container">


      <h3>
        Unexplained Absences
      </h3>





      {
        unexplainedAbsences.length === 0 ? (


          <div className="empty-state">

            ✅ No unexplained absences found

          </div>



        ) : (



          unexplainedAbsences.map(
            (absence)=>(


              <div
                key={
                  absence.employee_id
                }
                className="absence-item"
              >



                <div>


                  <h4>

                    {
                      absence.employee_name
                    }

                  </h4>



                  <p>

                    {
                      absence.department
                    }

                  </p>




                  <p>

                    {
                      absence.start_date
                    }
                    {" - "}
                    {
                      absence.end_date
                    }

                  </p>





                  <span
                    className={
                      `badge ${
                        getBadgeClass(
                          getDaysCount(
                            absence.start_date,
                            absence.end_date
                          )
                        )
                      }`
                    }
                  >

                    {
                      getBadgeText(
                        getDaysCount(
                          absence.start_date,
                          absence.end_date
                        )
                      )
                    }

                  </span>



                </div>





                <button

                  onClick={()=>
                    handleFollowUpClick(
                      absence
                    )
                  }

                >

                  📧 Follow Up

                </button>



              </div>


            )

          )


        )
      }







      {
        showModal &&
        selectedEmployee && (


          <div className="modal-overlay">


            <div className="modal-content">


              <h3>
                Send Follow-up
              </h3>



              <p>
                {
                  selectedEmployee.employee_name
                }
              </p>



              <textarea

                value={
                  followUpNote
                }

                onChange={(e)=>
                  setFollowUpNote(
                    e.target.value
                  )
                }

                placeholder="Enter message"

              />




              <button

                onClick={
                  handleSendFollowUp
                }

              >

                Send

              </button>



              <button

                onClick={()=>
                  setShowModal(false)
                }

              >

                Cancel

              </button>



            </div>


          </div>


        )
      }






      {
        showToast && (

          <div className={`toast ${toastType}`}>

            {toastMessage}

          </div>

        )
      }





    </div>


  );

};



export default UnexplainedAbsences;