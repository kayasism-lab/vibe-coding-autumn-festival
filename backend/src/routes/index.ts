import { Router } from 'express'
import { applicationsRouter } from './applications.js'
import { authRouter } from './auth.js'
import { citizenApplicationsRouter } from './citizen-applications.js'
import { communityRouter } from './community.js'
import { galleryRouter } from './gallery.js'
import { inquiriesRouter } from './inquiries.js'
import { noticesRouter } from './notices.js'
import { programsRouter } from './programs.js'
import { rehearsalAccountsRouter } from './rehearsal-accounts.js'
import { rehearsalLogsRouter } from './rehearsal-logs.js'
import { rehearsalTeamsRouter } from './rehearsal-teams.js'
import { schedulesRouter } from './schedules.js'
import { siteConfigRouter } from './site-config.js'
import { sponsorsRouter } from './sponsors.js'
import { theaterGroupsRouter } from './theater-groups.js'
import { usersRouter } from './users.js'
import { venuesRouter } from './venues.js'

export const apiRouter = Router()

apiRouter.use('/applications', applicationsRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/citizen-applications', citizenApplicationsRouter)
apiRouter.use('/community', communityRouter)
apiRouter.use('/gallery', galleryRouter)
apiRouter.use('/inquiries', inquiriesRouter)
apiRouter.use('/notices', noticesRouter)
apiRouter.use('/programs', programsRouter)
// 열린 단막극 연습일지 (팀 구성 / 일지)
apiRouter.use('/rehearsal-teams', rehearsalTeamsRouter)
apiRouter.use('/rehearsal-logs', rehearsalLogsRouter)
apiRouter.use('/rehearsal-accounts', rehearsalAccountsRouter)
apiRouter.use('/schedules', schedulesRouter)
apiRouter.use('/site-config', siteConfigRouter)
apiRouter.use('/sponsors', sponsorsRouter)
apiRouter.use('/theater-groups', theaterGroupsRouter)
apiRouter.use('/users', usersRouter)
apiRouter.use('/venues', venuesRouter)
