import { getRouter } from 'services/router_factory';
import { RequestHandler } from 'express';
import { deleteMeUserSettings, getMeUserSettings, patchMeUserSettings, putMeUserSettings } from './settings';
import { deleteMeUser } from './users';

const router = getRouter();

router.get('/settings/me', getMeUserSettings as RequestHandler);
router.put('/settings/me', putMeUserSettings as RequestHandler);
router.patch('/settings/me', patchMeUserSettings as RequestHandler);
router.delete('/settings/me', deleteMeUserSettings as RequestHandler);
router.delete('/me', deleteMeUser as RequestHandler);

export default router;
