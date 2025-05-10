// pages/profile/about.tsx
"use client"
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@components/ui/input";
import { allHobbies } from "@lib/data";
import { Button1, Button3 } from "@components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Plus, AlertCircle } from "lucide-react";
import {SectionHeading} from "@components/ui/heading";
import {profileSchema} from "@lib/formdata";

export default function AboutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newHobby, setNewHobby] = useState("");
    const [showCustomHobbyInput, setShowCustomHobbyInput] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        hobbies: [] as string[],
        description: ""
    });

    // Error states
    const [errors, setErrors] = useState({
        hobbies: false,
        description: false
    });

    // Get user identifier
    const userId = session?.user.userId as string;

    // Fetch existing profile data when component mounts
    useEffect(() => {
        const fetchProfileData = async () => {

            try {
                const response = await fetch(`/api/profiles/`);

                if (response.ok) {
                    const profileData = await response.json();
                    console.log("Fetched profile data:", profileData);

                    setFormData({
                        hobbies: Array.isArray(profileData.hobbies) ? profileData.hobbies : [],
                        description: profileData.description || ""
                    });

                    console.log("Profile data set:", formData.hobbies, formData)
                } else {
                    // If 404, it's a new user without a profile yet
                    if (response.status !== 404) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error("Profile fetch error:", errorData);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile data:', error);
            }
        };

        fetchProfileData();
    }, [status, session, router]);

    // Handle textarea change for description
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, description: e.target.value }));
        // Clear error when user types
        if (e.target.value.trim()) {
            setErrors(prev => ({ ...prev, description: false }));
        }
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle new hobby input change
    const handleNewHobbyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewHobby(e.target.value);
    };

    // Add custom hobby
    const addCustomHobby = () => {
        if (!newHobby.trim()) {
            return;
        }

        const customHobbyKey = `custom_${newHobby.trim().toLowerCase().replace(/\s+/g, '_')}`;

        // Check if hobby already exists
        if (formData.hobbies.includes(customHobbyKey)) {
            toast({
                title: "Hobby already added",
                description: "This hobby is already in your list",
                variant: "destructive"
            });
            return;
        }

        // Add the custom hobby
        setFormData(prev => ({
            ...prev,
            hobbies: [...prev.hobbies, customHobbyKey]
        }));

        // Clear hobby error if any hobbies are selected
        setErrors(prev => ({ ...prev, hobbies: false }));

        // Reset input
        setNewHobby("");
        setShowCustomHobbyInput(false);
    };

    // Handle enter key for custom hobby
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addCustomHobby();
        }
    };

    // Toggle hobby selection
    const toggleHobby = (hobbyKey: string) => {
        setFormData(prev => {
            // If hobby is already selected, remove it
            if (prev.hobbies.includes(hobbyKey)) {
                const newHobbies = prev.hobbies.filter(h => h !== hobbyKey);
                // Set error if no hobbies are selected
                if (newHobbies.length === 0) {
                    setErrors(err => ({ ...err, hobbies: true }));
                }
                return {
                    ...prev,
                    hobbies: newHobbies
                };
            }
            // Otherwise add it
            else {
                // Clear error when adding a hobby
                setErrors(prev => ({ ...prev, hobbies: false }));
                return {
                    ...prev,
                    hobbies: [...prev.hobbies, hobbyKey]
                };
            }
        });
    };

    // Filter hobbies based on search term
    const filteredHobbies = () => {
        const allHobbiesList = allHobbies();
        if (!searchTerm) return Object.entries(allHobbiesList);

        return Object.entries(allHobbiesList).filter(([, value]) =>
            value.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    // Form validation
    const validateForm = () => {
        const newErrors = {
            hobbies: formData.hobbies.length === 0,
            description: !formData.description.trim()
        };

        setErrors(newErrors);

        // Show toast for each error
        if (newErrors.hobbies) {
            toast({
                title: "Missing Information",
                description: "Please select at least one hobby or interest",
                variant: "destructive"
            });
        }

        if (newErrors.description) {
            toast({
                title: "Missing Information",
                description: "Please write something about yourself",
                variant: "destructive"
            });
        }

        return !newErrors.hobbies && !newErrors.description;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            // Focus on the first input with an error
            if (errors.description) {
                document.querySelector('textarea')?.focus();
            }
            return;
        }

        if (status !== "authenticated") {
            toast({
                title: "Error",
                description: "You must be logged in to save your profile",
                variant: "destructive"
            });
            return;
        }

        if (!userId) {
            toast({
                title: "Error",
                description: "Unable to identify user. Please log out and log back in.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);

        try {
            // First, get existing profile to preserve other fields
            const getResponse = await fetch(`/api/profiles/`);
            let existingData = {};

            if (getResponse.ok) {
                existingData = await getResponse.json();
                console.log("Existing profile data:", existingData);
            }

            // Ensure hobbies is an array
            if (!Array.isArray(formData.hobbies)) {
                console.error("hobbies is not an array:", formData.hobbies);
                formData.hobbies = [];
            }

            // Prepare data for submission (merge with existing data)
            const profileData = {
                ...existingData,
                hobbies: formData.hobbies,
                description: formData.description
            };

            console.log("Submitting profile data:", profileData);



            const validationResult = profileSchema.safeParse(profileData);
            console.log('validationResult:', validationResult);

            if (!validationResult.success) {
                // return res.status(400).json({ message: "Invalid profile data",
                //     errors: JSON.parse(validationResult.error.message),
                //     body: (req.body) });

                console.log('Error updating profile:', (validationResult.error.message));
                toast({
                    title: "Error",
                    description: validationResult.error.message ? validationResult.error.message : "Failed to update profile",
                    variant: "destructive"
                });
            }



            // Send data to API
            const response = await fetch(`/api/profiles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });
            console.log("abc: ", JSON.stringify(profileData));

            // Log raw response
            console.log("Response status:", response.status);

            let responseData;
            try {
                responseData = await response.json();
                console.log("Response data:", responseData);
            } catch (error) {
                console.error("Error parsing response:", error);
            }

            if (!response.ok) {
                throw new Error(responseData?.message || "Failed to save profile");
            }

            toast({
                title: "Success",
                description: "Your profile has been saved successfully!"
            });

            // Navigate to the photo upload page
            console.log("Navigating to photo page...");
            router.push('/images');

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

    return (
        <main className="flex flex-row justify-center items-start gap-20 px-6 py-8 w-full max-w-6xl mx-auto flex-grow">
            <div className="min-h-screen bg-white px-6 py-10">
                {/* Header */}
                <div className="flex flex-col items-center mb-10">
                    <img src="/cada_heart.png" alt="Heart" className="w-20 h-20"/>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Grid layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 max-w-screen-2xl w-full mx-auto px-16 py-20">
                        {/* Left Side */}
                        <div>
                            <SectionHeading>Discover like-minded people 🫂</SectionHeading>
                            <p className="text-gray-600 mb-6 text-lg">
                                Share your interests, passions, and hobbies. We will connect you with people who share your
                                enthusiasm.
                            </p>

                            <div className="flex gap-2 mb-6">
                                <Input
                                    type="text"
                                    placeholder="🔍 Search interest"
                                    className="w-full p-4 text-lg border rounded-xl"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                <button
                                    type="button"
                                    className="flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                                    onClick={() => setShowCustomHobbyInput(!showCustomHobbyInput)}
                                    title="Add custom hobby"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            {showCustomHobbyInput && (
                                <div className="flex gap-2 mb-6">
                                    <Input
                                        type="text"
                                        placeholder="Enter a custom hobby"
                                        className="w-full p-4 text-lg border rounded-xl"
                                        value={newHobby}
                                        onChange={handleNewHobbyChange}
                                        onKeyDown={handleKeyDown}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl whitespace-nowrap"
                                        onClick={addCustomHobby}
                                    >
                                        Add
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 max-h-72 overflow-y-auto mb-4">
                                {filteredHobbies().map(([key, value]) => (
                                    <Button3
                                        key={key}
                                        type="button"
                                        onClick={() => toggleHobby(key)}
                                        isSelected={formData.hobbies.includes(key)}
                                    >
                                        {value}
                                    </Button3>
                                ))}
                            </div>

                            {/* Display selected hobbies separately */}
                            <div className="mt-6">
                                <div className="flex items-center mb-2">
                                    <SectionHeading>Your selected hobbies:</SectionHeading>
                                    {errors.hobbies && (
                                        <div className="ml-2 flex items-center text-red-500">
                                            <AlertCircle size={16} className="mr-1" />
                                            <span className="text-sm">Please select at least one hobby</span>
                                        </div>
                                    )}
                                </div>

                                {formData.hobbies.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.hobbies.map(hobbyKey => {
                                            // Handle both predefined and custom hobbies
                                            let displayName: string = "";

                                            if (hobbyKey.startsWith('custom_')) {
                                                // For custom hobbies, format the display name
                                                displayName = hobbyKey.replace('custom_', '').replace(/_/g, ' ');
                                                // Capitalize first letter of each word
                                                displayName = displayName
                                                    .split(' ')
                                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                    .join(' ');
                                            } else {
                                                // For predefined hobbies, use the value from allHobbies
                                                const hobbiesList = allHobbies();
                                                displayName = hobbiesList[hobbyKey] || hobbyKey;
                                            }

                                            return (
                                                <div
                                                    key={hobbyKey}
                                                    className="px-3 py-1 bg-purple-600 text-white rounded-full flex items-center gap-2"
                                                >
                                                    {displayName}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleHobby(hobbyKey)}
                                                        className="text-white hover:text-purple-200"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={`text-sm ${errors.hobbies ? 'text-red-500' : 'text-gray-500'}`}>
                                        No hobbies selected yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side */}
                        <div>
                            <div className="flex items-center mb-3">
                                <SectionHeading>About Me</SectionHeading>
                                {errors.description && (
                                    <div className="ml-2 flex items-center text-red-500">
                                        <AlertCircle size={16} className="mr-1" />
                                        <span className="text-sm">Required</span>
                                    </div>
                                )}
                            </div>
                            <textarea
                                placeholder="I'm an adventurous soul who loves exploring new places..."
                                className={`w-full h-60 p-4 border rounded-xl bg-gray-50 text-lg resize-none ${
                                    errors.description ? 'border-red-500 focus:ring-red-500' : ''
                                }`}
                                value={formData.description}
                                onChange={handleDescriptionChange}
                            />
                            {errors.description && (
                                <p className="mt-2 text-sm text-red-500">Please write something about yourself</p>
                            )}
                        </div>
                    </div>

                    {/* Continue Button */}
                    <div className="flex justify-center mt-20">
                        <Button1
                            type="submit"
                            className={`text-lg font-bold py-4 px-12 rounded-full ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Continue (2/3)"}
                        </Button1>
                    </div>
                </form>
            </div>
        </main>
    );
}