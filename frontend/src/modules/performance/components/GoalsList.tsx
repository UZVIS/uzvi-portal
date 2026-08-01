import React, { useEffect, useState } from "react";

import {
  getMyGoals,
  getGoalWithAssessments
} from "../services/performanceService";

import type {
  Goal,
  GoalWithAssessments
} from "../types";


const GoalsList: React.FC = () => {


  const [goals, setGoals] =
    useState<Goal[]>([]);


  const [selectedGoal, setSelectedGoal] =
    useState<GoalWithAssessments | null>(null);


  const [loading, setLoading] =
    useState(false);


  const [error, setError] =
    useState("");




  useEffect(() => {

    loadGoals();

  }, []);





  const loadGoals = async () => {


    try {

      setLoading(true);

      setError("");


      const data =
        await getMyGoals();


      setGoals(data);



    } catch(err) {


      console.error(err);


      setError(
        "Unable to load goals"
      );


    } finally {


      setLoading(false);


    }


  };







  const viewDetails = async(
    goalId:number
  ) => {


    try {


      const data =
        await getGoalWithAssessments(
          goalId
        );


      setSelectedGoal(data);



    } catch(err) {


      console.error(err);


    }


  };






  if(loading){

    return (
      <p>
        Loading goals...
      </p>
    );

  }






  return (

    <div className="goals-list">


      <h2>
        My Goals
      </h2>





      {
        error && (

          <p className="error">
            {error}
          </p>

        )
      }






      {
        goals.length === 0 ? (


          <p>
            No goals found
          </p>



        ) : (



          <table>


            <thead>

              <tr>

                <th>
                  Description
                </th>


                <th>
                  Target Outcome
                </th>


                <th>
                  Status
                </th>


                <th>
                  Action
                </th>


              </tr>


            </thead>





            <tbody>


              {
                goals.map((goal)=>(


                  <tr key={goal.id}>


                    <td>
                      {goal.description}
                    </td>



                    <td>
                      {goal.target_outcome || "-"}
                    </td>



                    <td>
                      {goal.status}
                    </td>





                    <td>


                      <button

                        onClick={() =>
                          viewDetails(goal.id)
                        }

                      >

                        View

                      </button>


                    </td>




                  </tr>


                ))

              }


            </tbody>



          </table>


        )

      }









      {
        selectedGoal && (


          <div className="goal-details">


            <h3>
              Goal Details
            </h3>




            <p>
              Description:
              {" "}
              {selectedGoal.description}
            </p>





            <p>
              Status:
              {" "}
              {selectedGoal.status}
            </p>






            <p>

              Self Assessment:
              {" "}

              {
                selectedGoal.self_assessment
                ?
                selectedGoal.self_assessment.assessment_text
                :
                "Not submitted"
              }

            </p>






            <p>

              Manager Review:
              {" "}

              {
                selectedGoal.manager_review
                ?
                selectedGoal.manager_review.review_text
                :
                "Not reviewed"
              }

            </p>



          </div>


        )

      }




    </div>

  );

};



export default GoalsList;