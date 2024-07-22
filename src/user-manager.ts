import type { AnonymousUser, User } from '@/types.ts'
import { faker } from '@faker-js/faker'
import { randomUUID } from 'node:crypto'

/**
 * Interface defining the methods for creating users.
 */
export interface UserFactory {
    /**
     * Creates a new user with a unique ID and a name generated using the faker library.
     * @returns {User} The newly created user object.
     */
    createUser(): User

    /**
     * Creates a new anonymous user with a unique ID.
     * @returns {AnonymousUser} The newly created anonymous user object.
     */
    createAnonymousUser(): AnonymousUser
}

/**
 * Class responsible for managing user creation.
 * Implements the UserFactory interface.
 */
export default class UserManager implements UserFactory {
    /**
     * Creates a new user with a unique ID and a name.
     * Uses the faker library to generate a first name, last name, and then a full name.
     * @returns {User} The newly created user object with an ID and name.
     */
    public createUser(): User {
        const firstName = faker.person.firstName()
        const lastName = faker.person.lastName()

        return {
            id: randomUUID(),
            name: faker.person.fullName({ firstName, lastName }),
        }
    }

    /**
     * Creates a new anonymous user with a unique ID.
     * Doesn't assign a name to the anonymous user.
     * @returns {AnonymousUser} The newly created anonymous user object with an ID.
     */
    public createAnonymousUser(): AnonymousUser {
        return {
            id: randomUUID(),
        }
    }
}
