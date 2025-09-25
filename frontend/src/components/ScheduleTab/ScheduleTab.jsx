import { useState, useEffect } from "react";
import Calendar from 'react-calendar';
import TimePicker from 'react-time-picker';
import { Clock, Calendar as CalendarIcon, Save, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

import api from '../../config/ApiConfig';

import 'react-calendar/dist/Calendar.css';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import './ScheduleTab.css';

const ScheduleTab = () => {
    const [scheduleType, setScheduleType] = useState('disabled'); // 'disabled', 'daily', 'weekly', 'monthly', 'custom'
    const [selectedTime, setSelectedTime] = useState('02:00');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedDays, setSelectedDays] = useState([1]); // Monday = 1, Sunday = 0
    const [customCron, setCustomCron] = useState('');
    
    const [currentSchedule, setCurrentSchedule] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        (async () => {
            await fetchCurrentSchedule();
        })();
    }, []);

    const fetchCurrentSchedule = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/backup/schedule');
            const { cronExpression, enabled, isScheduled } = response.data;
            setCurrentSchedule({ cronExpression, enabled, isScheduled });
            
            if (cronExpression === 'DISABLED' || !enabled) {
                setScheduleType('disabled');
            } else {
                // Try to parse the CRON expression to set UI state
                parseCronToUI(cronExpression);
            }
        } catch (err) {
            setError('Failed to load current schedule: ' + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    const parseCronToUI = (cronExpression) => {
        // This is a simplified parser for common CRON patterns
        // Format: "0 minute hour * * day-of-week" or "0 minute hour day-of-month month *"
        try {
            const parts = cronExpression.split(' ');
            if (parts.length >= 6) {
                const minute = parts[1];
                const hour = parts[2];
                const dayOfMonth = parts[3];
                const month = parts[4];
                const dayOfWeek = parts[5];

                const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
                setSelectedTime(time);

                if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
                    // Weekly schedule
                    if (dayOfWeek === '*') {
                        setScheduleType('daily');
                    } else {
                        setScheduleType('weekly');
                        const days = dayOfWeek.split(',').map(d => parseInt(d) === 0 ? 7 : parseInt(d));
                        setSelectedDays(days);
                    }
                } else if (dayOfWeek === '*' && dayOfMonth !== '*' && month === '*') {
                    // Monthly schedule
                    setScheduleType('monthly');
                    const date = new Date();
                    date.setDate(parseInt(dayOfMonth));
                    setSelectedDate(date);
                } else {
                    // Custom or complex schedule
                    setScheduleType('custom');
                    setCustomCron(cronExpression);
                }
            } else {
                setScheduleType('custom');
                setCustomCron(cronExpression);
            }
        } catch (e) {
            setScheduleType('custom');
            setCustomCron(cronExpression);
        }
    };

    const generateCronExpression = () => {
        const [hour, minute] = selectedTime.split(':');
        
        switch (scheduleType) {
            case 'disabled':
                return 'DISABLED';
            case 'daily':
                return `0 ${minute} ${hour} * * *`;
            case 'weekly':
                const cronDays = selectedDays.map(d => d === 7 ? 0 : d).join(',');
                return `0 ${minute} ${hour} * * ${cronDays}`;
            case 'monthly':
                const dayOfMonth = selectedDate.getDate();
                return `0 ${minute} ${hour} ${dayOfMonth} * *`;
            case 'custom':
                return customCron;
            default:
                return 'DISABLED';
        }
    };

    const validateSchedule = () => {
        if (scheduleType === 'disabled') return true;
        
        if (scheduleType === 'custom') {
            if (!customCron.trim()) {
                setError('Custom CRON expression is required');
                return false;
            }
        }

        if (scheduleType === 'weekly' && selectedDays.length === 0) {
            setError('At least one day must be selected for weekly schedule');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateSchedule()) return;

        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const cronExpression = generateCronExpression();
            await api.post('/api/backup/schedule', { cronExpression });
            
            setMessage(scheduleType === 'disabled' ? 
                'Backup schedule disabled successfully' : 
                'Backup schedule updated successfully'
            );
            
            await fetchCurrentSchedule(); // Refresh current schedule
        } catch (err) {
            setError('Failed to update schedule: ' + (err.response?.data || err.message));
        } finally {
            setSaving(false);
            setTimeout(() => { setMessage(null); setError(null); }, 4000);
        }
    };

    const handleDisable = async () => {
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            await api.post('/api/backup/schedule/disable');
            setMessage('Backup schedule disabled successfully');
            setScheduleType('disabled');
            await fetchCurrentSchedule();
        } catch (err) {
            setError('Failed to disable schedule: ' + (err.response?.data || err.message));
        } finally {
            setSaving(false);
            setTimeout(() => { setMessage(null); setError(null); }, 4000);
        }
    };

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day].sort());
        }
    };

    if (loading) return <div className="text-center py-4"><p>Loading schedule...</p></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-700">Backup Schedule</h3>
                {currentSchedule && (
                    <div className="text-sm text-gray-500">
                        Status: <span className={`font-medium ${currentSchedule.enabled ? 'text-green-600' : 'text-red-600'}`}>
                            {currentSchedule.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        {currentSchedule.enabled && (
                            <span className="ml-2">
                                ({currentSchedule.isScheduled ? 'Active' : 'Pending'})
                            </span>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-100 text-red-700 flex items-center">
                    <AlertCircle size={20} className="mr-2 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {message && (
                <div className="p-4 rounded-md bg-green-100 text-green-700 flex items-center">
                    <CheckCircle2 size={20} className="mr-2 shrink-0" />
                    <span>{message}</span>
                </div>
            )}

            {currentSchedule && currentSchedule.enabled && (
                <div className="p-4 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                        <strong>Current Schedule:</strong> {currentSchedule.cronExpression}
                    </p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
                    <select
                        value={scheduleType}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="disabled">Disabled</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom CRON</option>
                    </select>
                </div>

                {scheduleType !== 'disabled' && scheduleType !== 'custom' && (
                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Clock size={16} className="inline mr-1" />
                                Time
                            </label>
                            <TimePicker
                                value={selectedTime}
                                onChange={setSelectedTime}
                                disableClock={true}
                                className="border border-gray-300 rounded-md"
                                clearIcon={null}
                                clockIcon={null}
                            />
                        </div>
                    </div>
                )}

                {scheduleType === 'weekly' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                        <div className="flex flex-wrap gap-2">
                            {dayNames.map((day, index) => {
                                const dayValue = index === 0 ? 7 : index; // Convert Sunday from 0 to 7
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(dayValue)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                            selectedDays.includes(dayValue)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Select at least one day. Minimum backup interval is 5 minutes.
                        </p>
                    </div>
                )}

                {scheduleType === 'monthly' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <CalendarIcon size={16} className="inline mr-1" />
                            Select Day of Month
                        </label>
                        <Calendar
                            onChange={setSelectedDate}
                            value={selectedDate}
                            view="month"
                            maxDetail="month"
                            className="border border-gray-300 rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Backup will run on day {selectedDate.getDate()} of every month at {selectedTime}
                        </p>
                    </div>
                )}

                {scheduleType === 'custom' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Custom CRON Expression
                        </label>
                        <input
                            type="text"
                            value={customCron}
                            onChange={(e) => setCustomCron(e.target.value)}
                            placeholder="0 2 * * * (every day at 2:00 AM)"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Format: "second minute hour day month day-of-week".
                            <a href="https://spring.io/blog/2020/11/10/new-in-spring-5-3-improved-cron-expressions"
                               target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                Learn more about CRON expressions
                            </a>
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                            ⚠️ Minimum backup interval is 5 minutes. Shorter intervals will be rejected.
                        </p>
                    </div>
                )}

                {scheduleType !== 'disabled' && (
                    <div className="p-4 bg-yellow-50 rounded-md">
                        <p className="text-sm text-yellow-700">
                            <strong>Preview:</strong> {generateCronExpression()}
                        </p>
                        {scheduleType === 'daily' && (
                            <p className="text-xs text-yellow-600 mt-1">
                                Backup will run every day at {selectedTime}
                            </p>
                        )}
                        {scheduleType === 'weekly' && selectedDays.length > 0 && (
                            <p className="text-xs text-yellow-600 mt-1">
                                Backup will run on {selectedDays.map(d => dayNames[d === 7 ? 0 : d]).join(', ')} at {selectedTime}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex space-x-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                    <Save size={16} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Schedule'}
                </button>

                {scheduleType !== 'disabled' && (
                    <button
                        onClick={handleDisable}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Disable Schedule
                    </button>
                )}
            </div>

            <div className="text-sm text-gray-500 space-y-1">
                <p><strong>Important Notes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Minimum backup interval is 5 minutes</li>
                    <li>Scheduled backups will create automatic database snapshots</li>
                    <li>Manual backups can still be performed regardless of schedule</li>
                    <li>Schedule changes take effect immediately</li>
                    <li>Server timezone is used for scheduling</li>
                </ul>
            </div>
        </div>
    );
};

export default ScheduleTab;