// Heterosexual: Attraction to individuals of the opposite gender
// Homosexual: Attraction to individuals of the same gender
// Bisexual: Attraction to individuals of both genders
// Pansexual: Attraction to individuals of any gender
// Asexual: Lack of sexual attraction to any gender
// Queer: An umbrella term encompassing non-heterosexual identities

export interface ProfileData {
    preferredName?: string;
    gender?: string;
    sexualOrientation?: string;
    hobbies: string[];
    description?: string;
    photos: string[];
}

export const allSexualOrientations = () => {
    return {
        heterosexual: "Heterosexual",
        homosexual: "Homosexual",
        bisexual: "Bisexual",
        pansexual: "Pansexual",
        asexual: "Asexual",
        queer: "Queer"
    };
};


export const PROFILE_STEPS = {
    BASIC_INFO: 'onboarding',  // Name, gender, orientation, year
    ABOUT_ME: 'aboutme',       // Hobbies and bio
    PHOTOS: 'images',          // Profile pictures
    COMPLETE: 'mainprofile'    // Complete profile
};

export const PROFILE_STEPS2 = {
    ON_BOARDING: 'onboarding',  // Name, gender, orientation, year
    ABOUT_ME: 'aboutme',       // Hobbies and bio
    IMAGES: 'images',          // Profile pictures
};

export const PROFILE_STEP_VALUES = Object.values(PROFILE_STEPS2); // ['onboarding', 'aboutme', 'images', 'mainprofile']



export const allGenders = () => {
    return {
        male: "Male",
        female: "Female",
        gay: "Gay",
        lesbian: "Lesbian",
        transman: "Trans Man",
        transwoman: "Trans Woman"
    };
};

interface Hobbies {
    [key: string]: string;
}
export const allHobbies=(): Hobbies=>{
    return{
        travel:"Travel",
        cooking:"Cooking",
        gaming: "Gaming",
        movies: "Movies",
        photography: "Photography",
        technology: "Technology",
        art: "Art",
        yoga: "Yoga",
        music: "Music",
        fitness: "Fitness",
        fashion: "Fashion",
        hiking: "Hiking",
        pets: "Pets",
        reading: "Reading",
        dancing: "Dancing",
    };
};
export const allYearsBorn = () => {
    const currentYear: number = new Date().getFullYear();
    const startYear = currentYear - 50;
    const years: number[] = [];
    for (let i = startYear; i <= currentYear; i++) {
        years.push(i);
    };
    return years;
};


