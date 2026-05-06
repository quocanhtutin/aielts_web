import axios from "axios";
import { createContext, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const StoreContext = createContext(null)

    const mockWords = [
    {
    _id: "65a100000000000000000001",
    word: "mother-in-law",
    type: "noun",
    pronunciation: "/ˈmʌðər ɪn lɔː/",
    definition: "The mother of your husband or wife",
    exampleSentence: "My mother-in-law is visiting us this weekend.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000001",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000002",
    word: "father-in-law",
    type: "noun",
    pronunciation: "/ˈfɑːðər ɪn lɔː/",
    definition: "The father of your husband or wife",
    exampleSentence: "His father-in-law works as a doctor.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000001",
    description: "",
    memorized: false,
    order: 2
    },
    {
    _id: "65a100000000000000000003",
    word: "scholarship",
    type: "noun",
    pronunciation: "/ˈskɒlərʃɪp/",
    definition: "Money given to students to help pay for education",
    exampleSentence: "She received a scholarship to study abroad.",
    synonym: ["grant"],
    opposite: [],
    topicId: "65a200000000000000000002",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000004",
    word: "curriculum",
    type: "noun",
    pronunciation: "/kəˈrɪkjʊləm/",
    definition: "The subjects included in a course of study",
    exampleSentence: "The curriculum has been updated this year.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000002",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000005",
    word: "pollution",
    type: "noun",
    pronunciation: "/pəˈluːʃən/",
    definition: "The presence of harmful substances in the environment",
    exampleSentence: "Air pollution is a serious problem in many cities.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000003",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000006",
    word: "sustainable",
    type: "adjective",
    pronunciation: "/səˈsteɪnəbl/",
    definition: "Able to continue over a long period without harming the environment",
    exampleSentence: "We need sustainable energy sources.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000003",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000007",
    word: "startup",
    type: "noun",
    pronunciation: "/ˈstɑːrtʌp/",
    definition: "A newly established business",
    exampleSentence: "He founded a tech startup last year.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000004",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000008",
    word: "entrepreneur",
    type: "noun",
    pronunciation: "/ˌɒntrəprəˈnɜːr/",
    definition: "A person who starts and runs a business",
    exampleSentence: "She became a successful entrepreneur.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000004",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000009",
    word: "destination",
    type: "noun",
    pronunciation: "/ˌdestɪˈneɪʃən/",
    definition: "The place where someone is going",
    exampleSentence: "Paris is a popular tourist destination.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000005",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000010",
    word: "itinerary",
    type: "noun",
    pronunciation: "/aɪˈtɪnərəri/",
    definition: "A planned route or journey",
    exampleSentence: "The travel itinerary includes three countries.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000005",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000011",
    word: "ancestor",
    type: "noun",
    pronunciation: "/ˈænsestər/",
    definition: "A person from whom someone is descended",
    exampleSentence: "Many people study their ancestors to learn about family history.",
    synonym: ["forefather"],
    opposite: [],
    topicId: "65a200000000000000000001",
    description: "",
    memorized: false,
    linkImage: "",
    order: 18
    },
    {
    _id: "65a100000000000000000012",
    word: "tuition",
    type: "noun",
    pronunciation: "/tjuːˈɪʃən/",
    definition: "Money paid for teaching",
    exampleSentence: "University tuition fees are expensive.",
    synonym: ["fee"],
    opposite: [],
    topicId: "65a200000000000000000002",
    description: "",
    memorized: false,
    linkImage: "",
    order: 19
    },
    {
    _id: "65a100000000000000000013",
    word: "biodiversity",
    type: "noun",
    pronunciation: "/ˌbaɪəʊdaɪˈvɜːsəti/",
    definition: "The variety of plant and animal life",
    exampleSentence: "Protecting biodiversity is important for ecosystems.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000003",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000014",
    word: "investment",
    type: "noun",
    pronunciation: "/ɪnˈvestmənt/",
    definition: "The action of putting money into something to make profit",
    exampleSentence: "Real estate is a common investment.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000004",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000015",
    word: "accommodation",
    type: "noun",
    pronunciation: "/əˌkɒməˈdeɪʃən/",
    definition: "A place to live or stay",
    exampleSentence: "We booked accommodation near the beach.",
    synonym: ["lodging"],
    opposite: [],
    topicId: "65a200000000000000000005",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000016",
    word: "siblings",
    type: "noun",
    pronunciation: "/ˈsɪblɪŋz/",
    definition: "Brothers or sisters",
    exampleSentence: "She has three siblings.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000001",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000017",
    word: "lecture",
    type: "noun",
    pronunciation: "/ˈlektʃər/",
    definition: "An educational talk given to students",
    exampleSentence: "The professor gave a lecture on economics.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000002",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000018",
    word: "recycle",
    type: "verb",
    pronunciation: "/riːˈsaɪkl/",
    definition: "To process materials so they can be used again",
    exampleSentence: "We should recycle plastic bottles.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000003",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000019",
    word: "profit",
    type: "noun",
    pronunciation: "/ˈprɒfɪt/",
    definition: "Money earned from business after costs",
    exampleSentence: "The company made a large profit this year.",
    synonym: ["earnings"],
    opposite: ["loss"],
    topicId: "65a200000000000000000004",
    description: "",
    memorized: false,
    linkImage: "",
    order: 1
    },
    {
    _id: "65a100000000000000000020",
    word: "journey",
    type: "noun",
    pronunciation: "/ˈdʒɜːni/",
    definition: "An act of travelling from one place to another",
    exampleSentence: "The journey took five hours.",
    synonym: ["trip"],
    opposite: [],
    topicId: "65a200000000000000000005",
    description: "",
    memorized: false,
    linkImage: "",
    order: 2
    },
    {
    _id: "65a100000000000000000021",
    word: "care",
    type: "verb",
    pronunciation: "/keər/",
    definition: "To look after someone",
    exampleSentence: "She cares for her elderly parents.",
    synonym: ["look after", "support"],
    opposite: ["ignore", "neglect"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 3
  },
  {
    _id: "65a100000000000000000022",
    word: "raise",
    type: "verb",
    pronunciation: "/reɪz/",
    definition: "To take care of a child until they become an adult",
    exampleSentence: "They raised three children together.",
    synonym: ["bring up"],
    opposite: ["abandon"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 4
  },
  {
    _id: "65a100000000000000000023",
    word: "supportive",
    type: "adjective",
    pronunciation: "/səˈpɔːrtɪv/",
    definition: "Giving help or encouragement",
    exampleSentence: "Her family is very supportive.",
    synonym: ["helpful", "encouraging"],
    opposite: ["unsupportive"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 5
  },
  {
    _id: "65a100000000000000000024",
    word: "strict",
    type: "adjective",
    pronunciation: "/strɪkt/",
    definition: "Demanding that rules are obeyed",
    exampleSentence: "His parents are very strict.",
    synonym: ["firm"],
    opposite: ["lenient"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 6
  },
  {
    _id: "65a100000000000000000025",
    word: "generation",
    type: "noun",
    pronunciation: "/ˌdʒenəˈreɪʃən/",
    definition: "All people born at about the same time",
    exampleSentence: "Each generation has different values.",
    synonym: [],
    opposite: [],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 7
  },
  {
    _id: "65a100000000000000000026",
    word: "argue",
    type: "verb",
    pronunciation: "/ˈɑːɡjuː/",
    definition: "To disagree with someone",
    exampleSentence: "Siblings often argue.",
    synonym: ["disagree"],
    opposite: ["agree"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 8
  },
  {
    _id: "65a100000000000000000027",
    word: "close-knit",
    type: "adjective",
    pronunciation: "/ˌkləʊs ˈnɪt/",
    definition: "Having strong relationships",
    exampleSentence: "They are a close-knit family.",
    synonym: ["united"],
    opposite: ["distant"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 9
  },
  {
    _id: "65a100000000000000000028",
    word: "divorce",
    type: "noun",
    pronunciation: "/dɪˈvɔːrs/",
    definition: "The legal ending of a marriage",
    exampleSentence: "Their divorce was difficult.",
    synonym: ["separation"],
    opposite: ["marriage"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 10
  },
  {
    _id: "65a100000000000000000029",
    word: "married",
    type: "adjective",
    pronunciation: "/ˈmærid/",
    definition: "Having a husband or wife",
    exampleSentence: "They have been married for 10 years.",
    synonym: [],
    opposite: ["single"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 11
  },
  {
    _id: "65a100000000000000000030",
    word: "respect",
    type: "noun",
    pronunciation: "/rɪˈspekt/",
    definition: "Admiration for someone",
    exampleSentence: "Respect is important in a family.",
    synonym: ["admiration"],
    opposite: ["disrespect"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 12
  },
  {
    _id: "65a100000000000000000031",
    word: "discipline",
    type: "noun",
    pronunciation: "/ˈdɪsəplɪn/",
    definition: "Training to obey rules",
    exampleSentence: "Children need discipline.",
    synonym: ["control"],
    opposite: ["freedom"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 13
  },
  {
    _id: "65a100000000000000000032",
    word: "protect",
    type: "verb",
    pronunciation: "/prəˈtekt/",
    definition: "To keep someone safe",
    exampleSentence: "Parents protect their children.",
    synonym: ["defend"],
    opposite: ["harm"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 14
  },
  {
    _id: "65a100000000000000000033",
    word: "independent",
    type: "adjective",
    pronunciation: "/ˌɪndɪˈpendənt/",
    definition: "Not needing help from others",
    exampleSentence: "Teenagers want to be independent.",
    synonym: ["self-reliant"],
    opposite: ["dependent"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 15
  },
  {
    _id: "65a100000000000000000034",
    word: "relationship",
    type: "noun",
    pronunciation: "/rɪˈleɪʃənʃɪp/",
    definition: "The way people are connected",
    exampleSentence: "They have a strong relationship.",
    synonym: ["connection"],
    opposite: [],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 16
  },
  {
    _id: "65a100000000000000000035",
    word: "careful",
    type: "adjective",
    pronunciation: "/ˈkeəfəl/",
    definition: "Thinking about what you are doing",
    exampleSentence: "She is very careful with her children.",
    synonym: ["cautious"],
    opposite: ["careless"],
    topicId: "65a200000000000000000001",
    memorized: false,
    order: 17
  }
    ]

    const mockTopics = [

    {
    _id: "65a200000000000000000001",
    topic: "Family",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    },

    {
    _id: "65a200000000000000000002",
    topic: "Education",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    },

    {
    _id: "65a200000000000000000003",
    topic: "Environment",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    },

    {
    _id: "65a200000000000000000004",
    topic: "Business",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    },

    {
    _id: "65a200000000000000000005",
    topic: "Travel",
    createdDate: new Date(),
    public: false,
    ownerId: "user001",
    userId: "user001",
    isActive: true,
    }

    ]

const StoreContextProvider = (props) => {

    const [ownedCourses, setOwnedCourses] = useState([]);
    const [token, setToken] = useState("")
    const [courses, setCourses] = useState([])
    const [userName, setUserName] = useState("")
    const [userEmail, setUserEmail] = useState("")
    const [userPhone, setUserPhone] = useState("")
    const [userRole, setUserRole] = useState("")
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeCourses, setActiveCourses] = useState([])
    const [inactiveCourses, setInactiveCourses] = useState([])
    const [contactInfor, setContactInfor] = useState({
        name: "",
        description: "",
        address: "",
        branches: [],
        phoneContact: "",
        emailContact: "",
        links: []
    })

    const [topicWithWord, setTopicWithWord] = useState([])
    const [publicTopics, setPublicTopics]= useState([])

    const navigate = useNavigate()

    const url = "http://localhost:5000"


    const fetchCourseList = async () => {
        const response = await axios.get(url + "/api/course/listCourse");
        setCourses(response.data.data)
        setActiveCourses(response.data.data.filter(c => c.isActive))
        setInactiveCourses(response.data.data.filter(c => !c.isActive))
    }

    const fetchContactInfor = async () => {
        const response = await axios.get(url + "/api/contactInfor/getContactInfor")
        if (response.data && response.data.success && response.data.data) {
            setContactInfor(response.data.data)
        } else {
            setContactInfor({
                name: "",
                description: "",
                address: "",
                branches: [],
                phoneContact: "",
                emailContact: "",
                links: []
            })
        }
    }

    const fetchUserCourses = async () => {
        try {
            const response = await axios.get(`${url}/api/user/ownedCourses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success && response.data.data) {
                setOwnedCourses(response.data.data.ownedCourses || []);
            }
        } catch (err) {
            console.error("Fetch owned courses error:", err);
        }
    };

    const fetchOwnedTopics = async () => {
        try{
            const response = await axios.get(`${url}/api/flashcard/topics/ownedTopics`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.data.success && response.data.data) {
                setTopicWithWord(response.data.data || buildColumnsFromData(mockTopics,mockWords));
            }
        }catch (err) {
            console.error("Fetch owned topics error:", err);
        }
    }

    const buildColumnsFromData = (topics, words) => {
            const wordGroup = {}
            // group words theo topicId
            words.forEach(word => {
                const topicId = word.topicId?.toString()
                if (!wordGroup[topicId]) {
                    wordGroup[topicId] = []
                }
                wordGroup[topicId].push(word)
            })
    
            // build columns
            return topics.map(t => ({
                ...t,
                words: wordGroup[t._id.toString()] || []
                }))
        }


    const memorizeWord = async (word) => {
        try{
            const res = await axios.put(`${url}/api/flashcard/word/${word._id}/memorized`, {
                memorized:!word.memorized
            }, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if(res.data.success){
                const newState = {...word, memorized:!word.memorized}
                setTopicWithWord(prev =>
                    prev.map(topic => {
                        if (topic._id !== newState.topicId) return topic

                        return {
                            ...topic,
                            words: topic.words.map(w =>
                                w._id === newState._id ? newState : w
                            )
                        }

                    })
                )
            }
        }
        catch(e){
            console.log(e);
            toast.error("Lôi cập nhật trạng thái từ!")
        }
    }

    useEffect(() => {
        async function loadData() {
            await fetchCourseList()
            await fetchContactInfor()
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

        if (token && userRole === "user") {
            fetchUserCourses();
            fetchOwnedTopics();
        }
    }, [token, userName, userEmail, userPhone, userRole]);

    const logout = () => {
        setToken(null);
        setUserName("");
        setUserEmail("");
        setUserPhone("");
        setUserRole("");
        setOwnedCourses([])
        localStorage.clear();
        navigate('/')
    };

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
        logout,
        contactInfor,
        setContactInfor,
        activeCourses,
        inactiveCourses,
        fetchUserCourses,
        topicWithWord,
        setTopicWithWord,
        memorizeWord,
        publicTopics,
        setPublicTopics,
        fetchOwnedTopics
    }

    // if (!isLoaded) {
    //     return <div>Loading...</div>; // chờ localStorage load xong
    // }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider