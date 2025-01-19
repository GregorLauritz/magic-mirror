import { getRouter } from 'services/router_factory';
import { RequestHandler } from 'express';
import { deleteMeUserSettings, getMeUserSettings, patchMeUserSettings, postUserSettings } from './settings'; // Adjusted import path
import { deleteMeUser } from './users';

const router = getRouter();

router.get('/settings/me', getMeUserSettings as RequestHandler);
router.patch('/settings/me', patchMeUserSettings as RequestHandler);
router.post('/settings', postUserSettings as RequestHandler);
router.delete('/settings/me', deleteMeUserSettings as RequestHandler);
router.delete('/me', deleteMeUser as RequestHandler);

export default router;
