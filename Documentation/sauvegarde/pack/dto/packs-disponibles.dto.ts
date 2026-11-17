import { IsDateString, IsOptional, IsString } from 'class-validator';

export class PacksDisponiblesDto {
  @IsDateString() dateDebut: string;
  @IsDateString() dateFin: string;
  @IsOptional() @IsString() typeEvenement?: string;
}