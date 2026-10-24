import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
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

  // Owner of the task. Nullable only so tasks created before accounts existed
  // survive the upgrade; the first user to sign up inherits them.
  @Index()
  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @CreateDateColumn()
  createdAt: Date;
}
