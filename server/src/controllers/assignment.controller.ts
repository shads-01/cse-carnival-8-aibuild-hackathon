import { Request, Response } from 'express';
import { assignmentService } from '../services/assignmentService';
import { sendResponse, ApiError } from '../utils/apiResponse';
import { HttpStatus } from '@shared/types';

export class AssignmentController {
  list = async (req: Request, res: Response): Promise<void> => {
    const filter = {
      course: req.query.course as string | undefined,
      status: req.query.status as string | undefined
    };
    const assignments = await assignmentService.list(filter);
    sendResponse(res, HttpStatus.OK, 'Assignments retrieved successfully', assignments);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Assignment ID is required');

    const assignment = await assignmentService.getById(id);
    if (!assignment) throw ApiError.notFound(`Assignment with ID "${id}" not found`);

    sendResponse(res, HttpStatus.OK, 'Assignment retrieved successfully', assignment);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const created = await assignmentService.create(req.body);
    sendResponse(res, HttpStatus.CREATED, 'Assignment created successfully', created);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Assignment ID is required');

    const updated = await assignmentService.update(id, req.body);
    sendResponse(res, HttpStatus.OK, 'Assignment updated successfully', updated);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    if (!id) throw ApiError.badRequest('Assignment ID is required');

    await assignmentService.delete(id);
    sendResponse(res, HttpStatus.OK, 'Assignment deleted successfully');
  };
}

export const assignmentController = new AssignmentController();
