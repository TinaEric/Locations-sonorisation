import { IsString, IsNotEmpty, IsDateString, IsNumber, Min,ArrayMinSize, IsOptional, IsArray,IsEnum, ValidateNested, IsInt, ValidateIf, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ModeRetrait, StatutLocation } from '../enum/enum-location.js';


class ItemLigneLocationDto {
  @IsString()
  @IsNotEmpty()
  codeMateriel: string;

  @IsInt()
  @Min(1, { message: 'La quantité doit être d\'au moins 1.' })
  quantite: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tarifApplique: number;
}

export class LigneMaterielDto {
  @IsString() codeMateriel: string;
  @IsInt() @Min(1) quantite: number;
  @IsNumber() @Min(0) @IsOptional() tarifApplique: number;
}

export class CreateReservationDto {
  @IsString() 
  @IsNotEmpty({ message: 'Le locataire doit mentionné dans un location' })
  idUser: any;

  @IsDateString()
  @IsNotEmpty({ message: 'La date de début prévue est obligatoire' })
  dateDebutPrevue: string;

  @IsDateString()
  @IsNotEmpty({ message: 'La date de fin prévue est obligatoire' })
  dateFinPrevue: string;

  @IsEnum(StatutLocation)
  @IsNotEmpty({ message: 'Le statut de la location est obligatoire' })
  @IsOptional()
  statutLocation: StatutLocation;

  @IsOptional() @IsString() lieuEvenement?: string;
  @IsOptional() @IsString() remarques?: string;
  @IsOptional() @IsEnum(ModeRetrait) modeRetrait?: ModeRetrait;
  @IsOptional() @IsNumber() @Min(0) fraisLivraison?: number;
  @IsDateString() @IsOptional() dateRetourReel?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  montantTotal: number;


  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemLigneLocationDto)
  ligneLocations: ItemLigneLocationDto[];

  
  @IsIn(['pack', 'personnalise', 'materiel'])
  actionLocataire: 'pack' | 'personnalise' | 'materiel';

  // pack et personnalise
  @ValidateIf((o) => o.actionLocataire !== 'materiel')
  @IsString()
  codePack?: string;

  // pack : nombre de packs commandés (défaut 1)
  @ValidateIf((o) => o.actionLocataire === 'pack')
  @IsOptional() @IsInt() @Min(1)
  quantitePack?: number;

  // personnalise et materiel : liste finale du matériel
  @ValidateIf((o) => o.actionLocataire !== 'pack')
  @IsArray() @ArrayMinSize(1)
  @ValidateNested({ each: true }) @Type(() => LigneMaterielDto)
  materiels?: LigneMaterielDto[];
}

