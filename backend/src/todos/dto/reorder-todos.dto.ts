import { ArrayUnique, IsArray, IsInt } from 'class-validator';

export class ReorderTodosDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  ids: number[];
}
