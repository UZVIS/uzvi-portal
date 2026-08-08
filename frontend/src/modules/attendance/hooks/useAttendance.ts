// src/modules/attendance/hooks/useAttendance.ts

import { useEffect, useState } from "react";

import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getEmployeeAttendance,
  getAttendanceSummary,
  getTeamAttendance,
  getUnexplainedAbsences,
} from "../api";

import type {
  Attendance,
  AttendanceFormData,
  AttendanceSummary,
  AttendanceFilter,
  TeamAttendance,
  UnexplainedAbsence,
} from "../types";


// ==============================
// Main Attendance Hook
// ==============================

export const useAttendance = () => {

  const [records, setRecords] = useState<Attendance[]>([]);

  const [summary, setSummary] =
    useState<AttendanceSummary | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);



  // Get All Attendance

  const fetchAttendance = async (
    filter?: AttendanceFilter
  ) => {

    try {

      setLoading(true);
      setError(null);

      const data =
        await getAttendance(filter);

      setRecords(data);

    } catch {

      setError(
        "Failed to fetch attendance"
      );

    } finally {

      setLoading(false);

    }

  };



  // Employee Attendance

  const fetchMyAttendance = async (
    employeeId: string
  ) => {

    try {

      setLoading(true);

      const data =
        await getEmployeeAttendance(
          employeeId
        );

      setRecords(data);


    } catch {

      setError(
        "Failed to fetch employee attendance"
      );


    } finally {

      setLoading(false);

    }

  };




  // Summary

  const fetchSummary = async (
    employeeId: string,
    year:number,
    month:number
  ) => {

    try {

      const data =
        await getAttendanceSummary(
          employeeId,
          year,
          month
        );

      setSummary(data);


    } catch {

      setError(
        "Failed to fetch summary"
      );

    }

  };




  // Create Attendance

  const markAttendance = async (
    data: AttendanceFormData
  ) => {


    try {

      setLoading(true);


      const response =
        await createAttendance(data);


      setRecords(
        (prev)=>[
          ...prev,
          response
        ]
      );


      return response;


    } finally {

      setLoading(false);

    }

  };




  // Update

  const editAttendance = async (
    id:number,
    data:AttendanceFormData
  )=>{


    try {

      setLoading(true);


      const updated =
        await updateAttendance(
          id,
          data
        );


      setRecords(
        prev =>
          prev.map(
            item =>
              item.id === id
              ? updated
              : item
          )
      );


      return updated;


    } finally {

      setLoading(false);

    }

  };





  // Delete

  const removeAttendance = async(
    id:number
  )=>{


    try{

      setLoading(true);


      await deleteAttendance(id);


      setRecords(
        prev =>
          prev.filter(
            item =>
              item.id !== id
          )
      );


    }finally{

      setLoading(false);

    }

  };




  useEffect(()=>{

    fetchAttendance();

  },[]);



  return {

    records,
    summary,
    loading,
    error,

    fetchAttendance,
    fetchMyAttendance,
    fetchSummary,

    markAttendance,
    editAttendance,
    removeAttendance

  };

};




// =================================================
// Team Attendance Hook
// =================================================


export const useTeamAttendance = () => {


  const [teamRecords,setTeamRecords] =
    useState<TeamAttendance[]>([]);


  const [unexplainedAbsences,setUnexplainedAbsences] =
    useState<UnexplainedAbsence[]>([]);


  const [loading,setLoading] =
    useState(false);



  // Team Attendance

  const fetchTeamAttendance = async(
    teamId:string
  )=>{


    try{

      setLoading(true);


      const data =
        await getTeamAttendance(teamId);


      setTeamRecords(data);


    }finally{

      setLoading(false);

    }

  };




  // Unexplained Absences


  const fetchUnexplainedAbsences = async()=>{


    try{

      setLoading(true);


      const data =
        await getUnexplainedAbsences();


      setUnexplainedAbsences(data);


    }finally{

      setLoading(false);

    }

  };




  return {

    teamRecords,

    unexplainedAbsences,

    loading,

    fetchTeamAttendance,

    fetchUnexplainedAbsences

  };


};