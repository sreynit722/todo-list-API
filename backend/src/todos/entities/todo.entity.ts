import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TodoStatus } from '../todo-status.enum';

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'enum', enum: TodoStatus, default: TodoStatus.TODO })
  status: TodoStatus;

  // 'YYYY-MM-DD' string, or null when no date is set
  @Column({ type: 'date', nullable: true })
  date: string | null;

  @Column({ default: false })
  priority: boolean;

  // Lower number = higher in the list (used for drag-and-drop ordering)
  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;
}
