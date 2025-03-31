import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, SearchIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import TaskCard from "@/components/task-card";
import AddTaskDialog from "@/components/add-task-dialog";
import { Task } from "@shared/schema";

export default function GroupTasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | undefined>(undefined);
  
  // Fetch group tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['/api/tasks/group'],
  });
  
  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setAddTaskOpen(true);
  };
  
  // Filter tasks based on search query and active tab
  const filteredTasks = tasks?.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeTab === "completed") {
      return matchesSearch && task.is_completed;
    } else if (activeTab === "pending") {
      return matchesSearch && !task.is_completed;
    }
    
    return matchesSearch;
  }) || [];
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Group Tasks</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Input
              placeholder="Search group tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 pr-10"
            />
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
          </div>
          
          <Button
            className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            onClick={() => {
              setEditTask(undefined);
              setAddTaskOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Group Task
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full bg-zinc-800" />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEditTask}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-800 p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-zinc-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">No group tasks found</h3>
          <p className="text-zinc-400 mb-4">
            {searchQuery 
              ? "No group tasks match your search criteria."
              : activeTab === "completed"
                ? "You haven't completed any group tasks yet."
                : activeTab === "pending"
                  ? "You don't have any pending group tasks."
                  : "You don't have any group tasks yet."}
          </p>
          <Button
            onClick={() => {
              setEditTask(undefined);
              setAddTaskOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Create Group Task
          </Button>
        </Card>
      )}
      
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        editTask={editTask}
      />
    </div>
  );
}
