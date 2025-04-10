import { Link } from "react-router-dom"
import styles from "./UserManagement.module.css"
import {
    LayoutGrid,
    Users,
    FolderKanban,
    UserCog,
    ShieldCheck,
    Settings,
    BarChart3,
    ClipboardList,
    Search,
    ChevronLeft,
    ChevronRight,
    PenLine,
    Trash2,
    Plus,
} from "lucide-react"

const UserManagement = () => {
    return (
        <div className={styles.userManagementPage}>
            <div className={styles.sidebar}>
                <div className={styles.logo}>
                    <h1>
                        IO<span>CONNECT</span>
                    </h1>
                </div>

                <nav className={styles.navigation}>
                    <div className={styles.navSection}>
                        <h2>MAIN</h2>
                        <ul>
                            <li>
                                <Link to="/dashboard">
                                    <LayoutGrid size={18} />
                                    <span>Dashboard</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/users">
                                    <Users size={18} />
                                    <span>Users</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/projects">
                                    <FolderKanban size={18} />
                                    <span>Projects</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.navSection}>
                        <h2>ADMINISTRATION</h2>
                        <ul>
                            <li className={styles.active}>
                                <Link to="/user-management">
                                    <UserCog size={18} />
                                    <span>User Management</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/roles">
                                    <ShieldCheck size={18} />
                                    <span>Roles & Permissions</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/settings">
                                    <Settings size={18} />
                                    <span>Settings</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className={styles.navSection}>
                        <h2>REPORTS</h2>
                        <ul>
                            <li>
                                <Link to="/analytics">
                                    <BarChart3 size={18} />
                                    <span>Analytics</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/audit-logs">
                                    <ClipboardList size={18} />
                                    <span>Audit Logs</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.userAvatar}>
                        <span>AD</span>
                    </div>
                    <div className={styles.userInfo}>
                        <h3>Admin User</h3>
                        <p>Administrator</p>
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.pageHeader}>
                    <h1>User Management</h1>
                    <p>
                        Manage user accounts and control access by assigning appropriate roles. Role-Based Access Control (RBAC)
                        allows you to define permissions based on user roles.
                    </p>
                </div>

                <div className={styles.usersSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Users</h2>
                        <button className={styles.addUserBtn}>
                            <Plus size={16} />
                            <span>Add User</span>
                        </button>
                    </div>

                    <div className={styles.tableControls}>
                        <div className={styles.searchBar}>
                            <Search size={16} />
                            <input type="text" placeholder="Search users..." />
                        </div>
                        <div className={styles.filters}>
                            <select className={styles.filterSelect}>
                                <option>All Roles</option>
                                <option>Admin</option>
                                <option>Manager</option>
                                <option>User</option>
                                <option>Guest</option>
                            </select>
                            <select className={styles.filterSelect}>
                                <option>All Status</option>
                                <option>Active</option>
                                <option>Inactive</option>
                                <option>Pending</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.usersTable}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Current Role</th>
                                    <th>Assign Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>John Doe</td>
                                    <td>john.doe@ioconnect.com</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
                                    </td>
                                    <td>Admin</td>
                                    <td>
                                        <select className={styles.roleSelect}>
                                            <option>Admin</option>
                                            <option>Manager</option>
                                            <option>User</option>
                                            <option>Guest</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.editBtn}>
                                                <PenLine size={16} />
                                            </button>
                                            <button className={styles.deleteBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Jane Smith</td>
                                    <td>jane.smith@ioconnect.com</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
                                    </td>
                                    <td>Manager</td>
                                    <td>
                                        <select className={styles.roleSelect}>
                                            <option>Manager</option>
                                            <option>Admin</option>
                                            <option>User</option>
                                            <option>Guest</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.editBtn}>
                                                <PenLine size={16} />
                                            </button>
                                            <button className={styles.deleteBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Robert Johnson</td>
                                    <td>robert.johnson@ioconnect.com</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles.statusInactive}`}>Inactive</span>
                                    </td>
                                    <td>User</td>
                                    <td>
                                        <select className={styles.roleSelect}>
                                            <option>User</option>
                                            <option>Admin</option>
                                            <option>Manager</option>
                                            <option>Guest</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.editBtn}>
                                                <PenLine size={16} />
                                            </button>
                                            <button className={styles.deleteBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Emily Davis</td>
                                    <td>emily.davis@ioconnect.com</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pending</span>
                                    </td>
                                    <td>Guest</td>
                                    <td>
                                        <select className={styles.roleSelect}>
                                            <option>Guest</option>
                                            <option>Admin</option>
                                            <option>Manager</option>
                                            <option>User</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.editBtn}>
                                                <PenLine size={16} />
                                            </button>
                                            <button className={styles.deleteBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Michael Wilson</td>
                                    <td>michael.wilson@ioconnect.com</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles.statusActive}`}>Active</span>
                                    </td>
                                    <td>User</td>
                                    <td>
                                        <select className={styles.roleSelect}>
                                            <option>User</option>
                                            <option>Admin</option>
                                            <option>Manager</option>
                                            <option>Guest</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className={styles.actionButtons}>
                                            <button className={styles.editBtn}>
                                                <PenLine size={16} />
                                            </button>
                                            <button className={styles.deleteBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className={styles.tablePagination}>
                        <div className={styles.paginationInfo}>
                            <span>Showing 1 to 5 of 12 entries</span>
                        </div>
                        <div className={styles.paginationControls}>
                            <button className={styles.paginationBtn} disabled>
                                <ChevronLeft size={16} />
                            </button>
                            <button className={`${styles.paginationBtn} ${styles.active}`}>1</button>
                            <button className={styles.paginationBtn}>2</button>
                            <button className={styles.paginationBtn}>3</button>
                            <button className={styles.paginationBtn}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserManagement
