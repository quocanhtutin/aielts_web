import React, { useContext, useEffect, useState } from "react";
import "./AccountManagement.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext.jsx";
import AddAdminPopup from "../../components/AddAdminPopup/AddAdminPopup.jsx";
import UserDetailPopup from "../../components/UserDetailPopup/UserDetailPopup.jsx";

const AccountManagement = () => {
  const { url, token } = useContext(StoreContext);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [showUserDetail, setShowUserDetail] = useState(false)


  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${url}/api/admin/listUsers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        const data = res.data.data;
        setUsers(data.filter(u => u.role === "user"));
        setAdmins(data.filter(u => u.role === "admin"));
      }
    } catch (err) {
      toast.error("Lỗi tải danh sách người dùng");
      
    }
  };

  const deactivateUser = async (id) => {
    if (!window.confirm("Bạn có chắc muốn vô hiệu hóa tài khoản này?")) return;
    try {
      const res = await axios.post(`${url}/api/admin/deactivateUser`, { userId: id }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        toast.success("Đã vô hiệu hóa tài khoản");
        fetchAllUsers();
      }
    } catch (err) {
      toast.error("Lỗi khi vô hiệu hóa");
    }
  };

  const activateUser = async (id) => {
    if (!window.confirm("Bạn có chắc muốn kích hoạt tài khoản này?")) return;
    try {
      const res = await axios.post(`${url}/api/admin/activateUser`, { userId: id }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.success) {
        toast.success("Đã kích hoạt tài khoản");
        fetchAllUsers();
      }
    } catch (err) {
      toast.error("Lỗi kích hoạt hóa");
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return (
    <div className="account-management">
      <div className="user-section">
        <div className="section-header">
          <h3>Danh sách người dùng</h3>
          <p className="show-inactive-user" onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? "Ẩn user bị vô hiệu hóa" : "Hiện user bị vô hiệu hóa"}
          </p>
        </div>

        <div className="list-table">
          <div className="list-table-format-user title-user">
            <b>Họ tên</b>
            <b>Email</b>
            <b>Số điện thoại</b>
            <b>Ngày tạo</b>
            <b>Khác</b>
          </div>
          {users
            .filter((u) => (showInactive ? true : u.isActive))
            .sort((a, b) => (b.isActive ? 1 : -1))
            .map((item, index) => (
              <div key={index} className={`list-table-format-user ${!item.isActive ? "inactive" : ""}`}>
                <p>{item.name}</p>
                <p>{item.email}</p>
                <p>{item.phone}</p>
                <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                <div className="actions">
                  {item.isActive ?
                    <div>
                      <button className="detail-btn" onClick={() => { setSelectedUserId(item._id); setShowUserDetail(true) }}>Chi tiết</button>
                      <button className="deactivate-btn" onClick={() => deactivateUser(item._id)}>
                        Vô hiệu hóa
                      </button>
                    </div> :
                    <button className="deactivate-btn" onClick={() => activateUser(item._id)}>
                      Kích hoạt
                    </button>
                  }
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h3>Danh sách Admin</h3>
          <button onClick={() => setShowAddAdmin(true)}>+ Thêm Admin</button>
        </div>

        <div className="list-table">
          <div className="list-table-format-user title-user">
            <b>Họ tên</b>
            <b>Email</b>
            <b>Số điện thoại</b>
            <b>Ngày tạo</b>
            <b>Khác</b>
          </div>
          {admins
            .filter((u) => (showInactive ? true : u.isActive))
            .sort((a, b) => (b.isActive ? 1 : -1))
            .map((item, index) => (
              <div key={index} className={`list-table-format-user ${!item.isActive ? "inactive" : ""}`}>
                <p>{item.name}</p>
                <p>{item.email}</p>
                <p>{item.phone}</p>
                <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                <div className="actions">
                  {item.isActive ?
                    <button className="deactivate-btn" onClick={() => deactivateUser(item._id)}>
                      Vô hiệu hóa
                    </button> :
                    <button className="deactivate-btn" onClick={() => activateUser(item._id)}>
                      Kích hoạt
                    </button>
                  }
                </div>
              </div>
            ))}
        </div>
      </div>

      {showAddAdmin && (
        <AddAdminPopup
          onClose={() => setShowAddAdmin(false)}
          onAdded={() => {
            setShowAddAdmin(false);
            fetchAllUsers();
          }}
        />
      )}
      {showUserDetail && (
        <UserDetailPopup
          userId={selectedUserId}
          onClose={() => setShowUserDetail(false)}
          onUpdated={fetchAllUsers}
        />
      )}

    </div>
  );
};

export default AccountManagement;
