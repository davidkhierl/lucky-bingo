import type { User } from '@/types'
import { faker, type SexType } from '@faker-js/faker'
import { Effect } from 'effect'
import { randomUUID } from 'node:crypto'

const createUserNames = (sex?: SexType) =>
    Effect.sync(() => ({
        firstName: faker.person.firstName(sex),
        lastName: faker.person.lastName(sex),
    }))

const createUserFullName = Effect.map(createUserNames('male'), ({ firstName, lastName }) =>
    faker.person.fullName({ firstName, lastName })
)

const createUserEffect: Effect.Effect<User, never, never> = Effect.gen(function* () {
    const name = yield* createUserFullName

    return {
        id: randomUUID(),
        name,
    }
})

export const createUser = () => Effect.runSync(createUserEffect)
