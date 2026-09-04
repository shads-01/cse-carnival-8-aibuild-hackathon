import { apiClient } from './api';
import { Assignment, CreateAssignmentDto, UpdateAssignmentDto } from '@shared/types';
import seedAssignments from '../../../data/assignments.json';

const STORAGE_KEY = 'campus_assignments_cache';

const getStoredAssignments = (): Assignment[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  const formatted: Assignment[] = (seedAssignments as any[]).map((a) => ({
    id: a.id,
    course: a.course,
    course_title: a.course_title || a.course,
    title: a.title,
    description: a.description || '',
    assigned_date: a.assigned_date || '2026-09-01',
    deadline: a.deadline || a.due_date || '2026-09-15',
    submission_platform: a.submission_platform || a.submission_link || 'Google Classroom',
    status: (a.status === 'published' ? 'pending' : a.status || 'pending') as Assignment['status'],
    marks: Number(a.marks || a.total_points || 100)
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
  return formatted;
};

const saveAssignments = (data: Assignment[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const assignmentService = {
  getAll: async (): Promise<Assignment[]> => {
    try {
      const response = await apiClient.get('/assignments');
      const data = response.data?.data || response.data;
      if (Array.isArray(data) && data.length > 0) {
        saveAssignments(data);
        return data;
      }
    } catch (e) {
      // API fallback
    }
    return getStoredAssignments();
  },

  getById: async (id: string): Promise<Assignment> => {
    try {
      const response = await apiClient.get(`/assignments/${id}`);
      if (response.data?.data) return response.data.data;
    } catch (e) {
      // API fallback
    }
    const item = getStoredAssignments().find((a) => a.id === id);
    if (!item) throw new Error('Assignment not found');
    return item;
  },

  create: async (dto: CreateAssignmentDto): Promise<Assignment> => {
    let created: Assignment | null = null;
    try {
      const response = await apiClient.post('/assignments', dto);
      created = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    if (!created) {
      created = {
        id: dto.id || `asg-${Date.now()}`,
        course: dto.course,
        course_title: dto.course_title || dto.course,
        title: dto.title,
        description: dto.description || '',
        assigned_date: dto.assigned_date || new Date().toISOString().split('T')[0],
        deadline: dto.deadline,
        submission_platform: dto.submission_platform,
        status: dto.status || 'pending',
        marks: Number(dto.marks) || 100
      };
    }

    const current = getStoredAssignments();
    saveAssignments([created, ...current]);
    return created;
  },

  update: async (id: string, dto: UpdateAssignmentDto): Promise<Assignment> => {
    let updated: Assignment | null = null;
    try {
      const response = await apiClient.put(`/assignments/${id}`, dto);
      updated = response.data?.data || response.data;
    } catch (e) {
      // fallback
    }

    const current = getStoredAssignments();
    const index = current.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Assignment not found');

    if (!updated) {
      updated = {
        ...current[index],
        ...dto,
        marks: dto.marks !== undefined ? Number(dto.marks) : current[index].marks
      } as Assignment;
    }

    current[index] = updated;
    saveAssignments([...current]);
    return updated;
  },

  delete: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/assignments/${id}`);
    } catch (e) {
      // fallback
    }
    const current = getStoredAssignments().filter((a) => a.id !== id);
    saveAssignments(current);
  }
};
