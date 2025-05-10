import { PrismaClient, Gender, SexualOrientation } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const GENDERS: Gender[] = [
    'male',
    'female',
    'gay',
    'lesbian',
    'transman',
    'transwoman',
];

const SEXUAL_ORIENTATIONS: SexualOrientation[] = [
    'heterosexual',
    'homosexual',
    'bisexual',
    'pansexual',
    'asexual',
    'queer',
];

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
    console.log('Seeding...');

    const users = [];

    // 1. Create 20 users with profiles
    for (let i = 0; i < 20; i++) {
        const gender = getRandom(GENDERS);
        const sexualOrientation = getRandom(SEXUAL_ORIENTATIONS);

        const user = await prisma.user.create({
            data: {
                name: faker.person.fullName(),
                email: faker.internet.email({provider: '@sjsu.edu'}),
                phone: faker.phone.number(),
                avatar: faker.image.avatar(),
                profile: {
                    create: {
                        preferredName: faker.person.firstName(),
                        gender,
                        genderPreference: getRandom(GENDERS),
                        major: faker.helpers.arrayElement(['CS', 'Math', 'Biology', 'Psychology']),
                        hobbies: faker.helpers.arrayElements(
                            ['Reading', 'Gaming', 'Hiking', 'Coding', 'Cooking'],
                            { min: 1, max: 3 }
                        ),
                        description: faker.lorem.sentences(2),
                        dateOfBirth: faker.date.birthdate({ min: 18, max: 30, mode: 'age' }),
                        sexualOrientation,
                        photos: [
                            faker.image.urlLoremFlickr({ category: 'people' }),
                            faker.image.urlLoremFlickr({ category: 'people' }),
                        ],
                    },
                },
            },
        });

        users.push(user);
    }

    // 2. Create some matches (avoid duplicates or self matches)
    const matchedUserPairs = new Set<string>();

    for (let i = 0; i < 5; i++) {
        const first = getRandom(users);
        let second = getRandom(users);

        while (first.id === second.id || matchedUserPairs.has(`${first.id}:${second.id}`) || matchedUserPairs.has(`${second.id}:${first.id}`)) {
            second = getRandom(users);
        }

        matchedUserPairs.add(`${first.id}:${second.id}`);

        await prisma.match.create({
            data: {
                firstUserId: first.id,
                secondUserId: second.id,
                messages: {
                    create: [
                        {
                            content: faker.lorem.sentence(),
                            type: 'Text',
                            userId: first.id,
                        },
                        {
                            content: faker.lorem.sentence(),
                            type: 'Text',
                            userId: second.id,
                        },
                    ],
                },
            },
        });
    }

    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
