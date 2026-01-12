import { NextFunction, Request, Response } from 'express';
import { tasks_v1 } from 'googleapis';
import { ApiError } from 'models/api/api_error';
import { Task, TaskList } from 'models/api/tasks';
import { getGoogleTasks } from 'services/google';
import { getRouter } from 'services/router_factory';
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';
import { EParamType } from 'services/validators/parameter_validator';

// Validators
const taskCountValidator = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, false);

// Task Service
class TaskService {
  static async getTasks(
    req: Request,
    maxResults: number,
    showCompleted: boolean,
    taskListId: string,
  ): Promise<tasks_v1.Schema$Tasks> {
    const tasksClient = getGoogleTasks(req);
    const tasks = await tasksClient.tasks.list({
      tasklist: taskListId,
      maxResults,
      showCompleted,
      showHidden: false,
    });
    return tasks.data;
  }

  static parseTasks(tasks: tasks_v1.Schema$Tasks): TaskList {
    const items = tasks.items || [];
    const parsedTasks = items.map(this.parseTask).filter((task: Task | null): task is Task => task !== null);
    return { count: parsedTasks.length, list: parsedTasks };
  }

  static parseTask(task: tasks_v1.Schema$Task): Task | null {
    if (!task.id || !task.title) {
      return null;
    }
    return {
      id: task.id,
      title: task.title,
      notes: task.notes || undefined,
      status: task.status || 'needsAction',
      due: task.due || undefined,
      completed: task.completed || undefined,
    };
  }
}

// Route Handlers
async function allTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const maxResults = parseInt((req.query.count as string) || '20');
    const showCompleted = (req.query.showCompleted as string) === 'true';
    const taskListId = (req.query.tasklist_id as string) || '@default';

    const tasks = await TaskService.getTasks(req, maxResults, showCompleted, taskListId);
    const parsedTasks = TaskService.parseTasks(tasks);

    res.status(200).json(parsedTasks);
  } catch (err) {
    next(new ApiError('Error retrieving tasks', err as Error, 500));
  }
}

const router = getRouter();

router.get('/', [taskCountValidator.validate], allTasks);

export default router;
