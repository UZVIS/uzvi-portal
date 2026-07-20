import { apiGet } from "../../../api/client";

import type { Employee } from "../types/employee";

export function getEmployees() {

    return apiGet<Employee[]>("/v1/employees/");

}