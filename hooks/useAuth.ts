import { useState } from "react"
import axiosInstance from "../lib/axios"



export const useAuthAPI = () => {

    const [isLoading, setIsloading] = useState(false);


    const login = async () => {
        const res = await axiosInstance.post("/")
    }

    const googleAuth = async (accessToken: string) => {
        console.log("google auth was clicked")
        setIsloading(true);
        try {
            const res = await axiosInstance.post("/auth/google", {
                accessToken
            });
        } catch (err: any) {
            console.log("error in google auth: ", { err })
        }
        setIsloading(false)
    }


    return {
        isLoading,
        login,
        googleAuth
    }
}