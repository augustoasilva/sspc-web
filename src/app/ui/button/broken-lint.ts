// CI break 1 (lint): a ui component imports the router, which the boundary rules forbid.
import { Router } from '@angular/router';

export const brokenLint = (router: Router): Router => router;
