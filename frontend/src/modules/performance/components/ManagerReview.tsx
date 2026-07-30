// src/modules/performance/components/ManagerReview.tsx

import React, { useState } from "react";

import { submitManagerReview } from "../services/performanceService";


interface ManagerReviewProps {

  goalId:number;

}



const ManagerReview:React.FC<ManagerReviewProps> = ({
  goalId
}) => {


  const [rating,setRating] =
    useState<number>(1);


  const [reviewText,setReviewText] =
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



      await submitManagerReview(

        goalId,

        {
          rating,
          review_text: reviewText
        }

      );



      setMessage(
        "Manager review submitted successfully"
      );



      setReviewText("");



    } catch(error) {


      console.error(error);


      setMessage(
        "Failed to submit manager review"
      );


    } finally {


      setLoading(false);


    }


  };







  return (

    <div className="manager-review">


      <h2>
        Manager Review
      </h2>




      {
        message && (

          <p>
            {message}
          </p>

        )
      }





      <form onSubmit={handleSubmit}>


        <div>

          <label>
            Rating (1 - 5)
          </label>


          <input

            type="number"

            min="1"

            max="5"

            step="0.1"

            value={rating}

            onChange={(e)=>
              setRating(
                Number(e.target.value)
              )
            }

            required

          />

        </div>





        <div>

          <label>
            Review Comments
          </label>


          <textarea

            value={reviewText}

            onChange={(e)=>
              setReviewText(
                e.target.value
              )
            }

            placeholder="Enter review comments"

          />

        </div>





        <button

          type="submit"

          disabled={loading}

        >

          {
            loading
            ?
            "Submitting..."
            :
            "Submit Review"
          }


        </button>



      </form>



    </div>

  );

};



export default ManagerReview;