import React, { useState, useMemo } from "react";
import { Activity, ActivityCategory } from "../types";
import { calculateFootprint } from "../services/carbonService";
import Card from "./ui/Card";
import Button from "./ui/Button";
import { activityOptions, COLORS, CATEGORY_ICONS } from "../constants";
import { format, startOfDay, endOfDay, isValid } from "date-fns";

interface ActivityLogProps {
  onAddActivity: (activity: Activity) => void;
  activities: Activity[];
}

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  const Icon = CATEGORY_ICONS[activity.category];
  const color = COLORS[activity.category];

  return (
    <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex-shrink-0 mr-4">
        {/* FIX: The Icon component does not accept a 'style' prop. The color is passed to the parent div and inherited by the icon via 'currentColor'. */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-2 items-center text-sm">
        <div className="sm:col-span-2">
          <p className="font-semibold text-gray-800 dark:text-gray-200">
            {activity.description}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(activity.date), "MMM d, yyyy")}
          </p>
        </div>
        <div className="text-right sm:text-left">
          <p className="font-bold">{activity.co2e.toFixed(2)} kg</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">CO₂e</p>
        </div>
        <div className="text-right sm:text-left">
          <p className="font-bold text-green-600">+{activity.ecoPoints}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">EcoPoints</p>
        </div>
      </div>
    </div>
  );
};

const ActivityLog: React.FC<ActivityLogProps> = ({
  onAddActivity,
  activities,
}) => {
  const [category, setCategory] = useState<ActivityCategory>(
    ActivityCategory.Transportation
  );
  const [type, setType] = useState(activityOptions[category][0].value);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as ActivityCategory;
    setCategory(newCategory);
    setType(activityOptions[newCategory][0].value);
    setValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || parseFloat(value) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const { description, co2e, ecoPoints } = calculateFootprint(
      category,
      type,
      parseFloat(value)
    );

    const newActivity: Activity = {
      id: new Date().toISOString(),
      category,
      description,
      co2e,
      date: new Date(date).toISOString(),
      ecoPoints,
    };

    onAddActivity(newActivity);
    setValue("");
  };

  const filteredAndSortedActivities = useMemo(() => {
    let filtered = [...activities];

    if (filterCategory !== "all") {
      filtered = filtered.filter((a) => a.category === filterCategory);
    }

    const startDate = filterStartDate
      ? startOfDay(new Date(filterStartDate))
      : null;
    const endDate = filterEndDate ? endOfDay(new Date(filterEndDate)) : null;

    if (startDate && isValid(startDate)) {
      filtered = filtered.filter((a) => new Date(a.date) >= startDate);
    }
    if (endDate && isValid(endDate)) {
      filtered = filtered.filter((a) => new Date(a.date) <= endDate);
    }

    switch (sortBy) {
      case "date-asc":
        filtered.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        break;
      case "co2e-desc":
        filtered.sort((a, b) => b.co2e - a.co2e);
        break;
      case "co2e-asc":
        filtered.sort((a, b) => a.co2e - b.co2e);
        break;
      case "date-desc":
      default:
        filtered.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        break;
    }

    return filtered;
  }, [activities, filterCategory, filterStartDate, filterEndDate, sortBy]);

  const currentUnit =
    activityOptions[category].find((opt) => opt.value === type)?.unit || "";
  const inputStyle =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const labelStyle =
    "block text-sm font-medium text-gray-700 dark:text-gray-300";
  const selectStyle =
    "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Activity Log</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky lg:top-8">
          <Card>
            <h2 className="text-xl font-bold mb-1">Add New Activity</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">
              Track your daily activities and earn EcoPoints!
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="date" className={labelStyle}>
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <label htmlFor="category" className={labelStyle}>
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={handleCategoryChange}
                  className={selectStyle}
                >
                  {Object.values(ActivityCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="type" className={labelStyle}>
                  Activity Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={selectStyle}
                >
                  {activityOptions[category].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="value" className={labelStyle}>
                  Amount ({currentUnit})
                </label>
                <input
                  type="number"
                  id="value"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Enter ${currentUnit}`}
                  min="0.1"
                  step="0.1"
                  className={inputStyle}
                  required
                />
              </div>
              <div>
                <Button type="submit" className="w-full">
                  Add Activity
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-bold mb-4">Activity History</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
              <div>
                <label
                  htmlFor="filter-category"
                  className="block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Category
                </label>
                <select
                  id="filter-category"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={selectStyle + " text-sm"}
                >
                  <option value="all">All</option>
                  {Object.values(ActivityCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label
                  htmlFor="sort-by"
                  className="block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Sort By
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={selectStyle + " text-sm"}
                >
                  <option value="date-desc">Newest</option>
                  <option value="date-asc">Oldest</option>
                  <option value="co2e-desc">CO2e (High-Low)</option>
                  <option value="co2e-asc">CO2e (Low-High)</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className={inputStyle + " text-sm py-2"}
                />
              </div>
              <div>
                <label
                  htmlFor="end-date"
                  className="block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className={inputStyle + " text-sm py-2"}
                />
              </div>
            </div>
            <div className="space-y-3">
              {filteredAndSortedActivities.length > 0 ? (
                filteredAndSortedActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">
                    No activities match your filters.
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Try adjusting your search or logging a new activity.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
