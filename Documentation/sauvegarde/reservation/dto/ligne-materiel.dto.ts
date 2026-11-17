import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
  } from 'class-validator';
  
  export class LigneMaterielDto {
    @IsString()
    @IsNotEmpty({ message: 'Le code matériel est obligatoire.' })
    codeMateriel: string;
  
    @IsInt({ message: 'La quantité doit être un entier.' })
    @Min(1, { message: 'La quantité doit être d\'au moins 1.' })
    quantite: number;
  
    @IsOptional()
    @IsNumber()
    @Min(0)
    tarifApplique?: number;
  }