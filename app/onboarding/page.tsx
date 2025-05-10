"use client"
import React, {useEffect, useState} from "react";
import {useSession} from "next-auth/react";
import {LargeInput} from "@components/ui/input";
import {Button1} from "@components/ui/button";
import {allGenders, allSexualOrientations} from "@lib/data";
import {useRouter} from "next/navigation";
import {toast} from "@/components/ui/use-toast";
import {SectionHeading} from "@/components/ui/heading";
import Image from "next/image";

export default function Onboarding(){
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        preferredName: "",
        major: "",
        gender: "",
        dayBorn: "",
        monthBorn: "",
        hobbies: [],
        photos: [],
        yearBorn: "",
        sexualOrientation: "",
        genderPreference: ""
    });

    // Error states
    const [errors, setErrors] = useState({
        preferredName: false,
        major: false,
        gender: false,
        birthday: false,
        genderPreference: false
    });

    // Fetch existing profile data when component mounts
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const response = await fetch(`/api/profiles/`);

                if (response.ok) {
                    const profileData = await response.json();

                    // Extract day, month, year from dateOfBirth if it exists
                    let dayBorn = "";
                    let monthBorn = "";
                    let yearBorn = "";

                    if (profileData.dateOfBirth) {
                        const date = new Date(profileData.dateOfBirth);
                        dayBorn = date.getDate().toString().padStart(2, '0');
                        monthBorn = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-indexed
                        yearBorn = date.getFullYear().toString();
                    }

                    setFormData({
                        preferredName: profileData.preferredName || "",
                        major: profileData.major || "",
                        gender: profileData.gender || "",
                        hobbies: profileData.hobbies || [],
                        dayBorn,
                        monthBorn,
                        yearBorn,
                        photos: profileData.photos || [],
                        sexualOrientation: profileData.sexualOrientation || "",
                        genderPreference: profileData.genderPreference || ""
                    });
                } else {
                    if (response.status !== 404) {
                        console.warn("Profile fetch warning:", response.status);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchProfileData();
    }, [status, session]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));

        // Clear errors as user types
        if (id === "preferredName" && value.trim()) {
            setErrors(prev => ({ ...prev, preferredName: false }));
        }
        if (id === "major" && value.trim()){
            setErrors(prev=>({...prev, major: false}));
        }
        if (["dayBorn", "monthBorn", "yearBorn"].includes(id)) {
            validateBirthday(id, value);
        }
    };

    // Validate birthday fields
    const validateBirthday = (field: string, value: string) => {
        const day = field === "dayBorn" ? value : formData.dayBorn;
        const month = field === "monthBorn" ? value : formData.monthBorn;
        const year = field === "yearBorn" ? value : formData.yearBorn;

        // Only validate if at least one field has a value
        if (day || month || year) {
            const dayValid = day ? (parseInt(day) >= 1 && parseInt(day) <= 31) : true;
            const monthValid = month ? (parseInt(month) >= 1 && parseInt(month) <= 12) : true;
            const yearValid = year ? (parseInt(year) >= 1900 && parseInt(year) <= new Date().getFullYear()) : true;

            // Check if all fields are provided when at least one is given
            const allFieldsProvided = day && month && year;
            const fieldsValid = dayValid && monthValid && yearValid;

            // Error if not all fields provided or any field is invalid
            setErrors(prev => ({ ...prev, birthday: !allFieldsProvided || !fieldsValid }));
        } else {
            // All fields empty - no error
            setErrors(prev => ({ ...prev, birthday: false }));
        }
    };

    // Handle button selection (for gender, orientation, and gender preference)
    const handleButtonSelection = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear errors when selections are made
        if (field === "gender") {
            setErrors(prev => ({ ...prev, gender: false }));
        }
        if (field === "genderPreference") {
            setErrors(prev => ({ ...prev, genderPreference: false }));
        }
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {
            preferredName: !formData.preferredName.trim(),
            major: !formData.major.trim(),
            gender: !formData.gender,
            birthday: false,
            genderPreference: !formData.genderPreference
        };

        // Validate birthday if any fields are filled
        if (formData.dayBorn || formData.monthBorn || formData.yearBorn) {
            const day = parseInt(formData.dayBorn);
            const month = parseInt(formData.monthBorn);
            const year = parseInt(formData.yearBorn);

            const dayValid = formData.dayBorn ? !isNaN(day) && day >= 1 && day <= 31 : false;
            const monthValid = formData.monthBorn ? !isNaN(month) && month >= 1 && month <= 12 : false;
            const yearValid = formData.yearBorn ? !isNaN(year) && year >= 1900 && year <= new Date().getFullYear() : false;

            const allFieldsProvided = formData.dayBorn && formData.monthBorn && formData.yearBorn;
            const fieldsValid = dayValid && monthValid && yearValid;

            newErrors.birthday = !allFieldsProvided || !fieldsValid;
        } else {
            newErrors.birthday = false;
        }

        setErrors(newErrors);

        // Show toasts for each error
        if (newErrors.preferredName) {
            toast({
                title: "Missing Information",
                description: "Please enter your preferred name",
                variant: "destructive"
            });
        }

        if (newErrors.major) {
            toast({
                title: "Missing Information",
                description: "Please enter your major",
                variant: "destructive"
            });
        }

        if (newErrors.gender) {
            toast({
                title: "Missing Information",
                description: "Please select your gender",
                variant: "destructive"
            });
        }

        if (newErrors.genderPreference) {
            toast({
                title: "Missing Information",
                description: "Please select your gender preference",
                variant: "destructive"
            });
        }

        if (newErrors.birthday) {
            toast({
                title: "Invalid Date",
                description: "Please enter a complete and valid birthdate or leave all fields empty",
                variant: "destructive"
            });
        }

        return !newErrors.preferredName && !newErrors.major && !newErrors.gender && !newErrors.birthday && !newErrors.genderPreference;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            // Focus on the first input with an error
            if (errors.preferredName) {
                document.getElementById('preferredName')?.focus();
            } else if (errors.major) {
                document.getElementById('major')?.focus();
            } else if (errors.birthday) {
                document.getElementById('dayBorn')?.focus();
            }
            return;
        }
        setLoading(true);

        try {
            // Convert day, month, year to proper DateTime object if all fields are provided
            let dateOfBirth = null;
            if (formData.dayBorn && formData.monthBorn && formData.yearBorn) {
                // Format: YYYY-MM-DD for proper ISO date string
                const year = parseInt(formData.yearBorn);
                const month = parseInt(formData.monthBorn) - 1; // JavaScript months are 0-indexed
                const day = parseInt(formData.dayBorn);

                // Create a Date object (handles validation too)
                const date = new Date(year, month, day);

                // Check if date is valid
                if (isNaN(date.getTime())) {
                    throw new Error("Invalid date");
                }

                dateOfBirth = date.toISOString();
            }

            // Prepare data for submission
            const profileData = {
                preferredName: formData.preferredName,
                major: formData.major,
                gender: formData.gender,
                genderPreference: formData.genderPreference,
                sexualOrientation: formData.sexualOrientation || null,
                dateOfBirth: dateOfBirth,
                hobbies: formData.hobbies,
                photos: formData.photos || []
            };

            console.log("Submitting profile data:", profileData);

            // Send data to API
            const response = await fetch(`/api/profiles/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });

            // Check response status first
            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", response.status, errorText);

                let errorMessage = "Failed to save profile";
                try {
                    // Try to parse error as JSON, but don't rely on it
                    const errorData = JSON.parse(errorText);
                    if (errorData?.message) {
                        errorMessage = errorData.message;
                    }
                } catch {
                    // If parsing fails, use status text
                    errorMessage = `Server error: ${response.statusText || response.status}`;
                }

                throw new Error(errorMessage);
            }

            // If response is OK, then parse JSON
            const responseData = await response.json();
            console.log("Response data:", responseData);

            toast({
                title: "Success",
                description: "Your information has been saved!"
            });

            // Navigate to the next page
            console.log("Navigating to aboutme page...");
            router.push('/aboutme');

        } catch (error) {
            console.error('Error updating profile:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update profile",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Custom style for button components
    const buttonStyle = (isSelected: boolean) => {
        return `w-full py-3 font-medium rounded-full transition-colors ${
            isSelected
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-800 border border-gray-300 hover:border-purple-300"
        }`;
    };

    return (
        <main className="flex flex-col items-center px-4 py-8 pb-24 w-full max-w-6xl mx-auto">
            {/* Heart Progress */}
            <div className="mb-8 text-center">
                <Image 
                    src="/cada_heart.png"
                    alt="Heart" 
                    className="w-20 h-20"
                    width={40}
                    height={40}
                />
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="w-full max-w-5xl">
                {/* Personal Information Section (Top) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-10">
                    {/* Left Side - Name and Major */}
                    <div className="flex flex-col gap-6">
                        {/* Name */}
                        <div>
                            <SectionHeading>
                                Hi {session?.user?.name?.split(' ')[0] || "there"}
                            </SectionHeading>
                            <p className="text-gray-600 mb-4">
                                Create a unique nickname that represents you. It&#39;s how others will know and remember you.
                            </p>
                            <div>
                                <LargeInput
                                    id="preferredName"
                                    placeholder="Your preferred name"
                                    value={formData.preferredName}
                                    onChange={handleInputChange}
                                    className={errors.preferredName ? "border-red-500 focus:ring-red-500" : ""}
                                />
                                {errors.preferredName && (
                                    <p className="text-sm text-red-500 mt-1">Please enter your preferred name</p>
                                )}
                            </div>
                        </div>

                        {/* Major */}
                        <div>
                            <SectionHeading>
                                Major
                            </SectionHeading>
                            <LargeInput
                                id="major"
                                placeholder="Your major"
                                value={formData.major}
                                onChange={handleInputChange}
                                className={errors.major ? "border-red-500 focus:ring-red-500" : ""}
                            />
                            {errors.major && (
                                <p className="text-sm text-red-500 mt-1">Please enter your major</p>
                            )}
                        </div>
                    </div>

                    {/* Right Side - Birthday */}
                    <div>
                        <SectionHeading emoji="🎂">
                            Let&#39;s celebrate you
                        </SectionHeading>
                        <p className="text-gray-600 mb-4">
                            Tell us your birthdate. Your profile doesn&#39;t display your birthdate, only your age.
                        </p>
                        <div className="flex gap-4">
                            <LargeInput
                                id="dayBorn"
                                placeholder="DD"
                                value={formData.dayBorn}
                                onChange={handleInputChange}
                                maxLength={2}
                                className={`text-center ${errors.birthday ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            <LargeInput
                                id="monthBorn"
                                placeholder="MM"
                                value={formData.monthBorn}
                                onChange={handleInputChange}
                                maxLength={2}
                                className={`text-center ${errors.birthday ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                            <LargeInput
                                id="yearBorn"
                                placeholder="YYYY"
                                value={formData.yearBorn}
                                onChange={handleInputChange}
                                maxLength={4}
                                className={`text-center ${errors.birthday ? "border-red-500 focus:ring-red-500" : ""}`}
                            />
                        </div>
                        {errors.birthday && (
                            <p className="text-sm text-red-500 mt-1">
                                Please enter all date fields or leave them all empty
                            </p>
                        )}
                    </div>
                </div>

                {/* Three Columns for Selection Options (Bottom) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                    {/* Gender Column */}
                    <div>
                        <SectionHeading emoji="✨" required={true}>
                            Be true to yourself
                        </SectionHeading>
                        <p className="text-gray-600 mb-10">
                            Choose the gender that best represents you.
                        </p>
                        <div className="flex flex-col gap-3">
                            {Object.entries(allGenders()).map(([key, value]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleButtonSelection("gender", key)}
                                    className={buttonStyle(formData.gender === key)}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        {errors.gender && (
                            <p className="text-sm text-red-500 mt-2">Please select your gender</p>
                        )}
                    </div>

                    {/* Gender Preference Column */}
                    <div>
                        <SectionHeading emoji="❤️" required={true}>
                            Gender Preference
                        </SectionHeading>
                        <p className="text-gray-600 mb-4">
                            Choose the gender you&#39;d like to be matched with.
                        </p>
                        <div className="flex flex-col gap-3">
                            {Object.entries(allGenders()).map(([key, value]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleButtonSelection("genderPreference", key)}
                                    className={buttonStyle(formData.genderPreference === key)}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                        {errors.genderPreference && (
                            <p className="text-sm text-red-500 mt-2">Please select your gender preference</p>
                        )}
                    </div>

                    {/* Sexual Orientation Column */}
                    <div>
                        <SectionHeading>
                            Sexual Orientation
                        </SectionHeading>
                        <p className="text-gray-600 mb-4">
                            Choose the orientation that best describes you.
                        </p>
                        <div className="flex flex-col gap-3">
                            {Object.entries(allSexualOrientations()).map(([key, value]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleButtonSelection("sexualOrientation", key)}
                                    className={buttonStyle(formData.sexualOrientation === key)}
                                >
                                    {value}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Continue Button */}
                <div className="mt-10 w-full flex justify-center">
                    <Button1
                        type="submit"
                        className={`w-full max-w-md text-lg font-semibold py-3 rounded-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Continue (1/3)"}
                    </Button1>
                </div>
            </form>
        </main>
    );
};