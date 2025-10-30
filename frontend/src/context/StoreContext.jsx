import axios from "axios";
import { createContext, useEffect, useState } from "react"

export const StoreContext = createContext(null)

const StoreContextProvider = (props) => {

    const [ownedCourses, setOwnedCourses] = useState([]);
    const [token, setToken] = useState("")
    const [courses, setCourses] = useState([])
    const [userName, setUserName] = useState("")
    const [userEmail, setUserEmail] = useState("")
    const [userPhone, setUserPhone] = useState("")
    const [userRole, setUserRole] = useState("")
    const [isLoaded, setIsLoaded] = useState(false);

    const url = "http://localhost:5000"


    const fetchCourseList = async () => {
        const response = await axios.get(url + "/api/course/listCourse");
        setCourses(response.data.data)
        console.log(response.data.data)
    }

    useEffect(() => {
        async function loadData() {
            await fetchCourseList()
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                setToken(savedToken);
                setUserName(localStorage.getItem("userName"));
                setUserEmail(localStorage.getItem("userEmail"));
                setUserPhone(localStorage.getItem("userPhone"));
                setUserRole(localStorage.getItem("userRole"));
            }
            setIsLoaded(true);
        }
        loadData();
    }, [])

    useEffect(() => {
        // CHỈ lưu lại khi token có giá trị thật
        if (token && token !== "") {
            localStorage.setItem("token", token);
            localStorage.setItem("userName", userName);
            localStorage.setItem("userEmail", userEmail);
            localStorage.setItem("userPhone", userPhone);
            localStorage.setItem("userRole", userRole);
        }
    }, [token, userName, userEmail, userPhone, userRole]);

    const logout = () => {
        setToken(null);
        setUserName("");
        setUserEmail("");
        setUserPhone("");
        setUserRole("");
        localStorage.clear();
    };

    // useEffect(() => {
    //     if (token) {
    //         localStorage.setItem("token", token);
    //         localStorage.setItem("userName", userName);
    //         localStorage.setItem("userEmail", userEmail);
    //         localStorage.setItem("userPhone", userPhone);
    //         localStorage.setItem("userRole", userRole);
    //     } else {
    //         // Khi logout => clear storage
    //         localStorage.removeItem("token");
    //         localStorage.removeItem("userName");
    //         localStorage.removeItem("userEmail");
    //         localStorage.removeItem("userPhone");
    //         localStorage.removeItem("userRole");
    //     }
    // }, [token, userName, userEmail, userPhone, userRole]);

    const contextValue = {
        courses,
        ownedCourses,
        setOwnedCourses,
        url,
        token,
        setToken,
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        userPhone,
        setUserPhone,
        userRole,
        setUserRole,
        fetchCourseList,
        logout
    }

    if (!isLoaded) {
        return <div>Loading...</div>; // chờ localStorage load xong
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider