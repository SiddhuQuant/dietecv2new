import { Shield, Users, BarChart3, LogOut, Settings, AlertTriangle, CheckCircle, Trash2, Plus, RefreshCw, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ThemeToggle } from "./ThemeToggle";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import { adminService, User } from "../services/adminService";

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
  adminName: string;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

interface SystemMetric {
  label: string;
  value: string | number;
  change: number;
}

export function AdminDashboard({ adminName, onLogout, isDarkMode, onToggleTheme }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0, total: 0 });

  useEffect(() => {
    loadUsers();
    loadMetrics();
    loadRevenue();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await adminService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadMetrics = async () => {
    try {
      const metricsData = await adminService.getMetrics();
      setMetrics([
        { label: "Total Users", value: metricsData.totalUsers, change: 12 },
        { label: "Active Doctors", value: metricsData.activeDoctors, change: 3 },
        { label: "Active Patients", value: metricsData.activePatients, change: 9 },
        { label: "Total Bookings", value: metricsData.totalBookings, change: 28 }
      ]);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const loadRevenue = async () => {
    try {
      const revenueData = await adminService.getRevenue();
      setRevenue(revenueData);
    } catch (err) {
      console.error('Error loading revenue:', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 12
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
      case "doctor":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
      case "patient":
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "inactive":
        return "text-yellow-600 dark:text-yellow-400";
      case "suspended":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await adminService.deleteUser(userId);
    loadUsers();
    loadMetrics();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
    }`}>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 backdrop-blur-lg border-b transition-colors ${
          isDarkMode ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-blue-100"
        }`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                System Administrator - {adminName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle isDarkMode={isDarkMode} onToggle={onToggleTheme} />
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Metrics */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {metrics.map((metric, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className={`p-6 border-0 ${isDarkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
                <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                  {metric.label}
                </p>
                <p className="text-3xl font-bold mt-2">{metric.value}</p>
                <p className={`text-xs mt-2 ${metric.change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {metric.change > 0 ? "+" : ""}{metric.change}% from last month
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* User Management */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              User Management
            </h2>
            <Button className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          </div>

          <Card className={`border-0 overflow-hidden ${isDarkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDarkMode ? "border-slate-700" : "border-blue-100"}`}>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Join Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`border-b transition-colors hover:bg-opacity-50 ${
                        isDarkMode ? "border-slate-700 hover:bg-slate-700/20" : "border-blue-100 hover:bg-blue-50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">{user.name}</td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                        {user.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                        {user.joinDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 text-sm font-medium ${getStatusColor(user.status)}`}>
                          {user.status === "active" && <CheckCircle className="w-4 h-4" />}
                          {user.status === "suspended" && <AlertTriangle className="w-4 h-4" />}
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* System Overview */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"
        >
          <motion.div variants={itemVariants}>
            <Card className={`p-6 border-0 ${isDarkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                System Status
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Database Status</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Healthy
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>Server Health</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Running
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDarkMode ? "text-slate-400" : "text-gray-600"}>API Response</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> 95ms
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className={`p-6 border-0 ${isDarkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Recent Alerts
              </h3>
              <div className="space-y-3 text-sm">
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-yellow-900/20" : "bg-yellow-50"}`}>
                  <p className="font-medium">High server load detected</p>
                  <p className={`text-xs ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>5 minutes ago</p>
                </div>
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-blue-900/20" : "bg-blue-50"}`}>
                  <p className="font-medium">Database backup completed</p>
                  <p className={`text-xs ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>1 hour ago</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Revenue & Analytics */}
        <motion.div variants={itemVariants} className="mt-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <BarChart3 className="w-6 h-6" />
            Revenue Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Today", value: `₹${revenue.today.toLocaleString()}`, change: "+8%", color: "blue" },
              { label: "This Week", value: `₹${revenue.week.toLocaleString()}`, change: "+12%", color: "green" },
              { label: "This Month", value: `₹${revenue.month.toLocaleString()}`, change: "+15%", color: "purple" },
              { label: "Total Revenue", value: `₹${revenue.total.toLocaleString()}`, change: "+22%", color: "orange" }
            ].map((stat, index) => (
              <Card key={index} className={`p-4 border-0 ${isDarkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
                <p className={`text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div variants={itemVariants} className="mt-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
            <Clock className="w-6 h-6" />
            Recent Activity Log
          </h2>
          <Card className={`border-0 ${isDarkMode ? "bg-slate-800/50" : "bg-white/50"}`}>
            <div className="p-6 space-y-4">
              {[
                { user: "Dr. Sarah Smith", action: "Updated patient records", time: "2 minutes ago", type: "update" },
                { user: "John Doe (Patient)", action: "Booked new appointment", time: "15 minutes ago", type: "booking" },
                { user: "Admin Mike", action: "Added new doctor account", time: "1 hour ago", type: "admin" },
                { user: "Jane Doe (Patient)", action: "Completed payment", time: "2 hours ago", type: "payment" },
                { user: "Dr. Mike Wilson", action: "Prescribed medication", time: "3 hours ago", type: "update" }
              ].map((activity, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDarkMode ? "bg-slate-700/30" : "bg-blue-50/50"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activity.type === "admin" ? "bg-red-500" :
                      activity.type === "booking" ? "bg-blue-500" :
                      activity.type === "payment" ? "bg-green-500" : "bg-purple-500"
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{activity.user}</p>
                      <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                        {activity.action}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
