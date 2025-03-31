import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Task } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  xp_reward: z.number().min(10).max(100),
  is_group_task: z.boolean().default(false),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask?: Task;
}

export default function AddTaskDialog({
  open,
  onOpenChange,
  editTask,
}: AddTaskDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [points, setPoints] = useState(editTask?.xp_reward || 30);
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: editTask?.title || "",
      description: editTask?.description || "",
      due_date: editTask?.due_date 
        ? new Date(editTask.due_date).toISOString().split('T')[0] 
        : "",
      due_time: editTask?.due_date 
        ? new Date(editTask.due_date).toTimeString().split(' ')[0].slice(0, 5) 
        : "",
      xp_reward: editTask?.xp_reward || 30,
      is_group_task: editTask?.is_group_task || false,
    },
  });
  
  const createTaskMutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      // Combine date and time
      let dueDate = null;
      if (values.due_date) {
        dueDate = new Date(`${values.due_date}T${values.due_time || '00:00'}`);
      }
      
      const taskData = {
        title: values.title,
        description: values.description,
        due_date: dueDate,
        xp_reward: values.xp_reward,
        is_group_task: values.is_group_task,
      };
      
      if (editTask) {
        const res = await apiRequest('PATCH', `/api/tasks/${editTask.id}`, taskData);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/tasks', taskData);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/group'] });
      toast({
        title: editTask ? "Task updated" : "Task created",
        description: editTask 
          ? "Your task has been updated successfully"
          : "Your new task has been created",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editTask ? 'update' : 'create'} task: ${error}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: TaskFormValues) => {
    createTaskMutation.mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editTask ? "Edit Task" : "Add New Task"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter task title" 
                      className="bg-zinc-800 border-zinc-700" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description" 
                      className="bg-zinc-800 border-zinc-700" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="bg-zinc-800 border-zinc-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="due_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="time" 
                        className="bg-zinc-800 border-zinc-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="xp_reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>XP Points (10-100)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={10}
                        max={100}
                        step={5}
                        value={[field.value]}
                        onValueChange={(value) => {
                          field.onChange(value[0]);
                          setPoints(value[0]);
                        }}
                      />
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>10</span>
                        <span>{points}</span>
                        <span>100</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_group_task"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex space-x-4"
                      onValueChange={(value) => field.onChange(value === "group")}
                      value={field.value ? "group" : "personal"}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="personal" id="personal" />
                        <Label htmlFor="personal">Personal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="group" id="group" />
                        <Label htmlFor="group">Group Task</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Saving..." : editTask ? "Update Task" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
