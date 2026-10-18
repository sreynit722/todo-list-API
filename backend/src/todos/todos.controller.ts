import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ReorderTodosDto } from './dto/reorder-todos.dto';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll() {
    return this.todosService.findAll(); // 200
  }

  @Post()
  create(@Body() dto: CreateTodoDto) {
    return this.todosService.create(dto); // 201 or 400
  }

  // Declared before ':id' routes so "reorder" is never read as an id
  @Put('reorder')
  reorder(@Body() dto: ReorderTodosDto) {
    return this.todosService.reorder(dto.ids); // 200 or 400
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(id, dto); // 200, 400 or 404
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.remove(id); // 204 or 404
  }
}
