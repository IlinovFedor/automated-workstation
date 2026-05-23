const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const url = API_URL ? `${API_URL}${path}` : `/api${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  subgroups: {
    list: (page = 0, pageSize = 20, search = '') => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      return fetchApi<import('@/types').ListSubgroups>(`/subgroups?${params}`);
    },
    get: (id: number) => fetchApi<import('@/types').Subgroup>(`/subgroups/${id}`),
  },
  
  teachers: {
    list: (page = 0, pageSize = 20, search = '') => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      return fetchApi<import('@/types').ListTeachers>(`/teachers?${params}`);
    },
    get: (id: number) => fetchApi<import('@/types').Teacher>(`/teachers/${id}`),
  },
  
  locations: {
    list: (page = 0, pageSize = 20, search = '') => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      return fetchApi<import('@/types').ListLocations>(`/locations?${params}`);
    },
    get: (id: number) => fetchApi<import('@/types').Location>(`/locations/${id}`),
  },
  
  subjects: {
    list: (page = 0, pageSize = 20, search = '') => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      return fetchApi<import('@/types').ListSubjects>(`/subjects?${params}`);
    },
    get: (id: number) => fetchApi<import('@/types').Subject>(`/subjects/${id}`),
  },
  
  timetables: {
    list: (page = 0, pageSize = 20, search = '') => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      });
      return fetchApi<import('@/types').ListTimetables>(`/timetables?${params}`);
    },
    get: (id: number) => fetchApi<import('@/types').Timetable>(`/timetables/${id}`),
  },
  
  lessons: {
    list: (table: import('@/types').TableType, id: number) => 
      fetchApi<import('@/types').Lesson[]>(`/lessons/${table}/${id}`),
    get: (id: string) => fetchApi<import('@/types').Lesson>(`/lessons/${id}`),
  },
};
