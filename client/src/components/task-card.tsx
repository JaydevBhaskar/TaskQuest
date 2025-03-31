import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Clock, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { calculateTaskProgress, getXpColor, formatDate } from "@/lib/utils";
import { Task } from "@shared/schema";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  
  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/tasks/${task.id}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/group'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    }
  });
  
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/group'] });
    }
  });
  
  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      const res = await apiRequest('POST', `/api/tasks/${task.id}/progress`, { progress });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/group'] });
    }
  });
  
  const progress = calculateTaskProgress(task);
  const circumference = 2 * Math.PI * 10; // Circle with r=10
  const dashoffset = circumference - (progress / 100) * circumference;
  
  const handleClick = () => {
    if (!task.is_completed) {
      if (progress < 100) {
        updateProgressMutation.mutate(task.progress + 25);
      } else {
        completeTaskMutation.mutate();
      }
    }
  };
  
  return (
    <div 
      className="bg-zinc-800 rounded-lg p-4 flex items-center justify-between hover:bg-zinc-700 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center" onClick={handleClick} style={{ cursor: task.is_completed ? 'default' : 'pointer' }}>
        <div className="relative w-6 h-6 mr-4 flex-shrink-0">
          <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#333" strokeWidth="2.5" />
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              fill="none" 
              stroke="#1DB954" 
              strokeWidth="2.5" 
              strokeDasharray={circumference} 
              strokeDashoffset={dashoffset} 
              strokeLinecap="round"
            />
            {task.is_completed && (
              <g>
                <circle cx="12" cy="12" r="4" fill="#1DB954" />
              </g>
            )}
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-white">{task.title}</h3>
          <div className="flex items-center text-xs text-zinc-400 mt-1">
            <span className={`${getXpColor(task.xp_reward)} px-2 py-0.5 rounded-full mr-2`}>
              +{task.xp_reward} XP
            </span>
            {task.due_date && (
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(task.due_date)}
              </span>
            )}
            {task.is_group_task && (
              <span className="ml-2 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                Team
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className={`flex space-x-2 ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-100'} transition-opacity`}>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-600"
          onClick={() => onEdit(task)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-600"
          onClick={() => {
            if (confirm('Are you sure you want to delete this task?')) {
              deleteTaskMutation.mutate();
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
