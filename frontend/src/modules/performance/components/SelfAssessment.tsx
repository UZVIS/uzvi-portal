// src/modules/performance/components/SelfAssessment.tsx

import React, { useState } from "react";

import { submitSelfAssessment } from "../services/performanceService";



interface SelfAssessmentProps {

  goalId:number;

}



const SelfAssessment:React.FC<SelfAssessmentProps> = ({
  goalId
}) => {


  const [assessmentText,setAssessmentText] =
    useState("");

  const [loading,setLoading] =
    useState(false);


  const [message,setMessage] =
    useState("");





  const handleSubmit = async(
    e:React.FormEvent
  ) => {


    e.preventDefault();


    try {


      setLoading(true);

      setMessage("");



      await submitSelfAssessment(
        goalId,
        {
          assessment_text: assessmentText
        }
      );



      setMessage(
        "Self assessment submitted successfully"
      );



      setAssessmentText("");



    } catch(error) {


      console.error(error);


      setMessage(
        "Failed to submit assessment"
      );



    } finally {


      setLoading(false);


    }


  };






  return (

    <div className="self-assessment">


      <h2>
        Self Assessment
      </h2>



      {
        message && (

          <p>
            {message}
          </p>

        )
      }




      <form onSubmit={handleSubmit}>


        <textarea

          value={assessmentText}

          onChange={(e)=>
            setAssessmentText(
              e.target.value
            )
          }

          placeholder="Enter your assessment"

          required

        />




        <button

          type="submit"

          disabled={loading}

        >

          {
            loading
            ?
            "Submitting..."
            :
            "Submit Assessment"
          }


        </button>



      </form>



    </div>

  );

};


export default SelfAssessment;