import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { getUserId } from 'services/headers';
import { UserRepository, UserSettingsRepository } from './services';

// Service Layer: Business Logic
class UserService {
  private readonly userRepository: UserRepository;
  private readonly userSettingsRepository: UserSettingsRepository;

  constructor(userRepository: UserRepository, userSettingsRepository: UserSettingsRepository) {
    this.userRepository = userRepository;
    this.userSettingsRepository = userSettingsRepository;
  }

  async deleteUser(sub: string): Promise<void> {
    await this.userRepository.delete(sub);
    await this.userSettingsRepository.delete(sub);
  }
}

// Controller Layer
const userRepository = new UserRepository();
const userSettingsRepository = new UserSettingsRepository();
const userService = new UserService(userRepository, userSettingsRepository);

export const deleteMeUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await getUserId(req.headers);
    await userService.deleteUser(sub);
    res.status(204).send();
  } catch (err) {
    next(new ApiError('Error while deleting user', err as Error, 500));
  }
};
