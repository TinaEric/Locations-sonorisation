import { IsNotEmpty, IsDateString, IsNumber, Min, IsString } from 'class-validator';

export class VerifierDispoDto {

  @IsDateString()
  @IsNotEmpty({ message: 'La date de début prévue est obligatoire' })
  dateDebutPrevue: string;

  @IsDateString()
  @IsNotEmpty({ message: 'La date de fin prévue est obligatoire' })
  dateFinPrevue: string;

  @IsNumber()
  @Min(0, { message: 'La quantité doit être un nombre positif' })
  quantite: number;

  @IsNotEmpty({ message: 'Le code matériel doit être mentionné pour vérifier la disponibilité' })
  @IsString({ message: 'Le code matériel doit être une chaîne de caractères' })
  CodeMateriel: any;
}
