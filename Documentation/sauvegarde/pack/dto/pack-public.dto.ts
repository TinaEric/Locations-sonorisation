import { IsDateString, IsNotEmpty } from 'class-validator';

export class PackPublicDto {
  @IsDateString()
  @IsNotEmpty({ message: 'Date début obligatoire.' })
  dateDebut: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Date fin obligatoire.' })
  dateFin: string;
}