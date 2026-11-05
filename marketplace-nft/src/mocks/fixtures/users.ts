import type { StoredUser } from '../db'

export const userFixtures: StoredUser[] = [
  {
    id: 'user-ana',
    username: 'ana',
    displayName: 'Ana Souza',
    email: 'ana@kurio.test',
    salt: 'salt-ana',
    passwordHash: 'a590e189db3f4c943ca84883ffcb9c3f2aea373b9d85d25f1d5a0fa61f66e601',
  },
  {
    id: 'user-bruno',
    username: 'bruno',
    displayName: 'Bruno Lima',
    email: 'bruno@kurio.test',
    salt: 'salt-bruno',
    passwordHash: 'b850b7f181859ea11c055a9c53c17ecdaad1a6781c4cd8c95b0dd62e55d8fcf2',
  },
]