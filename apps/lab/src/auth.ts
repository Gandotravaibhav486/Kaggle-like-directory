import { createAuth } from '@mi/auth';

export const { handlers, auth, signIn, signOut } = createAuth({ app: 'lab' });
