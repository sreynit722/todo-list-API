import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Todo } from './entities/todo.entity';
import { TodoStatus } from './todo-status.enum';

@Injectable()
export class TodosService {
  constructor(@InjectRepository(Todo) private readonly repo: Repository<Todo>) {}

  findAll(): Promise<Todo[]> {
    return this.repo.find({ order: { position: 'ASC', id: 'DESC' } });
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.repo.findOneBy({ id });
    if (!todo) throw new NotFoundException(`Todo ${id} not found`);
    return todo;
  }

  async create(dto: CreateTodoDto): Promise<Todo> {
    // New tasks go to the top of the list
    const row = await this.repo
      .createQueryBuilder('todo')
      .select('MIN(todo.position)', 'min')
      .getRawOne<{ min: string | null }>();
    const currentMin = row?.min == null ? 0 : Number(row.min);

    const todo = this.repo.create({
      title: dto.title,
      status: dto.status ?? TodoStatus.TODO,
      date: dto.date ?? null,
      priority: dto.priority ?? false,
      position: currentMin - 1,
    });
    return this.repo.save(todo);
  }

  async update(id: number, dto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id);
    this.repo.merge(todo, dto);
    return this.repo.save(todo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException(`Todo ${id} not found`);
  }

  async reorder(ids: number[]): Promise<Todo[]> {
    await this.repo.manager.transaction(async (manager) => {
      for (let index = 0; index < ids.length; index++) {
        await manager.update(Todo, ids[index], { position: index });
      }
    });
    return this.findAll();
  }
}
