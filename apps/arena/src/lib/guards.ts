import { createGuards } from '@mi/auth';
import { auth } from '@/auth';

export const { getViewer, requireOwner } = createGuards(auth);
