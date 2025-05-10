"use client"

import { z } from "zod"


// Enum validation for Gender
const GenderEnum = z.enum([
    "male",
    "female",
    "gay",
    "lesbian",
    "transman",
    "transwoman",
]);

// Enum validation for Sexual Orientation
const SexualOrientationEnum = z.enum([
    "heterosexual",
    "homosexual",
    "bisexual",
    "pansexual",
    "asexual",
    "queer",
]);

export const profileSchemaOnboardingStage = z.object({
    preferredName: z.string(),
    major: z.string(),
    gender: GenderEnum,
    genderPreference: GenderEnum,
    sexualOrientation: SexualOrientationEnum.optional().nullable(),
    dateOfBirth: z.union([
        z.string().transform((val) => new Date(val)),
        z.date()
    ]).optional().nullable(),
    hobbies: z.array(z.string()).default([]),
    photos: z.array(z.string()).default([]),
})

export const profileSchemaAboutMe = z.object({
    preferredName: z.string(),
    major: z.string(),
    gender: GenderEnum,
    genderPreference: GenderEnum,
    hobbies: z.array(z.string()),
    description: z.string(),
})


// Profile schema validation - this is the main one used in the API
export const profileSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    preferredName: z.string().optional().nullable(),
    major: z.string().optional().nullable(),
    gender: GenderEnum.optional().nullable(),
    genderPreference: GenderEnum.optional().nullable(),
    hobbies: z.array(z.string()).optional().default([]),
    description: z.string().optional().nullable(),
    sexualOrientation: SexualOrientationEnum.optional().nullable(),
    dateOfBirth: z.union([   // auto transform to a Date object from request
        z.string().transform((val) => new Date(val)),
        z.date()
    ]).optional().nullable(),
    photos: z.array(z.string()).optional().default([]),
});

// Define the Zod schema for the file structure
export const formidableFileSchema = z.object({
    originalFilename: z.string(),
    filepath: z.string(),
    mimetype: z.string(),
    size: z.number(),
    // Add any other properties you expect the file to have
});

export const swipeSchema = z.object({
    swiperId: z.string().uuid(),
    swipedId: z.string().uuid(),
    swipeRight: z.boolean(),
})

export const profileMatchPageDataSchema = z.object({
    avatar: z.string().url().optional(),
    userId: z.string().uuid().optional(),
    preferredName: z.string().optional().nullable(),
    major: z.string().optional().nullable(),
    gender: GenderEnum.optional().nullable(),
    hobbies: z.array(z.string()).optional().default([]),
    description: z.string().optional().nullable(),
    sexualOrientation: SexualOrientationEnum.optional().nullable(),
    dateOfBirth: z.union([   // auto transform to a Date object from request
        z.string().transform((val) => new Date(val)),
        z.date()
    ]).optional().nullable(),
    photos: z.array(z.string()).optional().default([]),
})