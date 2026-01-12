export type TaskList = {
  count: number;
  list: Array<Task>;
};

export type Task = {
  id: string;
  title: string;
  notes?: string;
  status: string;
  due?: string;
  completed?: string;
};
