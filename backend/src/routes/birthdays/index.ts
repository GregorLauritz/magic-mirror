import { getRouter } from 'services/router_factory';
import { allBirthdays } from 'routes/birthdays/api';
import { birthdayMw } from 'routes/birthdays/middleware';

const router = getRouter();

router.get('/', birthdayMw, allBirthdays);

export default router;
