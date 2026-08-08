// src/modules/performance/components/CreateGoal.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createGoal } from "../services/performanceService";

import type { CreateGoalData } from "../types";


const CreateGoal: React.FC = () => {

  const navigate = useNavigate();


  const [formData, setFormData] = useState<CreateGoalData>({
    description: "",
    target_outcome: "",
    cycle_id: 0,
  });


  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {

    const { name, value } = e.target;


    setFormData((prev) => ({

      ...prev,

      [name]:
        name === "cycle_id"
          ? Number(value)
          : value,

    }));

  };




  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();


    console.log("Submit clicked");


    try {

      setLoading(true);

      setError("");


      console.log(
        "Sending goal data:",
        formData
      );


      const response = await createGoal(formData);


      console.log(
        "Goal created successfully:",
        response
      );


      navigate("/performance");


    } catch (err: any) {


      console.error(
        "Create goal error:",
        err.response?.data || err
      );


      setError(
        err.response?.data?.detail ||
        "Unable to create goal"
      );


    } finally {


      setLoading(false);


    }

  };




  return (

    <div className="create-goal-page">


      <h1>
        Create Goal
      </h1>



      {
        error && (

          <p className="error">
            {error}
          </p>

        )
      }





      <form onSubmit={handleSubmit}>


        <div>

          <label>
            Goal Description
          </label>


          <textarea

            name="description"

            value={formData.description}

            onChange={handleChange}

            placeholder="Enter goal description"

            required

          />

        </div>





        <div>

          <label>
            Target Outcome
          </label>


          <textarea

            name="target_outcome"

            value={formData.target_outcome}

            onChange={handleChange}

            placeholder="Enter target outcome"

          />

        </div>





        <div>

          <label>
            Review Cycle ID
          </label>


          <input

            type="number"

            name="cycle_id"

            value={formData.cycle_id}

            onChange={handleChange}

            required

          />

        </div>





        <button

          type="submit"

          disabled={loading}

        >

          {
            loading
              ? "Creating..."
              : "Create Goal"
          }


        </button>



      </form>


    </div>

  );

};


export default CreateGoal;