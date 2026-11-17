// reservation/dto/disponibilite-query.dto.ts
import { IsDateString, IsNotEmpty } from 'class-validator';

export class ListeDisponibleDto {
  @IsDateString()
  @IsNotEmpty({message: "Date Debut est obligatoire"})
  dateDebut: string;

  @IsDateString()
  @IsNotEmpty({message: "Date Fin est obligatoire"})
  dateFin: string;
}