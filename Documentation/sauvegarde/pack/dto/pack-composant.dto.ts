import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComposantPackDto {
  @IsString()
  @MaxLength(10)
  codeMateriel: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantite: number;
}