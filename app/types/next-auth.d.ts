import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: Role;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role;
  }
} 