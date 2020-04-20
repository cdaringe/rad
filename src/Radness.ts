import { Task } from "./Task.ts";
export interface Radness {
  tasks: Record<string, Task>;
}

export const from = (radness: Radness) => {
  // @todo - typecheck this motha trucka: https://github.com/vriad/zod
  return radness as Radness;
};

export { Task };
