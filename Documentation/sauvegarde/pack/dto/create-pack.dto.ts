import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString,
  IsUrl, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class ComposantPackDto {
  @IsString() codeMateriel: string;
  @IsInt() @Min(1) quantite: number;
}

export class CreatePackDto {
  @IsString() @MaxLength(150) libelle: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;

  @IsString()
  @IsOptional()
  typesEvenement: string;

  @IsOptional() @IsNumber() @Min(0) tarifJournalier?: number;

  @IsOptional() @IsNumber() @Min(0) prixCaution?: number;

  @IsString() 
  @IsOptional()
  statutPack: string

  @IsOptional()
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true }) @Type(() => ComposantPackDto)
  composants: ComposantPackDto[];
}