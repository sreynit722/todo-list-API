import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './entities/todo.entity';
import { TodoStatus } from './todo-status.enum';

/** Every method only sees the tasks that belong to the given user. */
@Injectable()
export class TodosService {
  constructor(@InjectRepository(Todo) private readonly repo: Repository<Todo>) {}

  findAll(userId: number): Promise<Todo[]> {
    return this.repo.find({
      where: { userId },
      order: { position: 'ASC', id: 'DESC' },
    });
  }

  // Someone else's task is reported as "not found", not "forbidden",
  // so people cannot find out which ids exist.
  async findOne(id: number, userId: number): Promise<Todo> {
    const todo = await this.repo.findOneBy({ id, userId });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async create(userId: number, dto: CreateTodoDto): Promise<Todo> {
    // New tasks go to the top of this user's list
    const row = await this.repo
      .createQueryBuilder('todo')
      .select('MIN(todo.position)', 'min')
      .where('todo.userId = :userId', { userId })
      .getRawOne<{ min: string | null }>();
    const currentMin = row?.min == null ? 0 : Number(row.min);

    const todo = this.repo.create({
      title: dto.title,
      status: dto.status ?? TodoStatus.TODO,
      date: dto.date ?? null,
      priority: dto.priority ?? false,
      position: currentMin - 1,
      userId,
    });
    return this.repo.save(todo);
  }

  async update(id: number, userId: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id, userId);
    this.repo.merge(todo, dto);
    return this.repo.save(todo);
  }

  async remove(id: number, userId: number): Promise<void> {
    const result = await this.repo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException(`Todo ${id} not found`);
  }

  async reorder(userId: number, ids: number[]): Promise<Todo[]> {
    await this.repo.manager.transaction(async (manager) => {
      for (let index = 0; index < ids.length; index++) {
        // The userId condition means ids that are not yours are silently ignored
        await manager.update(Todo, { id: ids[index], userId }, { position: index });
      }
    });
    return this.findAll(userId);
  }

  // Used once: the first account inherits tasks made before login existed
  async adoptUnownedTodos(userId: number): Promise<void> {
    await this.repo.update({ userId: IsNull() }, { userId });
  }
}
