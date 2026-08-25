// src/modules/performance/components/ReviewCycles.tsx

import React, {
  useEffect,
  useState,
} from "react";

import {
  getCycles,
} from "../services/performanceService";

import type {
  ReviewCycle,
} from "../types";

const ReviewCycles: React.FC = () => {

  const [cycles, setCycles] =
    useState<ReviewCycle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {

    loadCycles();

  }, []);

  const loadCycles = async () => {

    try {

      setLoading(true);

      setError("");

      const data =
        await getCycles();

      setCycles(data);

    } catch (err) {

      console.error(err);

      setError(
        "Unable to load review cycles."
      );

    } finally {

      setLoading(false);

    }

  };

  if (loading) {

    return (

      <div className="flex justify-center items-center h-60">

        <h2 className="text-lg font-semibold text-gray-600">

          Loading Review Cycles...

        </h2>

      </div>

    );

  }

  if (error) {

    return (

      <div className="bg-red-50 border border-red-200 rounded-xl p-6">

        <h2 className="text-red-600 font-semibold">

          {error}

        </h2>

      </div>

    );

  }

  return (

    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

      <div className="mb-8">

        <h2 className="text-3xl font-bold text-gray-800">

          Review Cycles

        </h2>

        <p className="text-gray-500 mt-2">

          View all review cycles.

        </p>

      </div>

            {

        cycles.length === 0 ? (

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-10 text-center">

            <h3 className="text-xl font-semibold text-gray-700">

              No Review Cycles Found

            </h3>

            <p className="mt-2 text-gray-500">

              Create a review cycle to get started.

            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">

              <thead className="bg-orange-500 text-white">

                <tr>

                  <th className="px-5 py-3 text-left">
                    ID
                  </th>

                  <th className="px-5 py-3 text-left">
                    Review Cycle
                  </th>

                  <th className="px-5 py-3 text-left">
                    Start Date
                  </th>

                  <th className="px-5 py-3 text-left">
                    End Date
                  </th>

                  <th className="px-5 py-3 text-left">
                    Created At
                  </th>

                </tr>

              </thead>

              <tbody>

                {

                  cycles.map((cycle) => (

                    <tr
                      key={cycle.id}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">

                        {cycle.id}

                      </td>

                      <td className="px-5 py-4 font-medium">

                        {cycle.name}

                      </td>

                      <td className="px-5 py-4">

                        {

                          new Date(
                            cycle.period_start
                          ).toLocaleString()

                        }

                      </td>

                      <td className="px-5 py-4">

                        {

                          new Date(
                            cycle.period_end
                          ).toLocaleString()

                        }

                      </td>

                      <td className="px-5 py-4">

                        {

                          new Date(
                            cycle.created_at
                          ).toLocaleString()

                        }

                      </td>

                    </tr>

                  ))

                }

              </tbody>

            </table>

          </div>

        )

      }

          </div>

  );

};

export default ReviewCycles;