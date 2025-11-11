import React, { useState, useContext, useEffect } from 'react'
import './ContactInformationManagement.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ContactInformationManagement = () => {

    const [newBranch, setNewBranch] = useState("")
    const [newLink, setNewLink] = useState({
        webName: "",
        link: ""
    })

    const { contactInfor, setContactInfor, url, token } = useContext(StoreContext)

    const [infor, setInfor] = useState({
        name: "",
        description: "",
        address: "",
        branches: [],
        phoneContact: "",
        emailContact: "",
        links: []
    })

    const handleOnChange = (e) => {
        const { name, value } = e.target
        setInfor(prev => ({ ...prev, [name]: value }))
    }

    const handleAddBranch = () => {
        if (!newBranch.trim()) return
        setInfor(prev => ({ ...prev, branches: [...prev.branches, newBranch.trim()] }))
        setNewBranch("")
    }

    const handleDeleteBranch = (index) => {
        setInfor(prev => ({
            ...prev,
            branches: prev.branches.filter((_, i) => i !== index)
        }))
    }

    const handleNewLinkChange = (e) => {
        const { name, value } = e.target
        setNewLink(prev => ({ ...prev, [name]: value }))
    }

    const handleAddLink = () => {
        if (!newLink.webName.trim() || !newLink.link.trim()) return
        setInfor(prev => ({
            ...prev,
            links: [...prev.links, {
                webName: newLink.webName.trim(),
                link: newLink.link.trim()
            }]
        }))
        setNewLink({
            webName: "",
            link: ""
        })
    }

    const handleDeleteLink = (index) => {
        setInfor(prev => ({
            ...prev,
            links: prev.links.filter((_, i) => i !== index)
        }))
    }

    const handleUpdate = async () => {
        try {
            const formData = new FormData();

            // formData.append("name", infor.name);
            // formData.append("description", infor.description);
            // formData.append("address", infor.address);
            // formData.append("phoneContact", infor.phoneContact);
            // formData.append("emailContact", infor.emailContact);
            // formData.append("branches", JSON.stringify(infor.branches));
            // formData.append("links", JSON.stringify(infor.links))

            const res = await axios.post(`${url}/api/contactInfor/updateContactInfor`, infor, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (res.data.success) {
                toast.success("Cập nhật thông tin thành công")
            } else {
                toast.error("Cập nhật thất bại")
            }
        } catch (error) {
            console.error("Error updating contact info:", error)
            toast.error("Lỗi khi cập nhật thông tin")
        }
    }

    useEffect(() => {
        setInfor({
            name: contactInfor.name || "",
            description: contactInfor.description || "",
            address: contactInfor.address || "",
            branches: contactInfor.branches || [],
            phoneContact: contactInfor.phoneContact || "",
            emailContact: contactInfor.emailContact || "",
            links: contactInfor.links || []
        })
    }, [contactInfor])

    return (
        <div className='contact-container'>
            <div className='contact-left'>
                <div className='name-web'>
                    <p>Name:</p>
                    <input
                        type='text'
                        name='name'
                        value={infor.name}
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className='desc-web'>
                    <p>Description:</p>
                    <textarea
                        name="description"
                        value={infor.description}
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className='address-contact'>
                    <p>Address:</p>
                    <input
                        type="text"
                        name="address"
                        value={infor.address}
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className='phone-contact'>
                    <p>Phone:</p>
                    <input
                        type="text"
                        name="phoneContact"
                        value={infor.phoneContact}
                        onChange={handleOnChange}
                        required
                    />
                </div>

                <div className='email-contact'>
                    <p>Email:</p>
                    <input
                        type='email'
                        name='emailContact'
                        value={infor.emailContact}
                        onChange={handleOnChange}
                        required
                    />
                </div>
            </div>
            <div className='contact-right'>
                <div className='branch-list'>
                    <p>Branches</p>
                    <div className='add-branch'>
                        <p>New branch:</p>
                        <input
                            type="text"
                            name="branch"
                            value={newBranch}
                            onChange={(e) => setNewBranch(e.target.value)}
                        />
                        <button className='add-branch-btn' onClick={handleAddBranch}>Add</button>
                    </div>

                    {infor.branches.map((branch, i) => (
                        <div className='branch-item' key={i}>
                            <p>Branch {i + 1}: {branch}</p>
                            <p className='delete-branch' onClick={() => handleDeleteBranch(i)}>X</p>
                        </div>
                    ))}
                </div>

                <div className='link-list'>
                    <p>Links</p>
                    <div className='add-link'>
                        <p>New link:</p>
                        <input
                            type='text'
                            name='webName'
                            placeholder='Website name'
                            value={newLink.webName}
                            onChange={handleNewLinkChange}
                        />
                        <input
                            type="text"
                            name="link"
                            placeholder='URL'
                            value={newLink.link}
                            onChange={handleNewLinkChange}
                        />
                        <button className='add-link-btn' onClick={handleAddLink}>Add</button>
                    </div>

                    {infor.links.map((link, i) => (
                        <div className='link-item' key={i}>
                            <p>{link.webName}: {link.link}</p>
                            <p className='delete-link' onClick={() => handleDeleteLink(i)}>X</p>
                        </div>
                    ))}
                </div>
                <button className='save-contact' onClick={handleUpdate}>Save</button>
            </div>
        </div>
    )
}

export default ContactInformationManagement
